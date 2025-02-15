import { createFileRoute } from "@tanstack/react-router";

import { RecordsTable } from "./-components/Records/records";
import { Suspense } from "react";

export const Route = createFileRoute("/dashboard/records")({
  component: RouteComponent,
});


function RouteComponent() {

  return (
    <div className="space-y-8">
      <Suspense fallback={<div>loading</div>}>
        <RecordsTable />
      </Suspense>
    </div>
  );
}
