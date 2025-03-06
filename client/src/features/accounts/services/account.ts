import { api as axios } from "@/lib/axios";
import { Account, AccountCreate } from "./account.types";

const BASEURI = "/accounts";

const getAccounts = async (): Promise<Account[]> => {
  const { data } = await axios.get<Account[]>(`${BASEURI}/`);
  return data;
};

const createAccount = async (account: AccountCreate): Promise<Account> => {
  const data = await axios.post<Account>(`${BASEURI}/`, account);
  return data.data;
};

export const accountService = { getAccounts, createAccount };
