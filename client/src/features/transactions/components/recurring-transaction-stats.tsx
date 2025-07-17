import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/core/components/ui/card";
import { Badge } from "@/core/components/ui/badge";
import { recurringTransactionService, recurringTransactionQueryKeys } from "../services/recurring-transaction.service";
import { Calendar, Pause, TrendingUp, AlertCircle } from "lucide-react";
import { Skeleton } from "@/core/components/ui/skeleton";

export function RecurringTransactionStats() {
  const { data: stats, isLoading } = useQuery({
    queryKey: recurringTransactionQueryKeys.stats(),
    queryFn: recurringTransactionService.getStats,
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  const statsCards = [
    {
      title: "Total Recurring",
      value: stats.total_count,
      icon: <Calendar className="h-4 w-4 text-muted-foreground" />,
      description: "Total recurring transactions",
    },
    {
      title: "Active",
      value: stats.active_count,
      icon: <TrendingUp className="h-4 w-4 text-green-500" />,
      description: "Currently active",
    },
    {
      title: "Paused",
      value: stats.paused_count,
      icon: <Pause className="h-4 w-4 text-yellow-500" />,
      description: "Temporarily paused",
    },
    {
      title: "Due Now",
      value: stats.due_count,
      icon: <AlertCircle className="h-4 w-4 text-red-500" />,
      description: "Require attention",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {statsCards.map((card) => (
        <Card key={card.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
            {card.icon}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{card.value}</div>
            <p className="text-xs text-muted-foreground">
              {card.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function RecurringTransactionStatusBadge({ 
  isActive, 
  isPaused, 
  isDue, 
  isCompleted 
}: { 
  isActive: boolean; 
  isPaused: boolean; 
  isDue: boolean; 
  isCompleted: boolean; 
}) {
  if (isCompleted) {
    return <Badge variant="outline">Completed</Badge>;
  }
  
  if (isPaused) {
    return <Badge variant="secondary">Paused</Badge>;
  }
  
  if (isDue) {
    return <Badge variant="destructive">Due</Badge>;
  }
  
  if (isActive) {
    return <Badge variant="default">Active</Badge>;
  }
  
  return <Badge variant="outline">Inactive</Badge>;
}