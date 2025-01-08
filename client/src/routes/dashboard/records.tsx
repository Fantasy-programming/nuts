import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { createTransaction } from "@/features/transactions/services/transaction";
import { RecordsDialog, RecordsTable } from "./-components/Records/Records";
import { RecordCreateSchema } from "@/features/transactions/services/transaction.types";
import { Suspense } from "react";


export const Route = createFileRoute("/dashboard/records")({
  component: RouteComponent,
});

function RouteComponent() {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: createTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
    },
  });

  const onSubmit = (values: RecordCreateSchema) => {
    createMutation.mutate(values);
  };


  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Records</h2>
        <RecordsDialog onSubmit={onSubmit} />
      </div>
      <Suspense fallback={<div>loading</div>}>
        <RecordsTable />
      </Suspense>
    </div>
  );
}
