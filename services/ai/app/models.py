from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from datetime import date


# --- Core Data Structures ---
class Transaction(BaseModel):
    id: str
    amount: float
    date: date
    description: str
    category_name: str
    type: str  # 'expense' or 'income'


class NetWorthPoint(BaseModel):
    date: date
    value: float


class FinancialGoal(BaseModel):
    name: str
    target_date: date
    target_amount: float
    current_amount: float


# --- Request/Response Models ---
class PredictRequest(BaseModel):
    description: str


class PredictResponse(BaseModel):
    description: str
    predicted_category: str


class FeedbackRequest(BaseModel):
    description: str
    category: str


class InsightsRequest(BaseModel):
    user_id: str
    recent_transactions: List[Transaction]
    current_net_worth: float
    financial_goals: List[FinancialGoal]
    monthly_spending_by_category: Dict[
        str, Dict[str, float]
    ]  # e.g., {"Groceries": {"2023-10": 450.50}}
    net_worth_history: List[NetWorthPoint]


class ForecastRequest(BaseModel):
    user_id: str
    historical_monthly_spending: List[
        Dict[str, Any]
    ]  # Keeping this flexible for simplicity
    active_context: Optional[Dict[str, Any]] = None


class ScenarioDetail(BaseModel):
    cost: Optional[float] = None
    down_payment_percent: Optional[float] = None
    impact_percent: Optional[float] = None
    duration_months: Optional[int] = None
    initial_cost: Optional[float] = None
    startup_cost: Optional[float] = None


class Scenario(BaseModel):
    type: str
    starting_year: int = Field(..., gt=1900, lt=2200)
    details: ScenarioDetail


class RetirementSimulationRequest(BaseModel):
    current_age: int
    retirement_age: int
    current_savings: float
    annual_contribution: float
    annual_return_rate: float
    inflation_rate: float
    monthly_expenses_today: float
    scenarios: List[Scenario]
