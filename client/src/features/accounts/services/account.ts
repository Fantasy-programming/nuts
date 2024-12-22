import { api as axios } from "@/lib/axios";

export interface Account {
  id: string;
  name: string;
  balance: number;
  type: "cash" | "savings" | "investment" | "credit";
  color: string;
  currency: string;
}

const getAccounts = async (): Promise<Account[]> => {
  const { data } = await axios.get<Account[]>("/account/");
  return data;
};

const createAccount = async (
  account: Omit<Account, "id">,
): Promise<Account> => {
  const data = await axios.post<Account>("/account/", account);
  return data.data;
};

export const accountService = { getAccounts, createAccount };
