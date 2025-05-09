import { useState } from "react"
import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/core/components/ui/card";

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
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Analytics</h2>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Financial Overview</CardTitle>
        </CardHeader>
        <CardContent>
        </CardContent>
      </Card>
    </div>
  );
}
