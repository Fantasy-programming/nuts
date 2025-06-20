import asyncio
import os
import csv
import threading
from datetime import datetime, date
from contextlib import asynccontextmanager

import pandas as pd
from fastapi import FastAPI, HTTPException
from statsmodels.tsa.holtwinters import ExponentialSmoothing
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler

from .config import settings, logger
from .models import (
    PredictRequest,
    PredictResponse,
    FeedbackRequest,
    InsightsRequest,
    ForecastRequest,
    RetirementSimulationRequest,
)
from . import ml_logic
from . import constants

# A lock to prevent race conditions when writing to the feedback CSV file
feedback_lock = threading.Lock()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Load the ML models
    ml_logic.load_models()
    yield
    # Clean up resources if needed on shutdown
    ml_logic.ml_artifacts.clear()
    logger.info("ML models cleared on shutdown.")


app = FastAPI(
    title="Nuts AI Service",
    description="An API for financial transaction categorization, insights, and forecasting.",
    version="1.0.0",
    lifespan=lifespan,
)


def _generate_insights_logic(request_data: InsightsRequest) -> dict:
    # This function is now much cleaner due to Pydantic model validation
    insights = []
    logger.info(f"Generating insights for user {request_data.user_id}")

    # Rule 1: High Spending in a Category
    for cat_name, monthly_data in request_data.monthly_spending_by_category.items():
        if cat_name == "Uncategorized" or len(monthly_data) < 2:
            continue
        # Sort months: keys are "YYYY-MM" strings
        months_sorted = sorted(monthly_data.keys())
        last_month_spend = monthly_data[months_sorted[-1]]
        prev_month_spend = monthly_data[months_sorted[-2]]

        if (
            last_month_spend
            > prev_month_spend * constants.INSIGHTS_SPENDING_SPIKE_THRESHOLD
            and last_month_spend > constants.INSIGHTS_MIN_SPEND_FOR_SPIKE_ALERT
        ):
            insights.append(
                {
                    "title": f"Spike in '{cat_name}' Spending!",
                    "description": f"Your spending in '{cat_name}' increased sharply from ${prev_month_spend:.2f} to ${last_month_spend:.2f} last month.",
                    "actionable_advice": f"Review recent '{cat_name}' transactions to ensure they are expected.",
                    "type": "spending_alert",
                }
            )

    # Convert transactions to DataFrame for ML/Pandas-based rules
    if request_data.recent_transactions:
        df = pd.DataFrame([t.model_dump() for t in request_data.recent_transactions])
        expense_df = df[df["type"] == "expense"].copy()

        # Rule 2: Spending Pattern Clusters
        if len(expense_df) > constants.INSIGHTS_MIN_TRANSACTIONS_FOR_CLUSTERING:
            amounts = expense_df["amount"].values.reshape(-1, 1)
            scaler = StandardScaler()
            scaled_amounts = scaler.fit_transform(amounts)
            # Ensure we have enough distinct data points to form at least 2 clusters
            n_clusters = min(
                len(set(scaled_amounts.flatten())) - 1,
                constants.INSIGHTS_MAX_CLUSTERS_FOR_SPENDING_PATTERNS,
            )
            if n_clusters >= 2:
                try:
                    kmeans = KMeans(
                        n_clusters=n_clusters, random_state=42, n_init="auto"
                    ).fit(scaled_amounts)
                    cluster_centers = scaler.inverse_transform(kmeans.cluster_centers_)
                    for center in sorted(cluster_centers.flatten()):
                        if center > 10:  # Only show significant patterns
                            insights.append(
                                {
                                    "title": f"Recurring Spending Pattern Around ${center:.2f}",
                                    "description": "We've detected frequent expenses around this amount.",
                                    "actionable_advice": "Are these necessary daily/weekly habits? Small changes add up.",
                                    "type": "spending_pattern",
                                }
                            )
                except Exception as e:
                    logger.warning(
                        f"KMeans clustering failed for user {request_data.user_id}: {e}"
                    )

    # Rule 3: Net Worth Growth/Decline
    if len(request_data.net_worth_history) >= 2:
        history_sorted = sorted(request_data.net_worth_history, key=lambda p: p.date)
        current_nw = history_sorted[-1].value
        prev_nw = history_sorted[-2].value
        if current_nw > prev_nw * constants.INSIGHTS_NET_WORTH_GROWTH_THRESHOLD:
            insights.append(
                {
                    "title": "Excellent Net Worth Growth!",
                    "description": f"Your net worth increased by ${(current_nw - prev_nw):.2f} recently. Keep up the great work!",
                    "actionable_advice": "Consistent growth is key to financial freedom. Consider if you can optimize your investment strategy further.",
                    "type": "net_worth_positive",
                }
            )
        elif current_nw < prev_nw * constants.INSIGHTS_NET_WORTH_DECLINE_THRESHOLD:
            insights.append(
                {
                    "title": "Net Worth Decline Detected",
                    "description": f"Your net worth decreased by ${(prev_nw - current_nw):.2f} recently.",
                    "actionable_advice": "Review large expenses or investment performance over the last month to identify the cause.",
                    "type": "net_worth_negative",
                }
            )

    # Rule 4: Goal Progress
    for goal in request_data.financial_goals:
        if goal.target_amount <= goal.current_amount:
            continue  # Goal already achieved

        today = date.today()
        months_to_target = (goal.target_date.year - today.year) * 12 + (
            goal.target_date.month - today.month
        )

        if months_to_target <= 0:
            continue  # Goal is past due

        required_monthly_contribution = (
            goal.target_amount - goal.current_amount
        ) / months_to_target
        if (
            required_monthly_contribution
            > constants.INSIGHTS_HIGH_GOAL_CONTRIBUTION_THRESHOLD
        ):
            insights.append(
                {
                    "title": f"Urgent: Boost '{goal.name}' Goal Contributions!",
                    "description": f"To reach your '{goal.name}' goal by {goal.target_date.strftime('%b %Y')}, you need to save approx. ${required_monthly_contribution:.2f}/month.",
                    "actionable_advice": "This is a significant amount. Review your budget to free up more funds for this priority goal.",
                    "type": "goal_alert",
                }
            )

    if not insights:
        insights.append(
            {
                "title": "Financial Health Check-up",
                "description": "Your finances look stable this month. Keep monitoring your trends.",
                "actionable_advice": "Consider setting a new savings goal or reviewing your investment allocations.",
                "type": "general_advice",
            }
        )

    return {"insights": insights}


