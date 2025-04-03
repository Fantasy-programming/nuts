import { cn } from "@/lib/utils";
import { ChartSize } from ".";

export const ChartLoadingSkeleton = ({ size }: { size: ChartSize }) => {
  const heightClasses = { 1: "min-h-[260px]", 2: "min-h-[260px]", 3: "min-h-[300px]" };
  const sizeClasses = { 1: "col-span-1", 2: "col-span-1 md:col-span-2", 3: "col-span-1 md:col-span-2 lg:col-span-3" };
  return (
    <div
      className={cn(
        "bg-muted rounded-lg animate-pulse",
        heightClasses[size] || "min-h-[260px]",
        sizeClasses[size] || "col-span-1"
      )}
    />
  );
};

export const ChartErrorFallback = ({ chartId, error }: { chartId: string, error?: Error }) => (
  <div className="border border-destructive rounded p-4 col-span-1 bg-destructive/10 text-destructive-foreground">
    <p className="font-semibold">Error loading chart: {chartId}</p>
    {error && <p className="text-xs mt-1">{error.message}</p>}
    <p className="text-xs mt-1">Please try removing/re-adding it.</p>
  </div>
);
