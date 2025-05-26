import { Button } from "@/core/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/core/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/core/components/ui/popover";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import React, { useMemo, useCallback } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/core/components/ui/select";
import type { Account } from "@/features/accounts/services/account.types"
import type { Category } from "@/features/categories/services/category.types";

interface TransactionFiltersProps {
  onCategoryChange: (values: string[]) => void;
  onAccountChange: (values: string[]) => void;
  onDateRangeChange: (value: string) => void;
  onReset: () => void;
  categories: Category[];
  accounts: Account[];
}

export function RecordsFilters({ onCategoryChange, onAccountChange, onDateRangeChange, onReset, categories, accounts }: TransactionFiltersProps) {
  const [openCategory, setOpenCategory] = React.useState(false);
  const [openAccount, setOpenAccount] = React.useState(false);
  const [selectedCategories, setSelectedCategories] = React.useState<string[]>([]);
  const [selectedAccounts, setSelectedAccounts] = React.useState<string[]>([]);

  const handleCategoryChange = useCallback(
    (category: string) => {
      setSelectedCategories((prev) => {
        const isSelected = prev.includes(category);
        const updated = isSelected ? prev.filter((c) => c !== category) : [...prev, category];

        onCategoryChange(updated);
        return updated;
      });
    },
    [onCategoryChange]
  );

  const handleAccountChange = (account: string) => {
    const updatedAccounts = selectedAccounts.includes(account) ? selectedAccounts.filter((a) => a !== account) : [...selectedAccounts, account];
    setSelectedAccounts(updatedAccounts);
    onAccountChange(updatedAccounts);
  };

  const categoryItems = useMemo(
    () =>
      categories.map((category) => (
        <CommandItem key={category} onSelect={() => handleCategoryChange(category)}>
          <Check className={cn("mr-2 h-4 w-4", selectedCategories.includes(category) ? "opacity-100" : "opacity-0")} />
          {category}
        </CommandItem>
      )),
    [categories, selectedCategories, handleCategoryChange]
  );

  return (
    <div className="bg-muted/50 grid gap-4 rounded-lg border p-4">
      <div className="grid gap-4 md:grid-cols-3">
        <Popover open={openCategory} onOpenChange={setOpenCategory}>
          <PopoverTrigger asChild>
            <Button variant="outline" role="combobox" aria-expanded={openCategory} className="justify-between">
              {selectedCategories.length > 0 ? `${selectedCategories.length} selected` : "Select categories"}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[200px] p-0">
            <Command>
              <CommandInput placeholder="Search category..." />
              <CommandList>
                <CommandEmpty>No category found.</CommandEmpty>
                <CommandGroup>{categoryItems}</CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        <Popover open={openAccount} onOpenChange={setOpenAccount}>
          <PopoverTrigger asChild>
            <Button variant="outline" role="combobox" aria-expanded={openAccount} className="justify-between">
              {selectedAccounts.length > 0 ? `${selectedAccounts.length} selected` : "Select accounts"}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[200px] p-0">
            <Command>
              <CommandInput placeholder="Search account..." />
              <CommandList>
                <CommandEmpty>No account found.</CommandEmpty>
                <CommandGroup>
                  {accounts.map((account) => (
                    <CommandItem key={account} onSelect={() => handleAccountChange(account)}>
                      <Check className={cn("mr-2 h-4 w-4", selectedAccounts.includes(account) ? "opacity-100" : "opacity-0")} />
                      {account}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        <div className="space-y-2">
          <label className="text-sm font-medium">Date Range</label>
          <Select onValueChange={onDateRangeChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select date range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex justify-end space-x-2">
        <Button variant="outline" onClick={onReset}>
          Reset
        </Button>
        <Button>Apply Filters</Button>
      </div>
    </div>
  );
}
