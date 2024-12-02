import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:3001",
});

export interface Transaction {
  id: string;
  date: string;
  description: string;
  category: string;
  amount: number;
}

export const getTransactions = async (): Promise<Transaction[]> => {
  const { data } = await api.get<Transaction[]>("/transactions");
  return data;
};
