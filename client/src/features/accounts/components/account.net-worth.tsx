import { Suspense } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/core/components/ui/card";
import { Badge } from "@/core/components/ui/badge"
import { TrendingUp } from "lucide-react"
import { RiInformationLine } from "@remixicon/react";
import { AccountBalanceChart } from "./account.balance-chart";

import { type AccountWTrend } from "../services/account.types";
import { PopoverContent, PopoverTrigger, Popover } from "@/core/components/ui/popover";

interface AccountNetWorthCardProps {
  accounts: AccountWTrend[]
}

export const NetWorthCard = ({ accounts }: AccountNetWorthCardProps) => {
  const totalBalance = accounts.reduce((sum, account) => sum + account.balance, 0)

  return (

    <Card>
      <CardHeader className="pb-2 flex flex-row gap-2 items-center ">
        <CardTitle className="uppercase text-sm">Net Worth</CardTitle>
        <Popover>
          <PopoverTrigger asChild>
            <RiInformationLine size={15} />
          </PopoverTrigger>
          <PopoverContent>Place content for the popover here.</PopoverContent>
        </Popover>
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold">
            ${totalBalance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
