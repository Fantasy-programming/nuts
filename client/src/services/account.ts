import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:3001",
});

export interface Account {
  id: string;
  name: string;
  balance: number;
  type: "cash" | "savings" | "investment" | "credit";
}

const getAccounts = async (): Promise<Account[]> => {
  const { data } = await api.get<Account[]>("/accounts");
  return data;
};

export const accountService = { getAccounts };
