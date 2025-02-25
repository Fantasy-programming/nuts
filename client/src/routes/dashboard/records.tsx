import { createFileRoute } from "@tanstack/react-router";
import { RecordsTable } from "./-components/Records/records";
import { Suspense } from "react";
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
