"""
Central place for application-wide constants and thresholds.
This makes the business logic in the services easier to read and configure.
"""

# --- Insights Generation ---
INSIGHTS_SPENDING_SPIKE_THRESHOLD = 1.5  # e.g., 1.5x the previous month's spending
INSIGHTS_MIN_SPEND_FOR_SPIKE_ALERT = (
    50.0  # Minimum dollar amount to trigger a spike alert
)
INSIGHTS_MIN_TRANSACTIONS_FOR_CLUSTERING = 10
INSIGHTS_MAX_CLUSTERS_FOR_SPENDING_PATTERNS = 4
INSIGHTS_NET_WORTH_GROWTH_THRESHOLD = 1.02  # 2% MoM growth
INSIGHTS_NET_WORTH_DECLINE_THRESHOLD = 0.98  # 2% MoM decline
INSIGHTS_HIGH_GOAL_CONTRIBUTION_THRESHOLD = (
    500.0  # Warn if required monthly saving is over this amount
)

# --- Retirement Simulation ---
SIMULATION_POST_RETIREMENT_YEARS = 25  # How many years to simulate after retirement
SIMULATION_RECESSION_IMPACT_DEFAULT = 0.20  # 20% portfolio hit
SIMULATION_JOB_LOSS_DURATION_DEFAULT = 6  # 6 months
SIMULATION_NEW_CHILD_INITIAL_COST_DEFAULT = 5000.0
SIMULATION_BUSINESS_STARTUP_COST_DEFAULT = 20000.0
SIMULATION_EMERGENCY_COST_DEFAULT = 10000.0
