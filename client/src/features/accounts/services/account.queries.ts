import { queryOptions } from "@tanstack/react-query";
import { accountService } from "./account.ts"

export const getAllAccounts = () => queryOptions({
  queryKey: ["accounts"],
  queryFn: accountService.getAccounts
})

export const getAllAccountsWithTrends = () => queryOptions({
  queryKey: ["accounts", "trends"],
  queryFn: accountService.getAccountsWTrends
})

export const getAllAccountsBalanceTimeline = () => queryOptions({
  queryKey: ["accounts", "timeline"],
  queryFn: accountService.getAccountsBalanceTimeline
})
