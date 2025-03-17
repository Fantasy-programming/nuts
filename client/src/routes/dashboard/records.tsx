import { createFileRoute } from "@tanstack/react-router";

import { RecordsTable } from "@/features/transactions/components/records";
import { Spinner } from "@/core/components/ui/spinner";

import { getTransactions } from "@/features/transactions/services/transaction"
import { useSuspenseQuery } from "@tanstack/react-query"

export const Route = createFileRoute("/dashboard/records")({
  component: RouteComponent,
  pendingComponent: Spinner,
  loader: ({ context }) => {
    const queryClient = context.queryClient
    queryClient.prefetchQuery({
      queryKey: ["transactions"],
      queryFn: getTransactions,
    })
  }
});

function RouteComponent() {

  const {
    data
  } = useSuspenseQuery({
    queryKey: ["transactions"],
    queryFn: getTransactions,
  })


  return (
    <div className="space-y-8">
      <RecordsTable transactions={data} />
    </div>
  );
}
