import { Suspense } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/core/components/ui/card";
import { GlobeIcon } from "lucide-react"
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
        <CardTitle className="uppercase tracking-widest font-medium text-sm text-foreground/80">Net Worth</CardTitle>
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
          <span className="text-2xl font-semibold font-mono tracking-tighter text-foreground">
            ${cashTotal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
        <div className="h-[180px] mt-6">
          <Suspense fallback={<div>loading chart...</div>} >
            <AccountBalanceChart />
          </Suspense>
        </div>
      </CardContent>
    </Card>

  )
}
