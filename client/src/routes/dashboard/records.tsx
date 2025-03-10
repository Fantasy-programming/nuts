import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";

import { RecordsTable } from "@/features/transactions/components/records";
import { Spinner } from "@/core/components/ui/spinner";

export const Route = createFileRoute("/dashboard/records")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="space-y-8">
      <Suspense fallback={<Spinner />}>
        <RecordsTable />
      </Suspense>
    </div>
  );
}