def _run_retirement_simulation_logic(req: RetirementSimulationRequest) -> dict:
    # Corrected and clarified simulation logic
    portfolio_history = []
    event_markers = []

    current_portfolio = req.current_savings

    for year_offset in range(
        req.retirement_age
        - req.current_age
        + constants.SIMULATION_POST_RETIREMENT_YEARS
    ):
        current_age = req.current_age + year_offset

        # Apply life event scenarios for the current year
        for scenario in req.scenarios:
            if current_age == scenario.starting_year:
                logger.info(f"Applying scenario '{scenario.type}' at age {current_age}")
                event_markers.append(
                    {
                        "year": current_age,
                        "event": scenario.type.replace("_", " ").title(),
                    }
                )
                # Refactor scenario logic to be cleaner
                if scenario.type == "new_home":
                    cost = scenario.details.cost or 0
                    dp_percent = scenario.details.down_payment_percent or 0.2
                    current_portfolio -= cost * dp_percent
                    logger.info(
                        f"New home: down payment of {dp_percent:.2f} applied. Portfolio: {current_portfolio:.2f}"
                    )
                # ... other scenarios handled similarly
                elif scenario.type == "recession":
                    current_portfolio *= 1 - (
                        scenario.details.impact_percent
                        or constants.SIMULATION_RECESSION_IMPACT_DEFAULT
                    )
                elif scenario.type == "job_loss":
                    # This is more complex; for simplicity, we assume it impacts annual contribution for a year
                    # A better model would have monthly steps. This is a simplification.
                    # For now, we assume it means one less year of contributions, handled below.
                    duration_months = (
                        scenario.details.duration_month
                        or constants.SIMULATION_JOB_LOSS_DURATION_DEFAULT
                    )
                    current_portfolio -= req.monthly_expenses * duration_months
                    logger.info(
                        f"Job loss: {duration_months} months of expenses. Portfolio: {current_portfolio:.2f}"
                    )
                elif scenario.type == "new_child":
                    current_portfolio -= (
                        scenario.details.initial_cost
                        or constants.SIMULATION_NEW_CHILD_INITIAL_COST_DEFAULT
                    )
                    logger.info(
                        f"New child: initial cost {scenario.details.initial_cost:.2f} applied. Portfolio: {current_portfolio:.2f}"
                    )
                elif scenario.type == "starting_business":
                    current_portfolio -= (
                        scenario.details.starting_business
                        or constants.SIMULATION_BUSINESS_STARTUP_COST_DEFAULT
                    )
                    logger.info(
                        f"Starting business: startup cost {scenario.details.starting_business:.2f} applied. Portfolio: {current_portfolio:.2f}"
                    )
                elif scenario.type == "emergency":
                    current_portfolio -= (
                        scenario.details.cost
                        or constants.SIMULATION_EMERGENCY_COST_DEFAULT
                    )
                    logger.info(
                        f"Emergency: cost {scenario.details.cost:.2f} applied. Portfolio: {current_portfolio:.2f}"
                    )

        # Accumulation or Withdrawal Phase
        is_accumulation = current_age < req.retirement_age

        # 1. Add contributions (if in accumulation phase)
        if is_accumulation:
            # Simple check to skip contribution if job loss event happened this year
            job_loss_this_year = any(
                s.type == "job_loss" and s.starting_year == current_age
                for s in req.scenarios
            )
            if not job_loss_this_year:
                current_portfolio += req.annual_contribution

        # 2. Apply market returns
        current_portfolio *= 1 + req.annual_return_rate

        # 3. Withdraw funds (if in retirement phase)
        if not is_accumulation:
            # Inflate expenses from "today's dollars" to "future dollars"
            years_since_start = current_age - req.current_age
            annual_expenses_future = (req.monthly_expenses_today * 12) * (
                (1 + req.inflation_rate) ** years_since_start
            )
            current_portfolio -= annual_expenses_future

        portfolio_history.append(
            {"year": current_age, "value": max(0, current_portfolio)}
        )

    # Determine if the funds last
    final_portfolio_value = portfolio_history[-1]["value"]
    success = final_portfolio_value > 0
    summary_message = (
        f"Simulation successful! You are projected to have ${final_portfolio_value:,.2f} at age {portfolio_history[-1]['year']}."
        if success
        else "Warning: Based on this simulation, you may run out of funds in retirement. Consider increasing contributions or adjusting your retirement age."
    )

    return {
        "projected_savings": portfolio_history,
        "event_markers": event_markers,
        "summary_message": summary_message,
        "is_successful": success,
    }


