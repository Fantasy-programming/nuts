import React, { useState, useEffect } from "react";
import { DashboardChartComponentProps } from "@/features/dashboard/charts/types";
import { loadChartModule } from "../charts/loader";

type LazyChartComponentsMap = Map<string, React.LazyExoticComponent<React.ComponentType<DashboardChartComponentProps>>>;

export function useLazyChartComponents(chartOrder: string[]) {
  const [lazyChartComponents, setLazyChartComponents] = useState<LazyChartComponentsMap>(new Map());
  const [loadingErrors, setLoadingErrors] = useState<Map<string, Error>>(new Map());

  useEffect(() => {
    let isMounted = true;

    const loadComponents = async () => {
      const newComponents = new Map(lazyChartComponents);
      const newErrors = new Map(loadingErrors);
      let updated = false;

      await Promise.all(
        chartOrder.map(async (chartId) => {
          if (!newComponents.has(chartId) && !newErrors.has(chartId)) {
            try {
              const LazyComponent = await loadChartModule(chartId);
              if (isMounted && LazyComponent) {
                newComponents.set(chartId, LazyComponent);
                updated = true;
              } else {
                newErrors.set(chartId, new Error("Module failed to load"));
                updated = true;
              }
            } catch (error) {
              if (isMounted) {
                newErrors.set(chartId, error instanceof Error ? error : new Error(String(error)));
                updated = true;
              }
            }
          }
        })
      );

      if (isMounted && updated) {
        setLazyChartComponents(new Map(newComponents));
        setLoadingErrors(new Map(newErrors));
      }
    };

    loadComponents();
    return () => {
      isMounted = false;
    };
  }, [chartOrder, loadingErrors, lazyChartComponents]);

  return { lazyChartComponents, loadingErrors };
}
