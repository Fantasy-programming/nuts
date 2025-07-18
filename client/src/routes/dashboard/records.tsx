import { createFileRoute, useRouteContext } from "@tanstack/react-router";
import { z } from 'zod'
import { RecordsTable } from "@/features/transactions/components/records-table";
import { Spinner } from "@/core/components/ui/spinner";
import { Button } from "@/core/components/ui/button";
import { useState } from "react";

import { RecordsDialog } from "@/features/transactions/components/add-records-dialog";
import { NeuralRecordsDialog } from "@/features/transactions/components/neural-records-dialog";
import { getTransactions } from "@/features/transactions/services/transaction"
import { categoryService } from "@/features/categories/services/category"
import { accountService } from "@/features/accounts/services/account";
import { LayoutDashboard, Plus, Sparkles, List, Calendar, BarChart3, ChevronDown } from "lucide-react";
import { SidebarTrigger } from "@/core/components/ui/sidebar";
import { EmptyStateGuide } from "@/core/components/EmptyStateGuide";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/core/components/ui/dropdown-menu";

const transactionFilterSchema = z.object({
  page: z.number().catch(1),
})

export type TransactionSearch = z.infer<typeof transactionFilterSchema>

export const Route = createFileRoute("/dashboard/records")({
  component: RouteComponent,
  pendingComponent: Spinner,
  validateSearch: transactionFilterSchema,
  loader: ({ context }) => {
    const queryClient = context.queryClient;
    const defaultParams = { page: 1, q: "", group_by: "date" };

    queryClient.prefetchQuery({
      queryKey: ["transactions", defaultParams],
      queryFn: () => getTransactions(defaultParams),
    });

    queryClient.prefetchQuery({
      queryKey: ["categories"],
      queryFn: categoryService.getCategories,
    });

    queryClient.prefetchQuery({
      queryKey: ["accounts"],
      queryFn: accountService.getAccounts,
    });
  },
  errorComponent: ({ error }) => <div>Error loading transactions: {error.message}</div>,
});

function RouteComponent() {
  const { page } = Route.useSearch();
  const navigate = Route.useNavigate();
  const { hasAccounts } = useRouteContext({ from: "/dashboard" });
  const [currentView, setCurrentView] = useState<"list" | "calendar" | "analytics">("list");
  
  const updatePage = (newPage: number) => {
    navigate({ search: { page: newPage }, replace: true });
  };

  const ViewSwitcher = () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          {currentView === "list" && <List className="h-4 w-4" />}
          {currentView === "calendar" && <Calendar className="h-4 w-4" />}
          {currentView === "analytics" && <BarChart3 className="h-4 w-4" />}
          {currentView === "list" && "List"}
          {currentView === "calendar" && "Calendar"}
          {currentView === "analytics" && "Analytics"}
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onClick={() => setCurrentView("list")}>
          <List className="h-4 w-4 mr-2" />
          List
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setCurrentView("calendar")}>
          <Calendar className="h-4 w-4 mr-2" />
          Calendar
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setCurrentView("analytics")}>
          <BarChart3 className="h-4 w-4 mr-2" />
          Analytics
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  const renderCurrentView = () => {
    switch (currentView) {
      case "list":
        return (
          <RecordsTable
            initialPage={page}
            onPageChange={updatePage}
          />
        );
      case "calendar":
        return (
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            Calendar view coming soon...
          </div>
        );
      case "analytics":
        return (
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            Analytics view coming soon...
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <>

      {!hasAccounts && (
        <EmptyStateGuide
          Icon={LayoutDashboard}
          title="See your Transactions"
          description="Connect your first financial account to track your net worth, spending, and investments all in one place."
          ctaText="Add your first account"
        />
      )}
      <div className="border-b border-b-bg-nuts-500/20 py-1 flex gap-2 items-center md:hidden -mx-4 px-3">
        <SidebarTrigger />
        <span className="font-semibold text-sm tracking-tight">Transactions</span>
      </div>
      <header className="hidden md:flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear">
        <div className="flex w-full items-center justify-between gap-2">
          <h2 className="text-2xl font-bold tracking-tight">Transactions</h2>
          <div className="flex items-center gap-2">
            <ViewSwitcher />
            <RecordsDialog>
              <Button className="hidden items-center gap-2 sm:flex">
                <Plus className="size-4" />
                <span>New</span>
              </Button>
            </RecordsDialog>
            <NeuralRecordsDialog>
              <Button className="hidden items-center gap-2 sm:flex">
                <Sparkles className="size-4" />
                <span>Neural Input</span>
              </Button>
            </NeuralRecordsDialog>
          </div>
        </div>
      </header>
      
      <div className="flex flex-1">
        <div className="h-full w-full space-y-8  py-2">
          <div className="space-y-8">
            {renderCurrentView()}
          </div>
        </div>
      </div>

      <div className="fixed bottom-6 right-6 z-50 sm:hidden">
        <RecordsDialog>
          <Button size="icon" className="h-14 w-14 rounded-full shadow-lg">
            <Plus className="size-6" />
          </Button>
        </RecordsDialog>
      </div>
    </>
  );
}
