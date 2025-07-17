import { Card, CardContent, CardHeader, CardTitle } from "@/core/components/ui/card";
import { AccountWTrend } from "../services/account.types";
import { TrendingUp, TrendingDown } from "lucide-react";

interface SummaryCardProps {
  accounts: AccountWTrend[];
}

interface CategoryBreakdown {
  name: string;
  total: number;
  accounts: AccountWTrend[];
}

interface SummaryData {
  assets: CategoryBreakdown[];
  liabilities: CategoryBreakdown[];
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
}

// Define which account types are assets vs liabilities
const ASSET_TYPES = ['cash', 'savings', 'investment', 'checking'] as const;
const LIABILITY_TYPES = ['credit'] as const;

export const SummaryCard = ({ accounts }: SummaryCardProps) => {
  const calculateSummaryData = (): SummaryData => {
    const assets: CategoryBreakdown[] = [];
    const liabilities: CategoryBreakdown[] = [];

    // Group accounts by type and categorize as assets or liabilities
    const accountGroups = accounts.reduce((groups, account) => {
      if (!groups[account.type]) {
        groups[account.type] = [];
      }
      groups[account.type].push(account);
      return groups;
    }, {} as Record<string, AccountWTrend[]>);

    // Process asset types
    ASSET_TYPES.forEach(type => {
      const typeAccounts = accountGroups[type] || [];
      if (typeAccounts.length > 0) {
        const total = typeAccounts.reduce((sum, account) => sum + account.balance, 0);
        assets.push({
          name: getTypeDisplayName(type),
          total,
          accounts: typeAccounts
        });
      }
    });

    // Process liability types (credit cards are debt, so we show them as positive amounts in liabilities)
    LIABILITY_TYPES.forEach(type => {
      const typeAccounts = accountGroups[type] || [];
      if (typeAccounts.length > 0) {
        const total = Math.abs(typeAccounts.reduce((sum, account) => sum + account.balance, 0));
        liabilities.push({
          name: getTypeDisplayName(type),
          total,
          accounts: typeAccounts
        });
      }
    });

    const totalAssets = assets.reduce((sum, category) => sum + category.total, 0);
    const totalLiabilities = liabilities.reduce((sum, category) => sum + category.total, 0);
    const netWorth = totalAssets - totalLiabilities;

    return {
      assets,
      liabilities,
      totalAssets,
      totalLiabilities,
      netWorth
    };
  };

  const getTypeDisplayName = (type: string): string => {
    const displayNames = {
      cash: 'Cash',
      savings: 'Savings',
      investment: 'Investments',
      checking: 'Checking',
      credit: 'Credit Cards'
    };
    return displayNames[type as keyof typeof displayNames] || type;
  };

  const formatCurrency = (amount: number): string => {
    return amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const summaryData = calculateSummaryData();

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="uppercase tracking-widest font-medium text-sm text-foreground/80">
          Financial Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Assets Section */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="h-4 w-4 text-green-500" />
            <h3 className="font-semibold text-sm">Assets</h3>
            <span className="font-mono text-sm text-green-600">
              ${formatCurrency(summaryData.totalAssets)}
            </span>
          </div>
          <div className="space-y-2 ml-6">
            {summaryData.assets.map((category) => (
              <div key={category.name} className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">{category.name}</span>
                <span className="font-mono">${formatCurrency(category.total)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Liabilities Section */}
        {summaryData.liabilities.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <TrendingDown className="h-4 w-4 text-red-500" />
              <h3 className="font-semibold text-sm">Liabilities</h3>
              <span className="font-mono text-sm text-red-600">
                ${formatCurrency(summaryData.totalLiabilities)}
              </span>
            </div>
            <div className="space-y-2 ml-6">
              {summaryData.liabilities.map((category) => (
                <div key={category.name} className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">{category.name}</span>
                  <span className="font-mono">${formatCurrency(category.total)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Net Worth Summary */}
        <div className="pt-4 border-t border-border">
          <div className="flex justify-between items-center">
            <span className="font-semibold">Net Worth</span>
            <span className={`font-mono font-semibold ${summaryData.netWorth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ${formatCurrency(Math.abs(summaryData.netWorth))}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};