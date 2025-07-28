import { createFileRoute, useRouteContext } from "@tanstack/react-router";
import { z } from 'zod'
import { RecordsTable } from "@/features/transactions/components/records-table";
import { Spinner } from "@/core/components/ui/spinner";
import { Button } from "@/core/components/ui/button";

import { RecordsDialog } from "@/features/transactions/components/add-records-dialog";
import { NeuralRecordsDialog } from "@/features/transactions/components/neural-records-dialog";
import { RulesDialog } from "@/features/transactions/components/rules-dialog";
import { adaptiveTransactionService, adaptiveAccountService, adaptiveCategoryService } from "@/core/offline-first"
import { LayoutDashboard, Plus, Sparkles, Settings } from "lucide-react";
import { SidebarTrigger } from "@/core/components/ui/sidebar";
import { EmptyStateGuide } from "@/core/components/EmptyStateGuide";

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
      queryFn: () => adaptiveTransactionService.getTransactions(defaultParams),
    });

    queryClient.prefetchQuery({
      queryKey: ["categories"],
      queryFn: adaptiveCategoryService.getCategories,
    });

    queryClient.prefetchQuery({
      queryKey: ["accounts"],
      queryFn: adaptiveAccountService.getAccounts,
    });
  },
  errorComponent: ({ error }) => <div>Error loading transactions: {error.message}</div>,
});

function RouteComponent() {
  const { page } = Route.useSearch();
  const navigate = Route.useNavigate();
  const { hasAccounts } = useRouteContext({ from: "/dashboard" });
  const updatePage = (newPage: number) => {
    navigate({ search: { page: newPage }, replace: true });
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
            <RulesDialog>
              <Button variant="outline" className="hidden items-center gap-2 sm:flex">
                <Settings className="size-4" />
                <span>Rules</span>
              </Button>
            </RulesDialog>
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
            <RecordsTable
              initialPage={page}
              onPageChange={updatePage}
            />
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
