import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/core/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/core/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/core/components/ui/select";
import { Switch } from "@/core/components/ui/switch";
import { Label } from "@/core/components/ui/label";
import { Input } from "@/core/components/ui/input";
import { DatetimePicker } from "@/core/components/ui/datetime";
import { accountService } from "@/features/accounts/services/account";
import { categoryService } from "@/features/categories/services/category";
import { RecurringTransactionFilters, frequencyOptions } from "../services/recurring-transaction.types";
import { Filter, X } from "lucide-react";

interface RecurringTransactionFiltersProps {
  filters: RecurringTransactionFilters;
  onFiltersChange: (filters: RecurringTransactionFilters) => void;
}

export function RecurringTransactionFiltersCard({ 
  filters, 
  onFiltersChange 
}: RecurringTransactionFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const { data: accounts = [] } = useQuery({
    queryKey: ["accounts"],
    queryFn: accountService.getAccounts,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: categoryService.getCategories,
  });

  const filteredAccounts = accounts.filter((account: any) => !account.deleted_at);
  const filteredCategories = categories.filter((category: any) => !category.deleted_at);

  const updateFilter = (key: keyof RecurringTransactionFilters, value: any) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const clearFilters = () => {
    onFiltersChange({});
  };

  const hasActiveFilters = Object.values(filters).some(value => value !== undefined);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
            {hasActiveFilters && (
              <span className="text-sm bg-primary text-primary-foreground px-2 py-1 rounded">
                {Object.values(filters).filter(v => v !== undefined).length}
              </span>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            {hasActiveFilters && (
              <Button variant="outline" size="sm" onClick={clearFilters}>
                <X className="h-4 w-4 mr-2" />
                Clear
              </Button>
            )}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? "Collapse" : "Expand"}
            </Button>
          </div>
        </div>
      </CardHeader>
      {isExpanded && (
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Account Filter */}
            <div className="space-y-2">
              <Label>Account</Label>
              <Select 
                value={filters.account_id || ""} 
                onValueChange={(value) => updateFilter("account_id", value || undefined)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All accounts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All accounts</SelectItem>
                  {filteredAccounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Category Filter */}
            <div className="space-y-2">
              <Label>Category</Label>
              <Select 
                value={filters.category_id || ""} 
                onValueChange={(value) => updateFilter("category_id", value || undefined)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All categories</SelectItem>
                  {filteredCategories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Frequency Filter */}
            <div className="space-y-2">
              <Label>Frequency</Label>
              <Select 
                value={filters.frequency || ""} 
                onValueChange={(value) => updateFilter("frequency", value || undefined)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All frequencies" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All frequencies</SelectItem>
                  {frequencyOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Template Name Filter */}
            <div className="space-y-2">
              <Label>Template Name</Label>
              <Input
                placeholder="Search template name..."
                value={filters.template_name || ""}
                onChange={(e) => updateFilter("template_name", e.target.value || undefined)}
              />
            </div>

            {/* Start Date Filter */}
            <div className="space-y-2">
              <Label>Start Date</Label>
              <DatetimePicker
                value={filters.start_date || null}
                onChange={(date) => updateFilter("start_date", date)}
              />
            </div>

            {/* End Date Filter */}
            <div className="space-y-2">
              <Label>End Date</Label>
              <DatetimePicker
                value={filters.end_date || null}
                onChange={(date) => updateFilter("end_date", date)}
              />
            </div>
          </div>

          {/* Toggle Filters */}
          <div className="flex flex-wrap gap-6">
            <div className="flex items-center space-x-2">
              <Switch
                id="paused-filter"
                checked={filters.is_paused === true}
                onCheckedChange={(checked) => 
                  updateFilter("is_paused", checked ? true : undefined)
                }
              />
              <Label htmlFor="paused-filter">Show only paused</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="auto-post-filter"
                checked={filters.auto_post === true}
                onCheckedChange={(checked) => 
                  updateFilter("auto_post", checked ? true : undefined)
                }
              />
              <Label htmlFor="auto-post-filter">Show only auto-post</Label>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}