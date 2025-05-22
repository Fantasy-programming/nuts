import { useState } from "react"
import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";
import AnalyticsLoading from "@/features/analytics/components/dashboard.loading";
import AnalyticsDashboard from "@/features/analytics/components/dashboard";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/core/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/core/components/ui/popover"
import { Calendar as CalendarComponent } from "@/core/components/ui/calendar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/core/components/ui/dropdown-menu"
import { Button } from "@/core/components/ui/button"
import { format } from "date-fns"

import {
  Calendar,
  Download,
  Share2,
  ChevronDown,
} from "lucide-react"


export const Route = createFileRoute("/dashboard/analytics")({
  component: RouteComponent,
});

function RouteComponent() {

  const [timeframe, setTimeframe] = useState("month")
  const [date, setDate] = useState<Date>(new Date())

  const formatDateRange = () => {
    const currentMonth = format(date, "MMMM yyyy")

    if (timeframe === "day") {
      return format(date, "MMMM d, yyyy")
    } else if (timeframe === "week") {
      // This is simplified - would need more logic for proper week range
      return `Week of ${format(date, "MMMM d, yyyy")}`
    } else if (timeframe === "month") {
      return currentMonth
    } else if (timeframe === "quarter") {
      const quarter = Math.floor(date.getMonth() / 3) + 1
      return `Q${quarter} ${date.getFullYear()}`
    } else if (timeframe === "year") {
      return date.getFullYear().toString()
    } else if (timeframe === "all") {
      return "All Time"
    }

    return currentMonth
  }

  return (
    <>
      <header className="flex h-22 shrink-0 items-center gap-2 transition-[width,height] ease-linear ">
        <div className="flex w-full flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
            <p className="text-muted-foreground mt-1">Gain insights into your financial health and spending patterns</p>
          </div>

          <div className="flex items-center gap-3">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="flex gap-2">
                  <Calendar className="h-4 w-4" />
                  {formatDateRange()}
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <div className="p-3 border-b">
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Select timeframe</h4>
                    <Select value={timeframe} onValueChange={setTimeframe}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select timeframe" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="day">Day</SelectItem>
                        <SelectItem value="week">Week</SelectItem>
                        <SelectItem value="month">Month</SelectItem>
                        <SelectItem value="quarter">Quarter</SelectItem>
                        <SelectItem value="year">Year</SelectItem>
                        <SelectItem value="all">All Time</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <CalendarComponent
                  mode="single"
                  selected={date}
                  onSelect={(date) => date && setDate(date)}
                  className="rounded-md border"
                />
              </PopoverContent>
            </Popover>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <Download className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>Export as PDF</DropdownMenuItem>
                <DropdownMenuItem>Export as CSV</DropdownMenuItem>
                <DropdownMenuItem>Export as Image</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <Share2 className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>Share via Email</DropdownMenuItem>
                <DropdownMenuItem>Copy Link</DropdownMenuItem>
                <DropdownMenuItem>Schedule Report</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header >
      <main className="flex flex-1 overflow-hidden">
        <div className="h-full w-full space-y-8 overflow-y-auto py-2">
          <div className="space-y-8">
            <Suspense fallback={<AnalyticsLoading />}>
              <AnalyticsDashboard />
            </Suspense>
          </div>
        </div>
      </main>
    </>
  );
}
