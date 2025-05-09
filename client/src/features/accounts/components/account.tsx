import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/core/components/ui/card";
import { Button } from "@/core/components/ui/button";
import { AccountDelete, AccountSubmit, AccountWTrend, AccountUpdate } from "../services/account.types";

import {
  CreditCard,
  Wallet,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  Building,
  Pencil,
  Trash2,
  MoreHorizontal,
  ChevronRight,
  ChevronDown,
} from "lucide-react"

import { CardDescription, CardFooter } from "@/core/components/ui/card"
import { Badge } from "@/core/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/core/components/ui/avatar"
import { Progress } from "@/core/components/ui/progress"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/core/components/ui/dropdown-menu"

import EditAccountModal from "./account.edit-modal"
import DeleteAccountDialog from "./account.delete-dialog"
import { Area, AreaChart, ResponsiveContainer } from "recharts";

interface AccountListProps {
  onCreate: AccountSubmit
  onUpdate: AccountUpdate
  onDelete: AccountDelete
  accounts: AccountWTrend[]
}

export function AccountList({ onDelete, onUpdate, accounts }: AccountListProps) {

  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedAccount, setSelectedAccount] = useState<AccountWTrend | null>(null)

  const handleEditAccount = (id: string) => {
    const account = accounts.find((acc) => acc.id === id)
    if (account) {
      setSelectedAccount(account)
      setIsEditModalOpen(true)
    }
  }

  const openDeleteDialog = (id: string) => {
    const account = accounts.find((acc) => acc.id === id)
    if (account) {
      setSelectedAccount(account)
      setIsDeleteDialogOpen(true)
    }
  }


  return (
    <>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
        {accounts.map((account) => (
          <AccountCard
            key={account.id}
            account={account}
            onEdit={() => handleEditAccount(account.id)}
            onDelete={() => openDeleteDialog(account.id)}
          />
        ))}
      </div>

      {selectedAccount && (
        <EditAccountModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          account={selectedAccount}
          onUpdateAccount={onUpdate}
        />
      )}

      <DeleteAccountDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        account={selectedAccount}
        onDeleteAccount={onDelete}
      />
    </>
  );
}

function AccountCard({
  account,
  onEdit,
  onDelete,
}: {
  account: AccountWTrend
  onEdit: () => void
  onDelete: () => void
}) {


  const getTrendBadge = () => {
    if (account.trend > 0) {
      return (
        <Badge
          variant="outline"
          className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-800"
        >
          <TrendingUp className="mr-1 h-3 w-3" />
          {account.trend}%
        </Badge>
      )
    } else if (account.trend < 0) {
      return (
        <Badge
          variant="outline"
          className="bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-400 dark:border-red-800"
        >
          <TrendingDown className="mr-1 h-3 w-3" />
          {account.trend}%
        </Badge>
      )
    }
    return null
  }

  const getAccountIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "checking":
        return <Building className="h-5 w-5 text-blue-500" />
      case "savings":
        return <PiggyBank className="h-5 w-5 text-emerald-500" />
      case "investment":
        return <TrendingUp className="h-5 w-5 text-purple-500" />
      case "cash":
        return <Wallet className="h-5 w-5 text-amber-500" />
      default:
        return <CreditCard className="h-5 w-5 text-slate-500" />
    }
  }

  return (
    <Card className="overflow-hidden transition-all hover:shadow-md">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2">
            {account?.meta?.institution ? (
              <Avatar className="h-8 w-8 rounded-md">
                <AvatarImage src={account?.meta?.logo} alt={account?.meta?.institution} />
                <AvatarFallback className="rounded-md bg-primary/10 text-primary text-xs">
                  {account?.meta?.institution.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            ) : (
              <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center">
                {getAccountIcon(account.type)}
              </div>
            )}
            <div>
              <CardTitle className="text-base">{account.name}</CardTitle>
              <CardDescription className="text-xs">{account.type}</CardDescription>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onEdit}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onDelete} className="text-destructive focus:text-destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline justify-between">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold">
              ${account.balance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            {getTrendBadge()}
          </div>
        </div>

        {account.transactions && account.transactions.length > 0 && (
          <div className="mt-4 space-y-2">
            <div className="text-xs font-medium text-muted-foreground">Recent Activity</div>
            {/* { */}
            {/*   account.transactions?.map((transaction) => ( */}
            {/*     <div key={transaction.id} className="flex items-center justify-between text-sm"> */}
            {/*       <span className="truncate">{transaction.description}</span> */}
            {/*       <span className={transaction.amount > 0 ? "text-emerald-600 dark:text-emerald-400" : ""}> */}
            {/*         {transaction.amount > 0 ? "+" : ""}${Math.abs(transaction.amount).toFixed(2)} */}
            {/*       </span> */}
            {/*     </div> */}
            {/**/}
            {/*   )) */}
            {/* } */}
          </div>
        )}

        <div className="mt-4">
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>Health Score</span>
            <span>Good</span>
          </div>
          <Progress value={75} className="h-1.5" />
        </div>
      </CardContent>
      <CardFooter className="border-t bg-muted/50 px-6 py-3 text-xs text-muted-foreground">
        {account.updated_at}
      </CardFooter>
    </Card>
  )
}



