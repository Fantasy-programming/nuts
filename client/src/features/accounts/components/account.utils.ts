import { AccountWTrend, GroupedAccount } from "../services/account.types";
import { formatDistanceToNow, parseISO } from 'date-fns';


export function groupAccountsByType(accounts: AccountWTrend[]): GroupedAccount[] {
  const grouped: Record<string, GroupedAccount> = {};

  for (const account of accounts) {
    if (!grouped[account.type]) {
      grouped[account.type] = {
        type: account.type,
        total: 0,
        trend: 0,
        accounts: [],
      };
    }

    grouped[account.type].total += account.balance;
    grouped[account.type].trend += account.trend;
    grouped[account.type].accounts.push(account);
  }

  return Object.values(grouped);
}

export function findAccountByIdFromGroups(
  groups: GroupedAccount[],
  id: string
): AccountWTrend | undefined {
  for (const group of groups) {
    const account = group.accounts.find(acc => acc.id === id);
    if (account) return account;
  }
  return undefined;
}



export function timeAgo(isoDate: string): string {
  const raw = formatDistanceToNow(parseISO(isoDate), { addSuffix: true });
  return raw.replace(/^about /, "~ ");
}