@app.get("/")
def health_check():
    return {
        "status": "AI service is running",
        "model_loaded": ml_logic.ml_artifacts["model"] is not None,
    }


@app.post("/predict_category", response_model=PredictResponse)
async def predict_category(req: PredictRequest):
    if not req.description:
        raise HTTPException(status_code=400, detail="Description is required")

    # The ML prediction itself is CPU-bound, run in a thread to not block the event loop
    predicted_category = await asyncio.to_thread(ml_logic.predict, req.description)

    return PredictResponse(
        description=req.description, predicted_category=predicted_category
    )


@app.post("/train_feedback")
async def train_feedback(feedback: FeedbackRequest):
    def _log_feedback_safely():
        with feedback_lock:
            try:
                file_exists = os.path.isfile(settings.FEEDBACK_FILE_PATH)
                with open(
                    settings.FEEDBACK_FILE_PATH, "a", newline="", encoding="utf-8"
                ) as f:
                    writer = csv.writer(f)
                    if not file_exists:
                        writer.writerow(["description", "category"])
                    writer.writerow([feedback.description, feedback.category])
            except Exception as e:
                logger.error(f"Failed to log feedback: {e}")
                # We re-raise to propagate the error to the main thread
                raise

    try:
        await asyncio.to_thread(_log_feedback_safely)
        logger.info(
            f"Received feedback: '{feedback.description}' -> '{feedback.category}'"
        )
        return {"message": "Feedback received and logged for future training."}
    except Exception:
        raise HTTPException(
            status_code=500, detail="Could not process feedback at this time."
        )


@app.post("/insights")
async def get_insights(request_data: InsightsRequest):
    return await asyncio.to_thread(_generate_insights_logic, request_data)


