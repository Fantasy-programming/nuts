import { useState, useCallback, useMemo } from "react"
import { CalendarIcon, FilterIcon, X } from "lucide-react"
import { Button } from "@/core/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/core/components/ui/card"
import { Label } from "@/core/components/ui/label"
import { SearchableSelect } from "@/core/components/ui/search-select"
import { Popover, PopoverContent, PopoverTrigger } from "@/core/components/ui/popover"
import { Calendar } from "@/core/components/ui/calendar"
import { Badge } from "@/core/components/ui/badge"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { useQuery } from "@tanstack/react-query"
import { adaptiveAccountService, adaptiveCategoryService } from "@/core/offline-first"

export interface TransactionFilterState {
  account_id?: string
  category_id?: string
  type?: "income" | "expense" | "transfer"
  start_date?: Date
  end_date?: Date
  currency?: string
}

interface TransactionFiltersProps {
  filters: TransactionFilterState
  onFiltersChange: (filters: TransactionFilterState) => void
  onClearAll: () => void
}

const TRANSACTION_TYPES = [
  { value: "income", label: "Income" },
  { value: "expense", label: "Expense" },
  { value: "transfer", label: "Transfer" },
]

const CURRENCIES = [
  { value: "USD", label: "USD" },
  { value: "EUR", label: "EUR" },
  { value: "GBP", label: "GBP" },
  { value: "CAD", label: "CAD" },
  { value: "JPY", label: "JPY" },
]

export function TransactionFilters({
  filters,
  onFiltersChange,
  onClearAll,
}: TransactionFiltersProps) {
  const [isDatePickerOpen, setIsDatePickerOpen] = useState<"start" | "end" | null>(null)

  // Fetch accounts and categories
  const { data: accounts = [] } = useQuery({
    queryKey: ["accounts"],
    queryFn: adaptiveAccountService.getAccounts,
  })

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: adaptiveCategoryService.getCategories,
  })

  // Transform data for SearchableSelect
  const accountOptions = useMemo(() => 
    accounts.map((account) => ({
      value: account.id,
      label: `${account.name} (${account.currency})`,
      keywords: [account.name, account.currency, account.type],
    })), [accounts]
  )

  const categoryOptions = useMemo(() => 
    categories.map((category) => ({
      value: category.id,
      label: category.name,
      keywords: [category.name],
    })), [categories]
  )

  const updateFilter = useCallback(
    (key: keyof TransactionFilterState, value: any) => {
      onFiltersChange({
        ...filters,
        [key]: value || undefined,
      })
    },
    [filters, onFiltersChange]
  )

  const removeFilter = useCallback(
    (key: keyof TransactionFilterState) => {
      const newFilters = { ...filters }
      delete newFilters[key]
      onFiltersChange(newFilters)
    },
    [filters, onFiltersChange]
  )

  // Count active filters
  const activeFilterCount = Object.values(filters).filter(Boolean).length

  // Helper to format date for display
  const formatDate = (date: Date | undefined) => {
    return date ? format(date, "MMM dd, yyyy") : undefined
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <FilterIcon className="h-4 w-4" />
            Filters
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="text-xs">
                {activeFilterCount}
              </Badge>
            )}
          </CardTitle>
          {activeFilterCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearAll}
              className="text-muted-foreground"
            >
              Clear all
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Transaction Type Filter */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Transaction Type</Label>
          <SearchableSelect
            options={TRANSACTION_TYPES}
            value={filters.type || ""}
            onChange={(value) => updateFilter("type", value)}
            placeholder="All types"
            searchPlaceholder="Search types..."
          />
          {filters.type && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => removeFilter("type")}
              className="h-6 px-2 text-xs"
            >
              <X className="h-3 w-3 mr-1" />
              Remove
            </Button>
          )}
        </div>

        {/* Account Filter */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Account</Label>
          <SearchableSelect
            options={accountOptions}
            value={filters.account_id || ""}
            onChange={(value) => updateFilter("account_id", value)}
            placeholder="All accounts"
            searchPlaceholder="Search accounts..."
            isLoading={accounts.length === 0}
          />
          {filters.account_id && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => removeFilter("account_id")}
              className="h-6 px-2 text-xs"
            >
              <X className="h-3 w-3 mr-1" />
              Remove
            </Button>
          )}
        </div>

        {/* Category Filter */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Category</Label>
          <SearchableSelect
            options={categoryOptions}
            value={filters.category_id || ""}
            onChange={(value) => updateFilter("category_id", value)}
            placeholder="All categories"
            searchPlaceholder="Search categories..."
            isLoading={categories.length === 0}
          />
          {filters.category_id && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => removeFilter("category_id")}
              className="h-6 px-2 text-xs"
            >
              <X className="h-3 w-3 mr-1" />
              Remove
            </Button>
          )}
        </div>

        {/* Currency Filter */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Currency</Label>
          <SearchableSelect
            options={CURRENCIES}
            value={filters.currency || ""}
            onChange={(value) => updateFilter("currency", value)}
            placeholder="All currencies"
            searchPlaceholder="Search currencies..."
          />
          {filters.currency && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => removeFilter("currency")}
              className="h-6 px-2 text-xs"
            >
              <X className="h-3 w-3 mr-1" />
              Remove
            </Button>
          )}
        </div>

        {/* Date Range Filter */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Date Range</Label>
          
          {/* Start Date */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">From</Label>
            <Popover open={isDatePickerOpen === "start"} onOpenChange={(open) => setIsDatePickerOpen(open ? "start" : null)}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !filters.start_date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formatDate(filters.start_date) || "Select start date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={filters.start_date}
                  onSelect={(date) => {
                    updateFilter("start_date", date)
                    setIsDatePickerOpen(null)
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* End Date */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">To</Label>
            <Popover open={isDatePickerOpen === "end"} onOpenChange={(open) => setIsDatePickerOpen(open ? "end" : null)}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !filters.end_date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formatDate(filters.end_date) || "Select end date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={filters.end_date}
                  onSelect={(date) => {
                    updateFilter("end_date", date)
                    setIsDatePickerOpen(null)
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {(filters.start_date || filters.end_date) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                removeFilter("start_date")
                removeFilter("end_date")
              }}
              className="h-6 px-2 text-xs"
            >
              <X className="h-3 w-3 mr-1" />
              Clear dates
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}