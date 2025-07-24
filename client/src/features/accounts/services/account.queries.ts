import { queryOptions } from "@tanstack/react-query";
import { adaptiveAccountService } from "@/core/offline-first";

export const getAllAccounts = () => queryOptions({
  queryKey: ["accounts"],
  queryFn: adaptiveAccountService.getAccounts
})

export const getAllAccountsWithTrends = () => queryOptions({
  queryKey: ["accounts", "trends"],
  queryFn: adaptiveAccountService.getAccountsWTrends
})

export const getAllAccountsBalanceTimeline = () => queryOptions({
  queryKey: ["accounts", "timeline"],
  queryFn: adaptiveAccountService.getAccountsBalanceTimeline
})
