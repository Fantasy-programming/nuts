import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/core/components/ui/tabs";
import { RecurringTransactionStats } from "./recurring-transaction-stats";
import { RecurringTransactionFiltersCard } from "./recurring-transaction-filters";
import { RecurringTransactionsTable } from "./recurring-transactions-table";
import { AddRecurringTransactionButton } from "./add-recurring-transaction-dialog";
import { RecurringTransactionFilters } from "../services/recurring-transaction.types";
import { Calendar, List, BarChart } from "lucide-react";

export function RecurringTransactionsPage() {
  const [filters, setFilters] = useState<RecurringTransactionFilters>({});
  const [activeTab, setActiveTab] = useState("list");

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Recurring Transactions</h1>
          <p className="text-muted-foreground">
            Manage your recurring income and expenses
          </p>
        </div>
        <AddRecurringTransactionButton />
      </div>

      {/* Stats */}
      <RecurringTransactionStats />

      {/* Filters */}
      <RecurringTransactionFiltersCard 
        filters={filters}
        onFiltersChange={setFilters}
      />

      {/* Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="list" className="flex items-center gap-2">
            <List className="h-4 w-4" />
            List View
          </TabsTrigger>
          <TabsTrigger value="calendar" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Calendar View
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart className="h-4 w-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          <RecurringTransactionsTable filters={filters} />
        </TabsContent>

        <TabsContent value="calendar" className="space-y-4">
          <div className="text-center py-12">
            <Calendar className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Calendar View</h3>
            <p className="text-muted-foreground">
              Calendar view for recurring transactions is coming soon!
            </p>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="text-center py-12">
            <BarChart className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Analytics</h3>
            <p className="text-muted-foreground">
              Analytics for recurring transactions is coming soon!
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}