import { api as axios } from "@/lib/axios";
import { Account, AccountCreate } from "./account.types";

const getAccounts = async (): Promise<Account[]> => {
  const { data } = await axios.get<Account[]>("/account/");
  return data;
};

const createAccount = async (
  account: AccountCreate,
): Promise<Account> => {
  const data = await axios.post<Account>("/account/", account);
  return data.data;
};

export const accountService = { getAccounts, createAccount };
