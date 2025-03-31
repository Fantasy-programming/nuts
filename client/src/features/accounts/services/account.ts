import { api as axios } from "@/lib/axios";
import type { Account, AccountCreate, AccountWTrend, AccountBalanceTimeline } from "./account.types";

const BASEURI = "/accounts";

const getAccounts = async (): Promise<Account[]> => {
  const { data } = await axios.get<Account[]>(`${BASEURI}`);
  return data;
};


const getAccountsWTrends = async (): Promise<AccountWTrend[]> => {
  const { data } = await axios.get<AccountWTrend[]>(`${BASEURI}/trends`);
  return data;
};


const getAccountsBalanceTimeline = async (): Promise<AccountBalanceTimeline[]> => {
  const { data } = await axios.get<AccountBalanceTimeline[]>(`${BASEURI}/timeline`);
  return data;
};

const createAccount = async (account: AccountCreate): Promise<Account> => {
  const data = await axios.post<Account>(`${BASEURI}/`, account);
  return data.data;
};

export const accountService = { getAccounts, createAccount };
