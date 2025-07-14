import { api as axios } from "@/lib/axios";
import type { Account, AccountCreate, AccountWTrend, AccountBalanceTimeline } from "./account.types";
import { TellerConnectEnrollment } from 'teller-connect-react';

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
  console.log(account)
  const data = await axios.post<Account>(`${BASEURI}/`, account);
  return data.data;
};


const linkTellerAccount = async (payload: TellerConnectEnrollment) => {
  await axios.post(`${BASEURI}/teller/connect`, payload);
};

const linkMonoAccount = async (payload: { code: string, institution: string, institutionID: string }) => {
  await axios.post(`${BASEURI}/mono/connect`, payload);
};

const updateAccount = async ({ id, account }: { id: string, account: AccountCreate }): Promise<Account> => {
  const data = await axios.put<Account>(`${BASEURI}/${id}`, account);
  return data.data;
};


const deleteAccount = async (id: string) => {
  await axios.delete(`${BASEURI}/${id}`);
};

export const accountService = { getAccounts, getAccountsBalanceTimeline, getAccountsWTrends, createAccount, updateAccount, deleteAccount, linkMonoAccount, linkTellerAccount };
