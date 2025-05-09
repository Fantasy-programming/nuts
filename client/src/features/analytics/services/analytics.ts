import { api } from "@/lib/axios";

export interface IncomeExpenseData {
  period: string;
  income: number;
  expenses: number;
}

export interface AssetLiabilityData {
  period: string;
  assets: number;
  liabilities: number;
}

export interface CategorySpendingData {
  category: string;
  amount: number;
  percentage: number;
}

export interface BudgetData {
  category: string;
  budget: number;
  actual: number;
  variance: number;
}

/**
 * Get income vs expenses data for a specific timeframe
 * @param timeframe The time period to get data for (day, week, month, quarter, year, all)
 * @returns Promise with income and expense data
 */
const getIncomeExpense = async (timeframe: string): Promise<IncomeExpenseData[]> => {
  const { data } = await api.get(`/analytics/income-expense?timeframe=${timeframe}`);
  return data;
};

/**
 * Get assets vs liabilities data (net worth) for a specific timeframe
 * @param timeframe The time period to get data for (day, week, month, quarter, year, all)
 * @returns Promise with asset and liability data
 */
const getAssetsLiabilities = async (timeframe: string): Promise<AssetLiabilityData[]> => {
  const { data } = await api.get(`/analytics/assets-liabilities?timeframe=${timeframe}`);
  return data;
};

/**
 * Get spending by category for a specific timeframe
 * @param timeframe The time period to get data for (day, week, month, quarter, year, all)
 * @returns Promise with category spending data
 */
const getCategorySpending = async (timeframe: string): Promise<CategorySpendingData[]> => {
  const { data } = await api.get(`/analytics/category-spending?timeframe=${timeframe}`);
  return data;
};

/**
 * Get budget vs actual spending for a specific timeframe
 * @param timeframe The time period to get data for (day, week, month, quarter, year, all)
 * @returns Promise with budget data
 */
const getBudgetComparison = async (timeframe: string): Promise<BudgetData[]> => {
  const { data } = await api.get(`/analytics/budget-comparison?timeframe=${timeframe}`);
  return data;
};

/**
 * Get financial health score data
 * @returns Promise with financial health score and metrics
 */
const getFinancialHealth = async () => {
  const { data } = await api.get("/analytics/financial-health");
  return data;
};

export const analyticsService = {
  getIncomeExpense,
  getAssetsLiabilities,
  getCategorySpending,
  getBudgetComparison,
  getFinancialHealth,
};
