import { createFileRoute } from "@tanstack/react-router";
import { BudgetDashboard } from "@/features/budgets/components/budget-dashboard";
import { SidebarTrigger } from "@/core/components/ui/sidebar";

export const Route = createFileRoute("/dashboard/budgets")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="-ml-1" />
        <div className="flex-1" />
      </div>
      <BudgetDashboard />
    </div>
  );
}