import { useState, useCallback, useMemo } from "react"
import { CalendarIcon, FilterIcon, ChevronDown, X, Check, ChevronRight } from "lucide-react"
import { Button } from "@/core/components/ui/button"
import { Badge } from "@/core/components/ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "@/core/components/ui/popover"
import { Calendar } from "@/core/components/ui/calendar"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/core/components/ui/command"
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

interface TransactionFilterDropdownProps {
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

export function TransactionFilterDropdown({
  filters,
  onFiltersChange,
  onClearAll,
}: TransactionFilterDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [activeSubmenu, setActiveSubmenu] = useState<string | null>(null)
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

  // Transform data for dropdowns
  const accountOptions = useMemo(() => 
    accounts.map((account) => ({
      value: account.id,
      label: `${account.name} (${account.currency})`,
    })), [accounts]
  )

  const categoryOptions = useMemo(() => 
    categories.map((category) => ({
      value: category.id,
      label: category.name,
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

  // Helper to get filter label
  const getFilterLabel = (key: keyof TransactionFilterState, value: any) => {
    switch (key) {
      case 'account_id':
        return accountOptions.find(opt => opt.value === value)?.label || 'Account'
      case 'category_id':
        return categoryOptions.find(opt => opt.value === value)?.label || 'Category'
      case 'type':
        return TRANSACTION_TYPES.find(opt => opt.value === value)?.label || 'Type'
      case 'currency':
        return CURRENCIES.find(opt => opt.value === value)?.label || 'Currency'
      case 'start_date':
        return `From: ${format(value as Date, "MMM dd, yyyy")}`
      case 'end_date':
        return `To: ${format(value as Date, "MMM dd, yyyy")}`
      default:
        return String(value)
    }
  }

  // Filter menu items
  const filterMenuItems = [
    {
      key: 'accounts',
      label: 'Accounts',
      icon: '🏦',
      hasSubmenu: true,
    },
    {
      key: 'categories',
      label: 'Categories',
      icon: '📂',
      hasSubmenu: true,
    },
    {
      key: 'type',
      label: 'Transaction Type',
      icon: '🔄',
      hasSubmenu: true,
    },
    {
      key: 'currency',
      label: 'Currency',
      icon: '💱',
      hasSubmenu: true,
    },
    {
      key: 'date',
      label: 'Date Range',
      icon: '📅',
      hasSubmenu: true,
    },
  ]

  const renderSubmenu = (menuKey: string) => {
    switch (menuKey) {
      case 'accounts':
        return (
          <Command>
            <CommandInput placeholder="Search accounts..." />
            <CommandList>
              <CommandEmpty>No accounts found.</CommandEmpty>
              <CommandGroup>
                {accountOptions.map((account) => (
                  <CommandItem
                    key={account.value}
                    value={account.value}
                    onSelect={() => {
                      updateFilter('account_id', account.value)
                      setActiveSubmenu(null)
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        filters.account_id === account.value ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {account.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        )

      case 'categories':
        return (
          <Command>
            <CommandInput placeholder="Search categories..." />
            <CommandList>
              <CommandEmpty>No categories found.</CommandEmpty>
              <CommandGroup>
                {categoryOptions.map((category) => (
                  <CommandItem
                    key={category.value}
                    value={category.value}
                    onSelect={() => {
                      updateFilter('category_id', category.value)
                      setActiveSubmenu(null)
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        filters.category_id === category.value ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {category.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        )

      case 'type':
        return (
          <Command>
            <CommandList>
              <CommandGroup>
                {TRANSACTION_TYPES.map((type) => (
                  <CommandItem
                    key={type.value}
                    value={type.value}
                    onSelect={() => {
                      updateFilter('type', type.value)
                      setActiveSubmenu(null)
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        filters.type === type.value ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {type.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        )

      case 'currency':
        return (
          <Command>
            <CommandList>
              <CommandGroup>
                {CURRENCIES.map((currency) => (
                  <CommandItem
                    key={currency.value}
                    value={currency.value}
                    onSelect={() => {
                      updateFilter('currency', currency.value)
                      setActiveSubmenu(null)
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        filters.currency === currency.value ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {currency.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        )

      case 'date':
        return (
          <div className="p-2 space-y-3 min-w-[300px]">
            <div className="space-y-2">
              <label className="text-sm font-medium">From</label>
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
                    {filters.start_date ? format(filters.start_date, "MMM dd, yyyy") : "Select start date"}
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

            <div className="space-y-2">
              <label className="text-sm font-medium">To</label>
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
                    {filters.end_date ? format(filters.end_date, "MMM dd, yyyy") : "Select end date"}
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
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Active Filters */}
      {Object.entries(filters).map(([key, value]) => {
        if (!value) return null
        return (
          <Badge
            key={key}
            variant="secondary"
            className="flex items-center gap-1 px-2 py-1"
          >
            {getFilterLabel(key as keyof TransactionFilterState, value)}
            <button
              onClick={() => removeFilter(key as keyof TransactionFilterState)}
              className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        )
      })}

      {/* Filter Button */}
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="relative">
            <FilterIcon className="mr-2 h-4 w-4" />
            Filter
            {activeFilterCount > 0 && (
              <Badge variant="default" className="ml-2 h-5 w-5 p-0 text-xs">
                {activeFilterCount}
              </Badge>
            )}
            <ChevronDown className="ml-1 h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0" align="start">
          <div className="flex">
            {/* Main Menu */}
            <div className="w-48 border-r">
              <div className="p-2 border-b">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">Filters</span>
                  {activeFilterCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={onClearAll}
                      className="h-auto p-1 text-xs"
                    >
                      Clear all
                    </Button>
                  )}
                </div>
              </div>
              <div className="py-1">
                {filterMenuItems.map((item) => (
                  <button
                    key={item.key}
                    className={cn(
                      "w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-accent",
                      activeSubmenu === item.key && "bg-accent"
                    )}
                    onMouseEnter={() => setActiveSubmenu(item.key)}
                    onClick={() => setActiveSubmenu(activeSubmenu === item.key ? null : item.key)}
                  >
                    <div className="flex items-center">
                      <span className="mr-2">{item.icon}</span>
                      {item.label}
                    </div>
                    {item.hasSubmenu && <ChevronRight className="h-4 w-4" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Submenu */}
            {activeSubmenu && (
              <div className="flex-1 min-w-[250px]">
                {renderSubmenu(activeSubmenu)}
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}