function MiniChart({ data }: { data: number[] }) {
  // If no data is provided, return empty chart
  if (!data || data.length === 0) {
    return <div className="h-8 w-20" />
  }

  // Format data for Recharts
  const chartData = data.map((value,) => ({ value }))

  // Determine color based on trend (first vs last point)
  const trend = data[data.length - 1] - data[0]
  const strokeColor = trend >= 0 ? "rgb(16, 185, 129)" : "rgb(239, 68, 68)" // emerald-500 or red-500
  const fillColor = trend >= 0 ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)" // transparent version

  return (
    <div className="h-8 w-20">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id={`gradient-${trend >= 0 ? "up" : "down"}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={strokeColor} stopOpacity={0.3} />
              <stop offset="95%" stopColor={strokeColor} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="value"
            stroke={strokeColor}
            strokeWidth={1.5}
            fill={`url(#gradient-${trend >= 0 ? "up" : "down"})`}
            dot={false}
            activeDot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

export function HorizontalAccountCard({
  account,
  onEdit,
  onDelete,
}: {
  account: AccountWTrend
  onEdit: () => void
  onDelete: () => void
}) {
  const getAccountIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "checking":
        return <Building className="h-5 w-5 text-blue-500" />
      case "savings":
        return <PiggyBank className="h-5 w-5 text-emerald-500" />
      case "investment":
        return <TrendingUp className="h-5 w-5 text-purple-500" />
      case "cash":
        return <Wallet className="h-5 w-5 text-amber-500" />
      default:
        return <CreditCard className="h-5 w-5 text-slate-500" />
    }
  }

  // Determine trend direction for text color
  const trendColor =
    account.trend > 0
      ? "text-emerald-600 dark:text-emerald-400"
      : account.trend < 0
        ? "text-red-600 dark:text-red-400"
        : ""

  return (
    <div className="flex items-center justify-between p-4 border-b last:border-b-0 hover:bg-muted/30 transition-colors">
      <div className="flex items-center gap-3">
        {account?.meta?.institution ? (
          <Avatar className="h-10 w-10 rounded-full">
            <AvatarImage src={account?.meta?.logo || "/placeholder.svg"} alt={account?.meta?.institution} />
            <AvatarFallback className="rounded-full bg-primary/10 text-primary">
              {account?.meta?.institution.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        ) : (
          <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
            {getAccountIcon(account.type)}
          </div>
        )}
        <div>
          <h3 className="font-medium">{account.name}</h3>
          <p className="text-sm text-muted-foreground">{account.type}</p>
        </div>
      </div>

      <div className="hidden md:block">
        <MiniChart data={account.chartData || []} />
      </div>

      <div className="hidden md:flex items-center gap-2">
        <div className="w-24 h-2">
          <Progress value={75} className="h-1.5" />
        </div>
        <span className="text-xs text-muted-foreground">Good</span>
      </div>

      <div className="flex flex-col items-end">
        <div className="flex items-center gap-2">
          <span className="font-semibold">
            ${account.balance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          {account.trend !== 0 && (
            <span className={`text-sm ${trendColor}`}>
              {account.trend > 0 ? "+" : ""}
              {account.trend}%
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground">{account.updated_at}</p>
      </div>

      <Button variant="ghost" size="icon" className="ml-2">
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  )
}

export function AccountGroup({
  title,
  accounts,
  totalBalance,
  trend,
  onEdit,
  onDelete,
}: {
  title: string
  accounts: AccountWTrend[]
  totalBalance: number
  trend: { value: number; period: string }
  onEdit: AccountUpdate
  onDelete: (id: string) => void
}) {
  const [isExpanded, setIsExpanded] = useState(true)

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded)
  }

  return (
    <div className="border bg-card rounded-lg overflow-hidden mb-6">
      <button
        onClick={toggleExpanded}
        className="w-full flex items-center justify-between p-4 bg-muted/30 hover:bg-muted/50 transition-colors text-left"
      >
        <div className="flex items-center gap-2">
          {isExpanded ? (
            <ChevronDown className="h-5 w-5 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          )}
          <h2 className="font-medium">{title}</h2>
          {trend.value !== 0 && (
            <span className={trend.value > 0 ? "text-emerald-600" : "text-red-600"} style={{ fontSize: "0.9rem" }}>
              {trend.value > 0 ? "↑" : "↓"} ${Math.abs(trend.value).toFixed(2)} (
              {Math.abs((trend.value / totalBalance) * 100).toFixed(1)}%)
            </span>
          )}
          <span className="text-sm text-muted-foreground">{trend.period}</span>
        </div>
        <div className="font-semibold">
          ${totalBalance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
      </button>

      {isExpanded && (
        <div className="divide-y">
          {accounts.map((account) => (
            <HorizontalAccountCard
              key={account.id}
              account={account}
              onEdit={() => onEdit(account.id)}
              onDelete={() => onDelete(account.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
