import { Suspense, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/core/components/ui/card";
import { Button } from "@/core/components/ui/button";
import { Input } from "@/core/components/ui/input";
import { AccountDelete, AccountSubmit, AccountWTrend, AccountUpdate } from "../services/account.types";
import { Link } from "@tanstack/react-router";

import {
  ArrowUpRight,
  CreditCard,
  Wallet,
  TrendingUp,
  TrendingDown,
  Plus,
  DollarSign,
  BarChart3,
  RefreshCw,
  Search,
  Filter,
  PiggyBank,
  Building,
  Landmark,
  Pencil,
  Trash2,
  MoreHorizontal,
} from "lucide-react"

import { CardDescription, CardFooter } from "@/core/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/core/components/ui/tabs"
import { Badge } from "@/core/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/core/components/ui/avatar"
import { Progress } from "@/core/components/ui/progress"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/core/components/ui/dropdown-menu"

import AccountBalanceChart from "./account.balance-chart"
// import RecentTransactions from "./account.recent-transactions"
import AddAccountModal from "./account.create-modal"
import EditAccountModal from "./account.edit-modal"
import DeleteAccountDialog from "./account.delete-dialog"

interface AccountListProps {
  onCreate: AccountSubmit
  onUpdate: AccountUpdate
  onDelete: AccountDelete
  accounts: AccountWTrend[]
}

export function AccountList({ onCreate, onDelete, onUpdate, accounts }: AccountListProps) {
  const [searchQuery, setSearchQuery] = useState("")

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedAccount, setSelectedAccount] = useState<AccountWTrend | null>(null)



  // sum of all accounts balances
  const totalBalance = accounts.reduce((sum, account) => sum + account.balance, 0)

  // accounts when filter are applied
  const filteredAccounts = accounts.filter((account) => account.name.toLowerCase().includes(searchQuery.toLowerCase()))

  // filters for account sorting
  const linkedAccountsList = accounts.filter((account) => !!account?.meta?.institution)
  const manualAccountsList = accounts.filter((account) => !account?.meta?.institution)


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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Accounts</h1>
          <p className="text-muted-foreground mt-1">Manage your financial accounts and track your balances</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" className="hidden md:flex">
            <RefreshCw className="mr-2 h-4 w-4" />
            Sync Accounts
          </Button>
          <Button onClick={() => setIsAddModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Account
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle>Total Balance</CardTitle>
            <CardDescription>Across all accounts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold">
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

        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button variant="outline" className="w-full justify-start">
              <DollarSign className="mr-2 h-4 w-4 text-emerald-500" />
              Add Transaction
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <BarChart3 className="mr-2 h-4 w-4 text-blue-500" />
              View Reports
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <Landmark className="mr-2 h-4 w-4 text-purple-500" />
              Link New Bank
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <CreditCard className="mr-2 h-4 w-4 text-amber-500" />
              Manage Categories
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
        <Tabs defaultValue="all" className="w-full">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
            <TabsList>
              <TabsTrigger value="all">All Accounts</TabsTrigger>
              <TabsTrigger value="linked">Bank Linked</TabsTrigger>
              <TabsTrigger value="manual">Manual</TabsTrigger>
            </TabsList>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search accounts..."
                  className="pl-9 w-[200px]"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon">
                    <Filter className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>Sort by name</DropdownMenuItem>
                  <DropdownMenuItem>Sort by balance</DropdownMenuItem>
                  <DropdownMenuItem>Sort by last updated</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <TabsContent value="all" className="m-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAccounts.map((account) => (
                <AccountCard
                  key={account.id}
                  account={account}
                  onEdit={() => handleEditAccount(account.id)}
                  onDelete={() => openDeleteDialog(account.id)}
                />
              ))}
              <AddAccountCard onClick={() => setIsAddModalOpen(true)} />
            </div>
          </TabsContent>

          <TabsContent value="linked" className="m-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {linkedAccountsList
                .filter((account) => account.name.toLowerCase().includes(searchQuery.toLowerCase()))
                .map((account) => (
                  <AccountCard
                    key={account.id}
                    account={account}
                    onEdit={() => handleEditAccount(account.id)}
                    onDelete={() => openDeleteDialog(account.id)}
                  />
                ))}
              <AddAccountCard type="linked" onClick={() => setIsAddModalOpen(true)} />
            </div>
          </TabsContent>

          <TabsContent value="manual" className="m-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {manualAccountsList
                .filter((account) => account.name.toLowerCase().includes(searchQuery.toLowerCase()))
                .map((account) => (
                  <AccountCard
                    key={account.id}
                    account={account}
                    onEdit={() => handleEditAccount(account.id)}
                    onDelete={() => openDeleteDialog(account.id)}
                  />
                ))}
              <AddAccountCard type="manual" onClick={() => setIsAddModalOpen(true)} />
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>Latest activity across your accounts</CardDescription>
        </CardHeader>
        <CardContent>
          {/* <RecentTransactions accounts={accounts.filter((acc) => acc.transactions && acc.transactions.length > 0)} /> */}
        </CardContent>
        <CardFooter className="border-t bg-muted/50 px-6 py-3">
          <Button variant="ghost" className="w-full justify-center" asChild>
            <Link to="/dashboard/records">
              View All Transactions
              <ArrowUpRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </CardFooter>
      </Card>

      {/* Modals */}
      <AddAccountModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddAccount={onCreate}
      />

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

function AddAccountCard({ type = "any", onClick }: { type?: string; onClick: () => void }) {
  return (
    <Card
      className="flex flex-col items-center justify-center p-6 h-full border-dashed bg-muted/50 hover:bg-muted/80 transition-colors cursor-pointer"
      onClick={onClick}
    >
      <div className="rounded-full bg-primary/10 p-3 mb-3">
        <Plus className="h-6 w-6 text-primary" />
      </div>
      <h3 className="font-medium mb-1">Add {type !== "any" ? type : ""} Account</h3>
      <p className="text-sm text-muted-foreground text-center">
        {type === "linked"
          ? "Connect to your bank for automatic updates"
          : type === "manual"
            ? "Manually track accounts not at your bank"
            : "Connect to your bank or add a manual account"}
      </p>
    </Card>
  )
}
