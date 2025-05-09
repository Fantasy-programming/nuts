import { useMemo, memo, useCallback, ReactElement } from 'react';
import {
  ChartContainer, ChartConfig
} from "@/core/components/ui/chart";
import { ChartSize } from '.';

export const Chart = memo<{
  config?: ChartConfig;
  children: ReactElement
  size?: 1 | 2 | 3;
}>(({ size = 1, config, children }) => {

  const getChartHeight = useCallback((size: ChartSize) => {
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    if (isMobile) {
      return 200; // Smaller height for all charts on mobile
    }
    switch (size) {
      case 1: return 240;
      case 2: return 240;
      case 3: return 280;
      default: return 240;
    }
  }, [])

  const height = useMemo(() => getChartHeight(size), [size, getChartHeight])

  return (
    <div style={{ height: height }} >
      <ChartContainer className='w-full h-full' config={config || {}}>
        {children}
      </ChartContainer>
    </div>
  );
});
