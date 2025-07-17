import { useForm } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { DatetimePicker } from "@/core/components/ui/datetime";
import { Button } from "@/core/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/core/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/core/components/ui/select";
import { Input } from "@/core/components/ui/input";
import { Switch } from "@/core/components/ui/switch";
import { Textarea } from "@/core/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/core/components/ui/card";
import { accountService } from "@/features/accounts/services/account";
import { categoryService } from "@/features/categories/services/category";
import { 
  RecurringTransactionCreate, 
  recurringTransactionCreateSchema,
  frequencyOptions,
  customFrequencyPatterns,
  getFrequencyDescription
} from "../services/recurring-transaction.types";
import { CalendarDays, Clock, Repeat, Settings } from "lucide-react";

interface RecurringTransactionFormProps {
  onSubmit: (data: RecurringTransactionCreate) => void;
  defaultValues?: Partial<RecurringTransactionCreate>;
  isLoading?: boolean;
}

export function RecurringTransactionForm({ 
  onSubmit, 
  defaultValues,
  isLoading = false 
}: RecurringTransactionFormProps) {
  const form = useForm<RecurringTransactionCreate>({
    resolver: zodResolver(recurringTransactionCreateSchema),
    defaultValues: {
      type: "expense",
      amount: 0,
      frequency: "monthly",
      frequency_interval: 1,
      auto_post: false,
      is_paused: false,
      start_date: new Date(),
      ...defaultValues,
    },
  });

  const { data: accounts = [] } = useQuery({
    queryKey: ["accounts"],
    queryFn: accountService.getAccounts,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: categoryService.getCategories,
  });

  const transactionType = form.watch("type");
  const frequency = form.watch("frequency");
  const frequencyInterval = form.watch("frequency_interval");

  const filteredAccounts = accounts.filter((account: any) => !account.deleted_at);
  const filteredCategories = categories.filter((category: any) => !category.deleted_at);

  const handleSubmit = (data: RecurringTransactionCreate) => {
    onSubmit(data);
  };

  const renderFrequencyOptions = () => {
    if (frequency !== "custom") {
      return (
        <FormField
          control={form.control}
          name="frequency_interval"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Repeat every</FormLabel>
              <FormControl>
                <div className="flex items-center space-x-2">
                  <Input
                    type="number"
                    min="1"
                    max="999"
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                  />
                  <span className="text-sm text-muted-foreground">
                    {frequency === "daily" ? (frequencyInterval === 1 ? "day" : "days") :
                     frequency === "weekly" ? (frequencyInterval === 1 ? "week" : "weeks") :
                     frequency === "monthly" ? (frequencyInterval === 1 ? "month" : "months") :
                     frequency === "yearly" ? (frequencyInterval === 1 ? "year" : "years") : ""}
                  </span>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      );
    }

    return (
      <div className="space-y-4">
        <FormField
          control={form.control}
          name="frequency_data.pattern"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Custom Pattern</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a pattern" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {customFrequencyPatterns.map((pattern) => (
                    <SelectItem key={pattern.value} value={pattern.value}>
                      {pattern.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    );
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Repeat className="h-5 w-5" />
              Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="template_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Template Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Monthly Rent" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Transaction Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="expense">Expense</SelectItem>
                        <SelectItem value="income">Income</SelectItem>
                        <SelectItem value="transfer">Transfer</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Input placeholder="Transaction description" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="account_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Account</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select account" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {filteredAccounts.map((account) => (
                          <SelectItem key={account.id} value={account.id}>
                            {account.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {filteredCategories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {transactionType === "transfer" && (
              <FormField
                control={form.control}
                name="destination_account_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Destination Account</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select destination account" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {filteredAccounts.map((account) => (
                          <SelectItem key={account.id} value={account.id}>
                            {account.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </CardContent>
        </Card>

        {/* Recurrence Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Recurrence Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="frequency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Frequency</FormLabel>
                    <Select onValueChange={(value) => {
                      field.onChange(value);
                      setSelectedFrequency(value);
                    }} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {frequencyOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="start_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Date</FormLabel>
                    <FormControl>
                      <DatetimePicker
                        value={field.value}
                        onChange={field.onChange}
                        
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {renderFrequencyOptions()}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="end_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Date (Optional)</FormLabel>
                    <FormControl>
                      <DatetimePicker
                        value={field.value}
                        onChange={field.onChange}
                        
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="max_occurrences"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Max Occurrences (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        placeholder="Unlimited"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || undefined)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-4">
              <FormField
                control={form.control}
                name="auto_post"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel>Auto-post transactions</FormLabel>
                      <p className="text-sm text-muted-foreground">
                        Automatically create transactions when due
                      </p>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="is_paused"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel>Start paused</FormLabel>
                      <p className="text-sm text-muted-foreground">
                        Create as paused (no transactions will be generated)
                      </p>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Advanced Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Advanced Settings
            </CardTitle>
            <CardDescription>
              Optional settings for better organization
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="details.note"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Additional notes about this recurring transaction..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="tags"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tags</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter tags separated by commas"
                      value={field.value?.join(", ") || ""}
                      onChange={(e) => {
                        const tags = e.target.value.split(",").map(tag => tag.trim()).filter(Boolean);
                        field.onChange(tags);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Preview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5" />
              Preview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              <p>
                <strong>Frequency:</strong> {getFrequencyDescription(frequency, frequencyInterval)}
              </p>
              <p>
                <strong>Next due:</strong> {form.watch("start_date")?.toLocaleDateString()}
              </p>
              <p>
                <strong>Amount:</strong> ${form.watch("amount")?.toFixed(2) || "0.00"}
              </p>
              <p>
                <strong>Auto-post:</strong> {form.watch("auto_post") ? "Yes" : "No"}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex justify-end space-x-2">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Creating..." : "Create Recurring Transaction"}
          </Button>
        </div>
      </form>
    </Form>
  );
}