import { useSuspenseQuery } from "@tanstack/react-query";
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { accountService } from "../services/account";

export function AccountBalanceChart() {
  const { data, isError } = useSuspenseQuery({
    queryKey: ["accountsBT"],
    queryFn: accountService.getAccountsBalanceTimeline,
  });

  if (isError) {
    return <div className="h-[180px] flex items-center justify-center">Failed to load...</div>;
  }

  const formattedData = data.map(({ balance, month }) => ({
    date: new Date(month).toLocaleString("en-US", { month: "short" }),
    balance,
  }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={formattedData} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
        <XAxis
          dataKey="date"
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 12 }}
          tickMargin={10}
        />
        <YAxis
          tickFormatter={(value) => `$${value / 1000}k`}
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 12 }}
          tickMargin={10}
        />
        <Tooltip
          content={({ active, payload }) => {
            if (active && payload && payload.length) {
              return (
                <div className="rounded-lg border bg-background p-2 shadow-sm">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex flex-col">
                      <span className="text-[0.70rem] uppercase text-muted-foreground">Date</span>
                      <span className="font-bold text-sm">{payload[0].payload.date}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[0.70rem] uppercase text-muted-foreground">Balance</span>
                      <span className="font-bold text-sm">${payload[0]?.value?.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              );
            }
            return null;
          }}
        />
        <Area
          type="monotone"
          dataKey="balance"
          stroke="#0ea5e9"
          fill="#0ea5e9"
          fillOpacity={0.2}
          strokeWidth={2}
          activeDot={{ r: 6, style: { fill: "#0ea5e9", opacity: 0.8 } }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
