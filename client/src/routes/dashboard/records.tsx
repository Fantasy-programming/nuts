import { createFileRoute } from "@tanstack/react-router";

import { useCallback, useState } from "react";
import { RecordsTable } from "@/features/transactions/components/records-table";
import { Spinner } from "@/core/components/ui/spinner";
import { Button } from "@/core/components/ui/button";
import MobileBurger from "@/core/components/layouts/mobile-burger";

import { RecordCreateSchema, RecordSchema } from "@/features/transactions/services/transaction.types";
import { RecordsDialog } from "@/features/transactions/components/add-records-dialog";
import { getTransactions, createTransaction, updateTransaction, deleteTransactions } from "@/features/transactions/services/transaction"
import { categoryService } from "@/features/categories/services/category"
import { accountService } from "@/features/accounts/services/account";
import { useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { useDebounce } from "@/core/hooks/use-debounce";


const DEBOUNCE_DELAY = 500; // ms

export const Route = createFileRoute("/dashboard/records")({
  component: RouteComponent,
  pendingComponent: Spinner,
  loader: ({ context }) => {
    const queryClient = context.queryClient;
    const defaultParams = { page: 1, limit: 25, q: "", group_by: "date" };


    queryClient.prefetchQuery({
      // Use a dynamic key that matches the component's initial state
      queryKey: ["transactions", defaultParams],
      queryFn: () => getTransactions(defaultParams),
    });
    // These prefetches are still great
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
  const queryClient = useQueryClient();


  const [page, setPage] = useState(1);
  const [limit] = useState(25); // Can be made dynamic if needed
  const [groupBy, setGroupBy] = useState<"date" | "">("date");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, DEBOUNCE_DELAY);

  // --- Dynamic Query ---
  // The query params object and query key MUST change when state changes.
  const queryParams = { page, limit, q: debouncedSearch, group_by: groupBy };
  const transactionsQueryKey = ["transactions", queryParams];

  const { data: transactionsResponse, isFetching } = useSuspenseQuery({
    queryKey: transactionsQueryKey,
    queryFn: () => getTransactions(queryParams),
  });

  // const {
  //   data: categories
  // } = useSuspenseQuery({
  //   queryKey: ["categories"],
  //   queryFn: categoryService.getCategories,
  // })
  //
  //
  // const {
  //   data: accounts
  // } = useSuspenseQuery({
  //   queryKey: ["accounts"],
  //   queryFn: accountService.getAccounts,
  // });


  const commonMutationOptions = {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      // Invalidate accounts if balances might change
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
    },
    onError: (error: Error) => {
      console.error(error.message);
      toast.error(error.message || "An error occurred.");
    },
  };


  const createMutation = useMutation({
    mutationFn: createTransaction,
    ...commonMutationOptions,
    onSuccess: () => {
      commonMutationOptions.onSuccess?.();
      toast.success("Transaction created successfully!");
    },
  });


  const updateMutation = useMutation({
    mutationFn: (params: { id: string; data: RecordSchema }) =>
      updateTransaction(params.id, params.data),
    ...commonMutationOptions,
    onSuccess: () => {
      commonMutationOptions.onSuccess?.();
      toast.success("Transaction updated successfully!");
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string | string[]) => deleteTransactions(id),
    ...commonMutationOptions,
    onSuccess: () => {
      commonMutationOptions.onSuccess?.();
      toast.success("Transaction deleted successfully!");
    }
  });


  const onSubmit = useCallback((values: RecordCreateSchema) => {
    createMutation.mutate(values);
  }, [createMutation]);

  const handleUpdateTransaction = async (params: { id: string; data: RecordSchema }) => {
    await updateMutation.mutateAsync(params);
  };

  const handleDeleteTransaction = async (id: string | string[]) => {
    await deleteMutation.mutateAsync(id);
  };

  return (

    <>
      <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear">
        <div className="flex w-full items-center justify-between gap-2">
          <h2 className="text-2xl font-bold tracking-tight">Transactions</h2>
          <MobileBurger />
          <div className="flex items-center gap-6">
            <RecordsDialog onSubmit={onSubmit}>
              <Button className="hidden items-center gap-2 sm:flex">
                <Plus className="size-4" />
                <span>Add transactions</span>
              </Button>
            </RecordsDialog>
            {/* Mobile FAB */}
            <div className="fixed bottom-6 right-6 z-50 sm:hidden">
              <RecordsDialog onSubmit={onSubmit}>
                <Button size="icon" className="h-14 w-14 rounded-full shadow-lg">
                  <Plus className="size-6" />
                </Button>
              </RecordsDialog>
            </div>
          </div>
        </div>
      </header>
      <div className="flex flex-1">
        <div className="h-full w-full space-y-8  py-2">
          <div className="space-y-8">
            <RecordsTable
              // Data and status props
              response={transactionsResponse}
              isLoading={isFetching} // Use isFetching for background loading indicators
              isUpdating={updateMutation.isPending}
              isDeleting={deleteMutation.isPending}

              // State values
              search={search}
              groupBy={groupBy}

              // State setters
              setSearch={setSearch}
              setPage={setPage}
              setGroupBy={setGroupBy}

              // Mutation handlers
              onUpdateTransaction={handleUpdateTransaction}
              onDeleteTransaction={handleDeleteTransaction}
            />
          </div>
        </div>
      </div>

    </>
  );
}
