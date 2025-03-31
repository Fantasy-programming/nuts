import { ArrowUpRight, CreditCard, DollarSign, ShoppingBag, Utensils, Home, Car, Gift } from "lucide-react"
import { AccountWTrend } from "../services/account.types"

export default function RecentTransactions({ accounts }: { accounts: AccountWTrend[] }) {
  // Combine all transactions from all accounts

  const sortedTransactions = accounts.flatMap((account) =>
    account.transactions?.map((transaction) => ({
      ...transaction,
      accountName: account.name,
      accountId: account.id,
    })),
  )


  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case "food":
        return <Utensils className="h-4 w-4" />
      case "income":
        return <DollarSign className="h-4 w-4" />
      case "transfer":
        return <ArrowUpRight className="h-4 w-4" />
      case "investment":
        return <CreditCard className="h-4 w-4" />
      case "shopping":
        return <ShoppingBag className="h-4 w-4" />
      case "housing":
        return <Home className="h-4 w-4" />
      case "transportation":
        return <Car className="h-4 w-4" />
      default:
        return <Gift className="h-4 w-4" />
    }
  }

  return (
    <div className="space-y-4">
      {sortedTransactions?.length === 0 ? (
        <div className="text-center py-6 text-muted-foreground">No recent transactions to display</div>
      ) : (
        <div className="space-y-2">
          {sortedTransactions?.map((transaction) => (
            <div
              key={`${transaction?.accountId}-${transaction?.id}`}
              className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`rounded-full p-2 ${transaction?.amount > 0
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
                    : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                    }`}
                >
                  {getCategoryIcon(transaction?.category)}
                </div>
                <div>
                  <div className="font-medium">{transaction.name}</div>
                  <div className="text-sm text-muted-foreground flex items-center gap-1">
                    <span>{transaction.accountName}</span>
                    <span className="text-xs">•</span>
                    <span>{transaction.date}</span>
                  </div>
                </div>
              </div>
              <div className={`font-medium ${transaction.amount > 0 ? "text-emerald-600 dark:text-emerald-400" : ""}`}>
                {transaction.amount > 0 ? "+" : ""}${Math.abs(transaction.amount).toFixed(2)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