@app.post("/forecast_spending")
async def forecast_spending(request_data: ForecastRequest):
    def _generate_forecast():
        user_id = request_data.user_id
        historical_monthly_spending = request_data.historical_monthly_spending
        active_context = request_data.active_context

        if not historical_monthly_spending:
            return {"message": "No historical spending data for forecast"}

        df_hist = pd.DataFrame(historical_monthly_spending)
        if df_hist.empty:
            return {"message": "Empty historical spending data"}

        df_hist["month_dt"] = pd.to_datetime(df_hist["month"])
        df_hist = df_hist.sort_values("month_dt")

        overall_forecast_amount = 0.0
        category_forecasts = []

        overall_monthly_sum = df_hist.groupby("month_dt")["total_amount"].sum()
        if len(overall_monthly_sum) >= 3:
            try:
                model = ExponentialSmoothing(
                    overall_monthly_sum,
                    trend="add",
                    seasonal="add",
                    seasonal_periods=12,
                    initialization_method="estimated",
                ).fit()
                forecast_result = model.forecast(1)
                overall_forecast_amount = float(forecast_result.iloc[0])
            except Exception as e:
                logger.error(f"Holt-Winters overall forecast failed: {e}")
                overall_forecast_amount = overall_monthly_sum.iloc[-1]
        elif len(overall_monthly_sum) > 0:
            overall_forecast_amount = overall_monthly_sum.iloc[-1]

        overall_forecast = {
            "category_name": "Overall",
            "forecasted_amount": max(0.0, overall_forecast_amount),
        }

        overall_forecast = {
            "category_id": None,
            "category_name": "Overall",
            "month": (overall_monthly_sum.index[-1] + pd.DateOffset(months=1)).strftime(
                "%Y-%m"
            )
            if len(overall_monthly_sum) > 0
            else (datetime.now() + pd.DateOffset(months=1)).strftime("%Y-%m"),
            "forecasted_amount": max(
                0.0, overall_forecast_amount
            ),  # Forecast can't be negative
            "confidence_score": overall_confidence_score,
        }

        # Category-specific Forecasts
        for category_name, category_df in df_hist.groupby("category_name"):
            cat_monthly_sum = category_df.set_index("month_dt")["total_amount"]
            cat_forecast_amount = 0.0
            cat_confidence_score = 0.0

            if len(cat_monthly_sum) >= 3:  # At least 3 points for category forecast
                try:
                    # Use a simpler model like simple moving average or last value if not enough data for Holt-Winters
                    model = ExponentialSmoothing(
                        cat_monthly_sum,
                        trend="add",
                        seasonal=None,
                        initialization_method="estimated",
                    ).fit()
                    forecast_result = model.forecast(1)
                    cat_forecast_amount = float(forecast_result.iloc[0])
                    cat_confidence_score = 0.7
                except Exception as e:
                    logger.error(
                        f"Holt-Winters category forecast for {category_name} failed: {e}"
                    )
                    cat_forecast_amount = (
                        cat_monthly_sum.iloc[-1] if len(cat_monthly_sum) > 0 else 0.0
                    )
                    cat_confidence_score = 0.5
            elif len(cat_monthly_sum) > 0:
                cat_forecast_amount = cat_monthly_sum.iloc[-1]  # Just last month's sum
                cat_confidence_score = 0.6
            else:
                continue  # No data for this category

            category_forecasts.append(
                {
                    "category_id": None,  # Needs to be mapped from name if storing ID
                    "category_name": category_name,
                    "month": (
                        cat_monthly_sum.index[-1] + pd.DateOffset(months=1)
                    ).strftime("%Y-%m")
                    if len(cat_monthly_sum) > 0
                    else (datetime.now() + pd.DateOffset(months=1)).strftime("%Y-%m"),
                    "forecasted_amount": max(0.0, cat_forecast_amount),
                    "confidence_score": cat_confidence_score,
                }
            )

        return {
            "overall_forecast": overall_forecast,
            "category_forecasts": category_forecasts,  # Assuming this gets populated
        }

    return await asyncio.to_thread(_generate_forecast)


@app.post("/simulate_retirement")
async def simulate_retirement(request_data: RetirementSimulationRequest):
    return await asyncio.to_thread(_run_retirement_simulation_logic, request_data)
