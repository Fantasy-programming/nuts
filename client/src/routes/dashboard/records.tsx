import { createFileRoute } from "@tanstack/react-router";

import { useState, useCallback } from "react";
import { RecordsTable } from "@/features/transactions/components/records";
import { Spinner } from "@/core/components/ui/spinner";
import { Button } from "@/core/components/ui/button";
import MobileBurger from "@/core/components/layouts/mobile-burger";

import { RecordCreateSchema } from "@/features/transactions/services/transaction.types";
import { RecordsDialog } from "@/features/transactions/components/records-dialog";
import { getTransactions, createTransaction } from "@/features/transactions/services/transaction"
import { useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Plus } from "lucide-react";

export const Route = createFileRoute("/dashboard/records")({
  component: RouteComponent,
  pendingComponent: Spinner,
  loader: ({ context }) => {
    const queryClient = context.queryClient
    queryClient.prefetchQuery({
      queryKey: ["transactions"],
      queryFn: getTransactions,
    })
  },
  errorComponent: ({ error }) => <div>Error loading transactions: {error.message}</div>,
});

function RouteComponent() {

  const [isOpen, setIsOpen] = useState(false);
  const queryClient = useQueryClient();

  const {
    data
  } = useSuspenseQuery({
    queryKey: ["transactions"],
    queryFn: getTransactions,
  })

  const createMutation = useMutation({
    mutationFn: createTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
    },
  });

  const onSubmit = useCallback((values: RecordCreateSchema) => {
    createMutation.mutate(values);
  }, [createMutation]);


  return (

    <>
      <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
        <div className="flex w-full items-center justify-between gap-2 px-4">
          <div className="hidden sm:block" />
          <MobileBurger />
          <div className="flex items-center gap-6">
            <RecordsDialog onSubmit={onSubmit} open={isOpen} onOpenChange={setIsOpen}>
              <Button className="hidden items-center gap-2 sm:flex">
                <Plus className="size-4" />
                <span>Add transactions</span>
              </Button>
            </RecordsDialog>
            {/* Mobile FAB */}
            <div className="fixed bottom-6 right-6 z-50 sm:hidden">
              <RecordsDialog onSubmit={onSubmit} open={isOpen} onOpenChange={setIsOpen}>
                <Button size="icon" className="h-14 w-14 rounded-full shadow-lg">
                  <Plus className="size-6" />
                </Button>
              </RecordsDialog>
            </div>
          </div>
        </div>
      </header>
      <main className="flex flex-1 overflow-hidden">
        <div className="h-full w-full space-y-8 overflow-y-auto px-6 py-2">
          <div className="space-y-8">
            <RecordsTable transactions={data} />
          </div>
        </div>
      </main>

    </>
  );
}
