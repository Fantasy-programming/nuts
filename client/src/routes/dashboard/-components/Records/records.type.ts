
export interface Transaction {
  id: string
  description: string
  amount: number
  date: string
  payee: string
  category: string
  account: string
  avatarUrl?: string
}

export interface TransactionGroup {
  id: string
  date: string
  total: string
  transactions: Transaction[]
}

