"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { Filter, CalendarIcon, DollarSign } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Separator } from "@/components/ui/separator"

export default function TransactionFiltersPopover({
  categories,
  accounts,
  activeFilters,
  setActiveFilters,
}: {
  categories: any[]
  accounts: any[]
  activeFilters: any
  setActiveFilters: (filters: any) => void
}) {
  const [localFilters, setLocalFilters] = useState({
    categoryIds: [] as number[],
    accountIds: [] as number[],
    dateRange: {
      from: undefined as Date | undefined,
      to: undefined as Date | undefined,
    },
    amountRange: {
      min: undefined as number | undefined,
      max: undefined as number | undefined,
    },
    type: undefined as string | undefined,
  })

  // Initialize local filters from active filters
  useEffect(() => {
    setLocalFilters({
      categoryIds: activeFilters.categoryIds || [],
      accountIds: activeFilters.accountIds || [],
      dateRange: {
        from: activeFilters.dateRange?.from ? new Date(activeFilters.dateRange.from) : undefined,
        to: activeFilters.dateRange?.to ? new Date(activeFilters.dateRange.to) : undefined,
      },
      amountRange: {
        min: activeFilters.amountRange?.min,
        max: activeFilters.amountRange?.max,
      },
      type: activeFilters.type,
    })
  }, [activeFilters])

  const handleCategoryToggle = (categoryId: number) => {
    setLocalFilters((prev) => {
      // Check if this is a main category
      const isMainCategory = categories.some((c) => c.id === categoryId)

      if (isMainCategory) {
        // If it's a main category, find all its subcategories
        const category = categories.find((c) => c.id === categoryId)
        const subcategoryIds = category?.subcategories?.map((sc: any) => sc.id) || []

        // If all subcategories are already selected, remove them all
        const allSubcategoriesSelected = subcategoryIds.every((id) => prev.categoryIds.includes(id))

        if (allSubcategoriesSelected) {
          return {
            ...prev,
            categoryIds: prev.categoryIds.filter((id) => !subcategoryIds.includes(id)),
          }
        } else {
          // Otherwise, add all subcategories that aren't already selected
          const newCategoryIds = [...prev.categoryIds]
          subcategoryIds.forEach((id) => {
            if (!newCategoryIds.includes(id)) {
              newCategoryIds.push(id)
            }
          })
          return {
            ...prev,
            categoryIds: newCategoryIds,
          }
        }
      } else {
        // If it's a subcategory, toggle it normally
        const newCategoryIds = prev.categoryIds.includes(categoryId)
          ? prev.categoryIds.filter((id) => id !== categoryId)
          : [...prev.categoryIds, categoryId]

        return {
          ...prev,
          categoryIds: newCategoryIds,
        }
      }
    })
  }

  const handleAccountToggle = (accountId: number) => {
    setLocalFilters((prev) => {
      const newAccountIds = prev.accountIds.includes(accountId)
        ? prev.accountIds.filter((id) => id !== accountId)
        : [...prev.accountIds, accountId]

      return {
        ...prev,
        accountIds: newAccountIds,
      }
    })
  }

  const handleDateRangeChange = (range: { from?: Date; to?: Date }) => {
    setLocalFilters((prev) => ({
      ...prev,
      dateRange: range,
    }))
  }

  const handleAmountChange = (field: "min" | "max", value: string) => {
    const numValue = value === "" ? undefined : Number.parseFloat(value)

    setLocalFilters((prev) => ({
      ...prev,
      amountRange: {
        ...prev.amountRange,
        [field]: numValue,
      },
    }))
  }

  const handleTypeChange = (value: string) => {
    setLocalFilters((prev) => ({
      ...prev,
      type: value === prev.type ? undefined : value,
    }))
  }

  const handleApplyFilters = () => {
    // Only include non-empty filters
    const filtersToApply: any = {}

    if (localFilters.categoryIds.length > 0) {
      filtersToApply.categoryIds = localFilters.categoryIds
    }

    if (localFilters.accountIds.length > 0) {
      filtersToApply.accountIds = localFilters.accountIds
    }

    if (localFilters.dateRange.from || localFilters.dateRange.to) {
      filtersToApply.dateRange = {}
      if (localFilters.dateRange.from) {
        filtersToApply.dateRange.from = localFilters.dateRange.from
      }
      if (localFilters.dateRange.to) {
        filtersToApply.dateRange.to = localFilters.dateRange.to
      }
    }

    if (localFilters.amountRange.min !== undefined || localFilters.amountRange.max !== undefined) {
      filtersToApply.amountRange = {}
      if (localFilters.amountRange.min !== undefined) {
        filtersToApply.amountRange.min = localFilters.amountRange.min
      }
      if (localFilters.amountRange.max !== undefined) {
        filtersToApply.amountRange.max = localFilters.amountRange.max
      }
    }

    if (localFilters.type) {
      filtersToApply.type = localFilters.type
    }

    setActiveFilters(filtersToApply)
  }

  const handleResetFilters = () => {
    setLocalFilters({
      categoryIds: [],
      accountIds: [],
      dateRange: {
        from: undefined,
        to: undefined,
      },
      amountRange: {
        min: undefined,
        max: undefined,
      },
      type: undefined,
    })
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-9 gap-1">
          <Filter className="h-4 w-4" />
          Filters
          {Object.keys(activeFilters).length > 0 && (
            <span className="ml-1 rounded-full bg-primary w-5 h-5 text-[10px] flex items-center justify-center text-primary-foreground">
              {Object.keys(activeFilters).length}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[340px] p-4" align="start">
        <div className="space-y-4">
          <h4 className="font-medium">Filter Transactions</h4>

          <div>
            <h5 className="text-sm font-medium mb-2">Transaction Type</h5>
            <RadioGroup value={localFilters.type || ""} onValueChange={handleTypeChange} className="flex gap-4">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="income" id="income" />
                <Label htmlFor="income">Income</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="expense" id="expense" />
                <Label htmlFor="expense">Expense</Label>
              </div>
            </RadioGroup>
          </div>

          <Separator />

          <div>
            <h5 className="text-sm font-medium mb-2">Date Range</h5>
            <div className="grid gap-2">
              <div className="flex items-center gap-2">
                <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  {localFilters.dateRange.from ? (
                    localFilters.dateRange.to ? (
                      <>
                        {format(localFilters.dateRange.from, "LLL dd, y")} -{" "}
                        {format(localFilters.dateRange.to, "LLL dd, y")}
                      </>
                    ) : (
                      <>From {format(localFilters.dateRange.from, "LLL dd, y")}</>
                    )
                  ) : localFilters.dateRange.to ? (
                    <>Until {format(localFilters.dateRange.to, "LLL dd, y")}</>
                  ) : (
                    "Select date range"
                  )}
                </span>
              </div>
              <Calendar
                initialFocus
                mode="range"
                selected={localFilters.dateRange}
                onSelect={handleDateRangeChange}
                numberOfMonths={1}
                className="border rounded-md p-3"
              />
            </div>
          </div>

          <Separator />

          <div>
            <h5 className="text-sm font-medium mb-2">Amount Range</h5>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="min-amount" className="text-xs">
                  Min Amount
                </Label>
                <div className="relative">
                  <DollarSign className="absolute left-2 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    id="min-amount"
                    type="number"
                    placeholder="Min"
                    className="pl-7"
                    value={localFilters.amountRange.min === undefined ? "" : localFilters.amountRange.min}
                    onChange={(e) => handleAmountChange("min", e.target.value)}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="max-amount" className="text-xs">
                  Max Amount
                </Label>
                <div className="relative">
                  <DollarSign className="absolute left-2 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    id="max-amount"
                    type="number"
                    placeholder="Max"
                    className="pl-7"
                    value={localFilters.amountRange.max === undefined ? "" : localFilters.amountRange.max}
                    onChange={(e) => handleAmountChange("max", e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          <Separator />

          <div>
            <h5 className="text-sm font-medium mb-2">Categories</h5>
            <div className="max-h-[200px] overflow-y-auto pr-1">
              {categories.map((category) => (
                <div key={category.id} className="mb-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={`category-${category.id}`}
                      checked={category.subcategories?.every((sc: any) => localFilters.categoryIds.includes(sc.id))}
                      onCheckedChange={() => handleCategoryToggle(category.id)}
                    />
                    <Label htmlFor={`category-${category.id}`} className="flex items-center gap-1 font-medium">
                      <category.icon className={`h-3.5 w-3.5 ${category.color}`} />
                      <span>{category.name}</span>
                    </Label>
                  </div>

                  {category.subcategories && category.subcategories.length > 0 && (
                    <div className="pl-6 ml-2 mt-1 space-y-1">
                      {category.subcategories.map((subcategory: any) => (
                        <div key={subcategory.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`subcategory-${subcategory.id}`}
                            checked={localFilters.categoryIds.includes(subcategory.id)}
                            onCheckedChange={() => handleCategoryToggle(subcategory.id)}
                          />
                          <Label htmlFor={`subcategory-${subcategory.id}`} className="text-sm">
                            {subcategory.name}
                          </Label>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <Separator />

          <div>
            <h5 className="text-sm font-medium mb-2">Accounts</h5>
            <div className="grid grid-cols-1 gap-2 max-h-[150px] overflow-y-auto pr-1">
              {accounts.map((account) => (
                <div key={account.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`account-${account.id}`}
                    checked={localFilters.accountIds.includes(account.id)}
                    onCheckedChange={() => handleAccountToggle(account.id)}
                  />
                  <Label htmlFor={`account-${account.id}`} className="text-sm">
                    {account.name}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-between pt-2">
            <Button variant="outline" size="sm" onClick={handleResetFilters}>
              Reset
            </Button>
            <Button size="sm" onClick={handleApplyFilters}>
              Apply Filters
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

