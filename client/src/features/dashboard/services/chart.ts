import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:3001",
});

export interface ChartData {
  balanceOverview: Array<{ name: string; value: number }>;
  incomeVsExpenses: Array<{ name: string; income: number; expenses: number }>;
  expenseCategories: Array<{ name: string; value: number }>;
}

export const getChartData = async (): Promise<ChartData> => {
  const { data } = await api.get<ChartData>("/chartData");
  return data;
};
