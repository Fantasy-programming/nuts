import { Card, CardHeader } from "@/core/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/core/components/ui/tabs";
import { ChartContainer } from "@/core/components/ui/chart";
import { AccountWTrend } from "../services/account.types";
import { PieChart, Pie, Cell } from "recharts";

interface SummaryCardProps {
  accounts: AccountWTrend[];
}

interface CategoryBreakdown {
  name: string;
  total: number;
  accounts: AccountWTrend[];
  color: string;
}

interface SummaryData {
  assets: CategoryBreakdown[];
  liabilities: CategoryBreakdown[];
  totalAssets: number;
  totalLiabilities: number;
}

// Define which account types are assets vs liabilities with colors
const ASSET_TYPES = [
  { type: 'investment', name: 'Investments', color: '#8B5CF6' },
  { type: 'savings', name: 'Real Estate', color: '#A855F7' }, // Using savings as Real Estate for demo
  { type: 'cash', name: 'Cash', color: '#22C55E' },
  { type: 'checking', name: 'Vehicles', color: '#F97316' },
] as const;

const LIABILITY_TYPES = [
  { type: 'credit', name: 'Loans', color: '#EAB308' },
  { type: 'credit', name: 'Credit Cards', color: '#EF4444' },
] as const;

export const SummaryCard = ({ accounts }: SummaryCardProps) => {
  const calculateSummaryData = (): SummaryData => {
    const assets: CategoryBreakdown[] = [];
    const liabilities: CategoryBreakdown[] = [];

    // Group accounts by type
    const accountGroups = accounts.reduce((groups, account) => {
      if (!groups[account.type]) {
        groups[account.type] = [];
      }
      groups[account.type].push(account);
      return groups;
    }, {} as Record<string, AccountWTrend[]>);

    // Process asset types
    ASSET_TYPES.forEach(({ type, name, color }) => {
      const typeAccounts = accountGroups[type] || [];
      if (typeAccounts.length > 0) {
        const total = typeAccounts.reduce((sum, account) => sum + account.balance, 0);
        assets.push({
          name,
          total,
          accounts: typeAccounts,
          color
        });
      }
    });

    // Process liability types (credit cards are debt, so we show them as positive amounts in liabilities)
    LIABILITY_TYPES.forEach(({ type, name, color }) => {
      const typeAccounts = accountGroups[type] || [];
      if (typeAccounts.length > 0) {
        const total = Math.abs(typeAccounts.reduce((sum, account) => sum + account.balance, 0));
        liabilities.push({
          name,
          total,
          accounts: typeAccounts,
          color
        });
      }
    });

    const totalAssets = assets.reduce((sum, category) => sum + category.total, 0);
    const totalLiabilities = liabilities.reduce((sum, category) => sum + category.total, 0);

    return {
      assets,
      liabilities,
      totalAssets,
      totalLiabilities
    };
  };

  const formatCurrency = (amount: number): string => {
    return amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const formatPercentage = (amount: number, total: number): string => {
    if (total === 0) return "0.0%";
    return ((amount / total) * 100).toFixed(1) + "%";
  };

  const summaryData = calculateSummaryData();
  const grandTotal = summaryData.totalAssets + summaryData.totalLiabilities;

  // Prepare data for pie chart
  const chartData = [
    ...summaryData.assets.map(asset => ({
      name: asset.name,
      value: asset.total,
      color: asset.color
    })),
    ...summaryData.liabilities.map(liability => ({
      name: liability.name,
      value: liability.total,
      color: liability.color
    }))
  ];

  const chartConfig = chartData.reduce((acc, item) => {
    acc[item.name] = {
      label: item.name,
      color: item.color,
    };
    return acc;
  }, {} as any);

  return (
    <Card>
      <CardHeader className="pb-4">
        <Tabs defaultValue="summary" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="summary">Summary</TabsTrigger>
            <TabsTrigger value="totals">Totals</TabsTrigger>
            <TabsTrigger value="percent">Percent</TabsTrigger>
          </TabsList>
          
          <TabsContent value="summary" className="mt-6">
            <div className="space-y-6">
              {/* Assets Section */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-semibold text-lg">Assets</h3>
                  <span className="font-mono text-lg font-semibold">
                    ${formatCurrency(summaryData.totalAssets)}
                  </span>
                </div>
                
                {/* Assets Progress Bar */}
                <div className="mb-4 h-3 bg-muted rounded-full overflow-hidden flex">
                  {summaryData.assets.map((asset) => {
                    const percentage = (asset.total / summaryData.totalAssets) * 100;
                    return (
                      <div
                        key={asset.name}
                        className="h-full"
                        style={{
                          width: `${percentage}%`,
                          backgroundColor: asset.color,
                        }}
                      />
                    );
                  })}
                </div>

                {/* Asset Categories */}
                <div className="space-y-3">
                  {summaryData.assets.map((category) => (
                    <div key={category.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: category.color }}
                        />
                        <span className="text-sm">{category.name}</span>
                      </div>
                      <span className="font-mono text-sm font-medium">
                        ${formatCurrency(category.total)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Liabilities Section */}
              {summaryData.liabilities.length > 0 && (
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-semibold text-lg">Liabilities</h3>
                    <span className="font-mono text-lg font-semibold">
                      ${formatCurrency(summaryData.totalLiabilities)}
                    </span>
                  </div>
                  
                  {/* Liabilities Progress Bar */}
                  <div className="mb-4 h-3 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full"
                      style={{
                        width: '100%',
                        backgroundColor: '#EAB308',
                      }}
                    />
                  </div>

                  {/* Liability Categories */}
                  <div className="space-y-3">
                    {summaryData.liabilities.map((category) => (
                      <div key={category.name} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: category.color }}
                          />
                          <span className="text-sm">{category.name}</span>
                        </div>
                        <span className="font-mono text-sm font-medium">
                          ${formatCurrency(category.total)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="totals" className="mt-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b">
                <span className="font-medium">Total Assets</span>
                <span className="font-mono font-semibold text-green-600">
                  ${formatCurrency(summaryData.totalAssets)}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span className="font-medium">Total Liabilities</span>
                <span className="font-mono font-semibold text-red-600">
                  ${formatCurrency(summaryData.totalLiabilities)}
                </span>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="percent" className="mt-6">
            <div className="flex flex-col items-center space-y-4">
              {/* Pie Chart */}
              <div className="w-32 h-32">
                <ChartContainer config={chartConfig} className="w-full h-full">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={30}
                      outerRadius={50}
                      paddingAngle={2}
                      dataKey="value"
                      stroke="none"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ChartContainer>
              </div>
              
              {/* Percentage Breakdown */}
              <div className="space-y-2 w-full">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500" />
                    <span className="text-sm font-medium">ASSETS</span>
                  </div>
                  <div className="text-right">
                    <div className="font-mono font-semibold">${formatCurrency(summaryData.totalAssets)}</div>
                    <div className="text-sm text-muted-foreground">
                      {formatPercentage(summaryData.totalAssets, grandTotal)}
                    </div>
                  </div>
                </div>
                
                {summaryData.liabilities.length > 0 && (
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500" />
                      <span className="text-sm font-medium">LIABILITIES</span>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-semibold">${formatCurrency(summaryData.totalLiabilities)}</div>
                      <div className="text-sm text-muted-foreground">
                        {formatPercentage(summaryData.totalLiabilities, grandTotal)}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardHeader>
    </Card>
  );
};