import React from 'react';
import { Line, LineChart, PieChart, Pie, XAxis, YAxis, CartesianGrid, BarChart, Bar, AreaChart, Area, Cell } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent
} from "@/core/components/ui/chart";

// Define chart data types
export type ChartDataPoint = Record<string, string | number>;

export interface ChartConfig {
  type: 'line' | 'bar' | 'area' | 'pie';
  title: string;
  dataKeys: string[];
  colors?: string[];
  stacked?: boolean;
}

interface ChartRendererProps {
  type: ChartConfig['type'];
  data: ChartDataPoint[];
  dataKeys: string[];
  colors?: string[];
  stacked?: boolean;
  size?: 1 | 2 | 3;
}

// Default colors that can be overridden
const DEFAULT_COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", "#82ca9d"];

// Convert colors to shadcn format for chart config
const createChartConfig = (dataKeys: string[], colors: string[]) => {
  return dataKeys.reduce((config, key, index) => {
    return {
      ...config,
      [key]: {
        label: key,
        color: colors[index % colors.length]
      }
    };
  }, {});
};

export const ChartRenderer: React.FC<ChartRendererProps> = ({
  type,
  data,
  dataKeys,
  colors = DEFAULT_COLORS,
  stacked = false,
  size = 1
}) => {
  // Create shadcn chart config
  const chartConfig = createChartConfig(dataKeys, colors);

  // Get category key (usually the x-axis value)
  const categoryKey = Object.keys(data[0] || {}).find(key => typeof data[0][key] === 'string') || 'name';

  // Calculate appropriate dimensions based on chart size
  const getChartHeight = () => {
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
  };

  const renderChart = () => {
    switch (type) {
      case "line":
        return (
          <LineChart data={data}
            margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={categoryKey} />
            <YAxis />
            <ChartTooltip content={<ChartTooltipContent />} />
            <ChartLegend content={<ChartLegendContent />} />
            {dataKeys.map((key) => (
              <Line
                key={key}
                isAnimationActive={false}
                type="monotone"
                dataKey={key}
                strokeWidth={2}
              />
            ))}
          </LineChart>
        );

      case "bar":
        return (
          <BarChart data={data}
            margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={categoryKey} />
            <YAxis />
            <ChartTooltip content={<ChartTooltipContent />} />
            <ChartLegend content={<ChartLegendContent />} />
            {dataKeys.map((key) => (
              <Bar
                isAnimationActive={false}
                key={key}
                dataKey={key}
                stackId={stacked ? "stack" : undefined}
              />
            ))}
          </BarChart>
        );

      case "area":
        return (
          <AreaChart data={data}
            margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={categoryKey} />
            <YAxis />
            <ChartTooltip content={<ChartTooltipContent />} />
            <ChartLegend content={<ChartLegendContent />} />
            {dataKeys.map((key) => (
              <Area
                key={key}
                isAnimationActive={false}
                type="monotone"
                dataKey={key}
                stackId={stacked ? "stack" : undefined}
              />
            ))}
          </AreaChart>
        );

      case "pie":
        return (
          <PieChart >
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              isAnimationActive={false}
              outerRadius={size === 1 ? 80 : size === 2 ? 100 : 120}
              dataKey={dataKeys[0]}
              label
            >
              {data.map((_entry, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Pie>
            <ChartTooltip content={<ChartTooltipContent />} />
          </PieChart>
        );

      default:
        return <div>Unsupported chart type</div>;
    }
  };

  const height = getChartHeight()

  return (
    <div style={{ height: height }} >
      <ChartContainer className='w-full h-full' config={chartConfig}>
        {renderChart()}
      </ChartContainer>
    </div>
  );
};

// A higher level component that takes care of configuration
export const Chart: React.FC<{
  data: ChartDataPoint[];
  config: ChartConfig;
  size?: 1 | 2 | 3;
}> = ({ data, config, size = 1 }) => {
  const { type, dataKeys, colors, stacked } = config;

  return (
    <ChartRenderer
      type={type}
      data={data}
      dataKeys={dataKeys}
      colors={colors}
      stacked={stacked}
      size={size}
    />
  );
};
