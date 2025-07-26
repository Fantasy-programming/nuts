import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/core/components/ui/card";
import { Badge } from "@/core/components/ui/badge";
import { Button } from "@/core/components/ui/button";
import { CheckCircle, AlertCircle, Calendar, DollarSign } from "lucide-react";
import { getTransactions } from "../services/transaction";
import { formatCurrency, formatDate } from "@/lib/utils";
import { getTransactionStatus } from "../utils/transaction-status";

interface PendingTransactionsDashboardProps {
  className?: string;
}

export function PendingTransactionsDashboard({ className }: PendingTransactionsDashboardProps) {
  // Get pending transactions
  const { data: pendingTransactions } = useQuery({
    queryKey: ["transactions", { is_pending: true, page: 1, limit: 10 }],
    queryFn: () => getTransactions({ page: 1, is_pending: true, limit: 10 }),
  });

  // Get recurring transactions stats
  const { data: recurringTransactions } = useQuery({
    queryKey: ["transactions", { is_recurring: true, page: 1, limit: 100 }],
    queryFn: () => getTransactions({ page: 1, is_recurring: true, limit: 100 }),
  });

  const stats = useMemo(() => {
    const allRecurring = recurringTransactions?.data?.flatMap(group => group.transactions) || [];
    
    const pending = allRecurring.filter(t => getTransactionStatus(t).isPending);
    const autoPosted = allRecurring.filter(t => getTransactionStatus(t).isAutoPosted);
    const totalRecurring = allRecurring.length;
    
    const pendingAmount = pending.reduce((sum, t) => sum + Math.abs(t.amount), 0);
    
    return {
      totalRecurring,
      pendingCount: pending.length,
      autoPostedCount: autoPosted.length,
      pendingAmount,
    };
  }, [recurringTransactions]);

  const pendingList = useMemo(() => {
    return pendingTransactions?.data?.flatMap(group => group.transactions) || [];
  }, [pendingTransactions]);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Recurring</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalRecurring}</div>
            <p className="text-xs text-muted-foreground">
              Active recurring transactions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
            <AlertCircle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.pendingCount}</div>
            <p className="text-xs text-muted-foreground">
              Require manual review
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Auto-posted</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.autoPostedCount}</div>
            <p className="text-xs text-muted-foreground">
              Automatically created
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.pendingAmount)}</div>
            <p className="text-xs text-muted-foreground">
              Total pending amount
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Pending Transactions List */}
      {pendingList.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Pending Approvals</CardTitle>
            <Badge variant="destructive">{pendingList.length}</Badge>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingList.slice(0, 5).map((transaction) => {
                // const status = getTransactionStatus(transaction);
                return (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-3 border rounded-lg bg-orange-50 border-orange-200"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 rounded-full bg-orange-500" />
                      <div>
                        <p className="font-medium text-sm">{transaction.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {transaction.account.name} • {formatDate(transaction.transaction_datetime)}
                        </p>
                        {transaction.template_name && (
                          <p className="text-xs text-blue-600">
                            Template: {transaction.template_name}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="font-medium">
                        {formatCurrency(Math.abs(transaction.amount))}
                      </span>
                      <div className="flex space-x-1">
                        <Button size="sm" variant="outline">
                          Edit
                        </Button>
                        <Button size="sm" variant="default">
                          Approve
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
              {pendingList.length > 5 && (
                <div className="text-center pt-2">
                  <Button variant="outline" size="sm">
                    View all {pendingList.length} pending transactions
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm">
              Approve All Small Amounts (&lt; $50)
            </Button>
            <Button variant="outline" size="sm">
              Review Large Transactions
            </Button>
            <Button variant="outline" size="sm">
              Manage Auto-posting Rules
            </Button>
            <Button variant="outline" size="sm">
              View Recurring Templates
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}