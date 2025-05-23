import { Building, CreditCard, PiggyBank, Wallet, TrendingUp } from "lucide-react"

// --- Data for SearchableSelect ---
export const accountTypeOptions = [
  {
    value: "checking",
    label: "Checking",
    icon: <Building className="mr-2 h-4 w-4 text-blue-500" />,
  },
  {
    value: "savings",
    label: "Savings",
    icon: <PiggyBank className="mr-2 h-4 w-4 text-emerald-500" />,
  },
  {
    value: "credit",
    label: "Credit Card", // Changed from "Credit" for clarity
    icon: <CreditCard className="mr-2 h-4 w-4 text-slate-500" />,
  },
  {
    value: "investment",
    label: "Investment",
    icon: <TrendingUp className="mr-2 h-4 w-4 text-purple-500" />,
  },
  {
    value: "cash",
    label: "Cash",
    icon: <Wallet className="mr-2 h-4 w-4 text-amber-500" />,
  },
  {
    value: "other",
    label: "Other",
    icon: <CreditCard className="mr-2 h-4 w-4 text-gray-400" />, // Generic icon
  },
];
