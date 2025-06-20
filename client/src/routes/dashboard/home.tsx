import { Suspense, useMemo } from "react";
import { createFileRoute, useRouteContext } from "@tanstack/react-router";
import { useDashboardStore } from "@/features/dashboard/stores/dashboard.store";
import { useTranslation } from "react-i18next";

import { AddChartDialog } from "@/features/dashboard/components/add-chart";
import { DashboardGrid } from "@/features/dashboard/components/dashboard-grid";
import { DashboardChartModuleConfig } from "@/features/dashboard/charts/types";
import { ChartErrorFallback, ChartLoadingSkeleton } from "@/features/dashboard/components/chart-card/chart-card.loading";
import { useLazyChartComponents } from "@/features/dashboard/hooks/useLazyChart";
import { SidebarTrigger } from "@/core/components/ui/sidebar";
import { Button } from "@/core/components/ui/button";
import { LayoutDashboard, PlusCircle } from "lucide-react";
import { EmptyStateGuide } from "@/core/components/EmptyStateGuide";

// Import the loader and necessary types
// Optional: ErrorBoundary
// import { ErrorBoundary } from "react-error-boundary";

export const Route = createFileRoute("/dashboard/home")({
  component: RouteComponent,
});


function RouteComponent() {
  const { t } = useTranslation();
  const { hasAccounts } = useRouteContext({ from: "/dashboard" });

  const chartLayout = useDashboardStore((state) => state.chartLayout);
  const chartOrder = useDashboardStore((state) => state.chartOrder);
  const addChart = useDashboardStore((state) => state.addChart);

  // State to hold the map of loaded lazy components
  const { lazyChartComponents, loadingErrors } = useLazyChartComponents(chartOrder);

  // Memoize the layout map
  const layoutMap = useMemo(() => new Map(chartLayout.map((item) => [item.id, item])), [chartLayout]);

  const handleAddChart = (config: DashboardChartModuleConfig) => {
    addChart(config.id);
  };



  return (
    <>
      {!hasAccounts && (
        <EmptyStateGuide
          Icon={LayoutDashboard}
          title="Welcome to your Dashboard"
          description="Connect your first financial account to track your net worth, spending, and investments all in one place."
          ctaText="Add your first account"
        />
      )}

      <div className={!hasAccounts ? 'blur-sm pointer-events-none' : ''}>
        <div className="border-b border-b-bg-nuts-500/20 py-1 flex gap-2 items-center md:hidden -mx-4 px-3">
          <SidebarTrigger />
          <span className="font-semibold text-sm tracking-tight">Dashboard</span>
        </div>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear ">
          <div className="flex w-full items-center justify-between gap-2">
            <h1 className="text-2xl font-bold tracking-tight">{t("greet")} xyz</h1>
            <AddChartDialog onAddChart={handleAddChart} >
              <Button variant="outline" size="sm" className="hidden md:inline-flex">
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Chart
              </Button>
            </AddChartDialog>
          </div>
        </header>
        <div className="flex flex-1">
          <div className="h-full w-full space-y-8   py-2">
            <div className="space-y-8">
              <DashboardGrid>
                {chartOrder.length === 0 ? (
                  <div className="col-span-1 md:col-span-2 lg:col-span-3 text-center py-12 flex flex-col justify-center items-center text-muted-foreground">
                    <img src="/nuts_empty.png" className="md:w-60 w-50 grayscale" />
                    Your dashboard is empty. Add some charts using the button above!
                  </div>
                ) : (
                  chartOrder.map((chartId) => {
                    const layout = layoutMap.get(chartId);
                    const ChartToRender = lazyChartComponents.get(chartId);
                    const loadingError = loadingErrors.get(chartId);

                    if (!layout) return <ChartErrorFallback key={chartId} chartId={chartId} error={new Error("Layout missing")} />;
                    if (loadingError) return <ChartErrorFallback key={chartId} chartId={chartId} error={loadingError} />;

                    // If the component isn't loaded yet (but no error), show skeleton
                    // The Suspense fallback will handle the component's internal loading
                    if (!ChartToRender) return <ChartLoadingSkeleton key={chartId} size={layout.size} />;

                    return (
                      // Optional: ErrorBoundary
                      // <ErrorBoundary key={chartId} FallbackComponent={(props) => <ChartErrorFallback chartId={chartId} error={props.error} />}>
                      <Suspense key={chartId} fallback={<ChartLoadingSkeleton size={layout.size} />}>
                        <ChartToRender
                          id={layout.id}
                          size={layout.size}
                          isLocked={layout.isLocked}
                        />
                      </Suspense>
                      // </ErrorBoundary>
                    );
                  }))}
              </DashboardGrid>
            </div>
          </div>
        </div>

        {/* Mobile FAB */}
        <div className="fixed bottom-6 right-6 z-50 sm:hidden">
          <AddChartDialog
            onAddChart={handleAddChart}
          >
            <Button size="icon" variant="destructive" className="h-14 w-14 rounded-full shadow-lg">
              <PlusCircle className="size-6" />
            </Button>
          </AddChartDialog>
        </div>
      </div>
    </>
  );
}
