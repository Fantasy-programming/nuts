import { Suspense } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/core/components/ui/card";
import { Badge } from "@/core/components/ui/badge"
import { GlobeIcon, TrendingUp } from "lucide-react"
import { RiInformationLine } from "@remixicon/react";
import { AccountBalanceChart } from "./account.balance-chart";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/core/components/ui/tooltip"

interface AccountNetWorthCardProps {
  cashTotal: number
}

export const NetWorthCard = ({ cashTotal }: AccountNetWorthCardProps) => {

  return (
    <Card>
      <CardHeader className="pb-2 flex flex-row gap-2 items-center ">
        <CardTitle className="uppercase text-sm">Net Worth</CardTitle>
        <TooltipProvider delayDuration={400}>
          <Tooltip>
            <TooltipTrigger asChild>
              <RiInformationLine size={15} />
            </TooltipTrigger>
            <TooltipContent className="dark py-3 ">
              <div className="flex gap-3">
                <GlobeIcon
                  className="mt-0.5 shrink-0 opacity-60"
                  size={16}
                  aria-hidden="true"
                />
                <div className="space-y-1">
                  <p className="text-[13px] font-medium">
                    Tooltip with title and icon
                  </p>
                  <p className="text-muted-foreground text-xs">
                    Tooltips are made to be highly customizable, with features like
                    dynamic placement, rich content, and a robust API.
                  </p>
                </div>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold">
            ${cashTotal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <Badge
            variant="outline"
            className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-800"
          >
            <TrendingUp className="mr-1 h-3 w-3" />
            2.8%
          </Badge>
        </div>
        <div className="h-[180px] mt-6">
          <Suspense fallback=<div>loading chart...</div>>
            <AccountBalanceChart />
          </Suspense>
        </div>
      </CardContent>
    </Card>

  )
}
