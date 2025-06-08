import { Suspense, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useDashboardStore } from "@/features/dashboard/stores/dashboard.store";
import { useTranslation } from "react-i18next";

import { AddChartDialog } from "@/features/dashboard/components/add-chart";
import { DashboardGrid } from "@/features/dashboard/components/dashboard-grid";
import { DashboardChartModuleConfig } from "@/features/dashboard/charts/types";
import { ChartErrorFallback, ChartLoadingSkeleton } from "@/features/dashboard/components/chart-card/chart-card.loading";
import { useLazyChartComponents } from "@/features/dashboard/hooks/useLazyChart";

// Import the loader and necessary types
// Optional: ErrorBoundary
// import { ErrorBoundary } from "react-error-boundary";

export const Route = createFileRoute("/dashboard/home")({
  component: RouteComponent,
});


function RouteComponent() {
  const { t } = useTranslation();

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
      <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear ">
        <div className="flex w-full items-center justify-between gap-2">
          <h2 className="text-2xl font-bold tracking-tight">Dashboard {t("greet")}</h2>
          <AddChartDialog onAddChart={handleAddChart} />
        </div>
      </header>
      <main className="flex flex-1">
        <div className="h-full w-full space-y-8   py-2">
          <div className="space-y-8">
            <DashboardGrid>
              {chartOrder.length === 0 ? (
                <div className="col-span-1 md:col-span-2 lg:col-span-3 text-center py-12 flex flex-col justify-center items-center text-muted-foreground">
                  <img src="/nuts_empty.png" className="w-60 grayscale" />
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
      </main>
    </>
  );
}
