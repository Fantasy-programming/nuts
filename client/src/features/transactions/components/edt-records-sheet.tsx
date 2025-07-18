import { useState, useEffect, useMemo, memo } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { logger } from "@/lib/logger"
import { categoryService } from "@/features/categories/services/category"
import { accountService } from "@/features/accounts/services/account";
import { getTransaction, updateTransaction } from "../services/transaction"
import { cn, debounce } from "@/lib/utils"

import { Button } from "@/core/components/ui/button"
import { Input } from "@/core/components/ui/input"
import { Textarea } from "@/core/components/ui/textarea"
import { Sheet, SheetContent, SheetTitle, SheetClose, SheetHeader, SheetDescription } from "@/core/components/ui/sheet"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/core/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/core/components/ui/tabs"
import { X, ArrowDownLeft, ArrowUpRight, Loader2, Info, Lock } from "lucide-react"
import { RecordUpdateSchema, recordUpdateSchema } from "../services/transaction.types";
import { Form, FormField, FormItem, FormControl, FormMessage, FormLabel } from "@/core/components/ui/form"
import { DatetimePicker } from "@/core/components/ui/datetime"
import { SearchableSelect, SearchableSelectOption } from "@/core/components/ui/search-select"
import { Root } from "@radix-ui/react-visually-hidden"
import { useBrandImage } from "@/features/accounts/hooks/useBrand"
import { config } from "@/lib/env"
import { Account } from "@/features/accounts/services/account.types"
import { toast } from "sonner"
import { RecurringSelect } from "./recurring-select"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/core/components/ui/tooltip"


interface EditTransactionSheetProps {
  isOpen: boolean;
  onClose: () => void;
  transactionId: string | null;
}


const FormLabelWithLock = ({ isLocked, children }: { isLocked: boolean; children: React.ReactNode }) => (
  <FormLabel className="flex items-center gap-1.5">
    {children}
    {isLocked && <Lock className="h-3 w-3 text-muted-foreground" />}
  </FormLabel>
);

export default function EditTransactionSheet({
  isOpen,
  onClose,
  transactionId,
}: EditTransactionSheetProps) {
  const [transactionNature, setTransactionNature] = useState<"expense" | "income">("expense");
  const [recurringType, setRecurringType] = useState<string>("one-time");
  const queryClient = useQueryClient();

  const {
    data: transaction,
    isFetching: detailFetching,
  } = useQuery({
    queryKey: ["transaction", transactionId],
    queryFn: () => getTransaction(transactionId!),
    enabled: !!transactionId,
    initialData: () => queryClient.getQueryData(["transaction", transactionId]),
    staleTime: 0,
    gcTime: 5 * 60_000,
  });

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: categoryService.getCategories,
    gcTime: 1000 * 60 * 5,
    staleTime: 1000 * 60 * 2,
    refetchOnMount: false,
    retry: 1,
  });

  const { data: accounts, isLoading: accountsLoading } = useQuery({
    queryKey: ["accounts"],
    queryFn: accountService.getAccounts,
    gcTime: 1000 * 60 * 5,
    staleTime: 1000 * 60 * 2,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: 1,
  });

  const form = useForm<RecordUpdateSchema>({
    resolver: zodResolver(recordUpdateSchema),
    mode: "onChange",
    defaultValues: {
      description: "",
      amount: 0,
      transaction_datetime: new Date(),
      category_id: "",
      account_id: "",
      details: { note: "" },
    },
  });

  const isSyncedTransaction = transaction?.is_external === true;

  const updateMutation = useMutation({
    mutationFn: (params: { id: string; data: RecordUpdateSchema }) =>
      updateTransaction(params.id, params.data),
    onSuccess: () => {
      toast.success("Transaction updated successfully!");
      // Invalidate queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ["transaction", transactionId] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
    },
    onError: (error: Error) => {
      logger.error(error.message);
      toast.error(error.message || "An error occurred.");
    },
  });

  const debouncedSave = useMemo(
    () => debounce((values: RecordUpdateSchema) => {
      console.log("Debounced save triggered with values:", values);

      if (!transaction) {
        console.log("No transaction found, skipping save");
        return;
      }

      if (!form.formState.isValid) {
        console.log("Form is not valid, skipping save. Errors:", form.formState.errors);
        return;
      }


      console.log("Submitting update payload:", values);
      updateMutation.mutateAsync({ id: transaction.id, data: values as RecordUpdateSchema });
    }, 600),
    [transaction, updateMutation, form.formState.isValid, form.formState.errors],
  );

  useEffect(() => {
    const subscription = form.watch((values, { name, type }) => {

      // Only trigger save on actual field changes, not on form reset
      if (type === 'change' && form.formState.isDirty && form.formState.isValid && transaction) {
        console.log("Triggering debounced save for field:", name);
        debouncedSave(values as RecordUpdateSchema);
      }
    });

    return () => subscription.unsubscribe();
  }, [form, transaction, debouncedSave]);

  // Cancel debounced calls when sheet closes
  useEffect(() => () => debouncedSave.cancel(), [debouncedSave]);

  useEffect(() => {
    if (transaction) {
      let nature: "expense" | "income" = "expense";

      if (transaction.type === "expense") {
        nature = "expense";
      } else if (transaction.type === "income") {
        nature = "income";
      } else if (transaction.type === "transfer") {
        console.warn(
          "EditTransactionSheet: Editing a 'transfer' transaction. This form is designed for 'expense' or 'income'."
        );
        nature = "income";
      } else {
        nature = transaction.amount >= 0 ? "income" : "expense";
      }

      setTransactionNature(nature);

      const formData = {
        type: nature,
        old_type: nature,
        new_type: nature,
        description: transaction.description || "",
        amount: Math.abs(transaction.amount) || 0,
        transaction_datetime: new Date(transaction.transaction_datetime),
        category_id: transaction.category_id || "",
        account_id: transaction.account_id || "",
        details: {
          note: transaction.details?.note || "",
        },
      };

      console.log("Resetting form with data:", formData);
      form.reset(formData);
    } else {
      form.reset();
      setTransactionNature("expense");
    }
  }, [transaction, form]);

  const categoriesOptionsForSelect: SearchableSelectOption[] = useMemo(() => {
    if (!categories) return [];
    return categories.map(category => ({
      value: category.id,
      label: `${category.name}`,
      keywords: [category.name]
    }));
  }, [categories]);


  if (!isOpen || !transaction) return null;

  const currencySymbol = "$";




  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent
        className={cn(
          "p-0",
          "flex flex-col",
          "top-4",
          "bottom-4",
          "right-4",
          "h-auto",
          "w-[calc(100%-theme(spacing.4))]",
          "sm:w-auto sm:max-w-md md:max-w-lg lg:max-w-xl xl:max-w-2xl",
          "[&>button:last-child]:hidden",
          "rounded-lg",
          "border-l border-t border-b",
          "shadow-xl",
          "bg-background"
        )}
      >
        <SheetHeader className="p-6 pb-0 bg-muted/20">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-lg flex gap-1 items-center">
              Edit Transaction
              {detailFetching && (
                <div className="flex items-center gap-2 px-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  refreshing details…
                </div>
              )}
            </SheetTitle>
            <Root>
              <SheetDescription>Edit details about your transactions</SheetDescription>
            </Root>
            <SheetClose asChild>
              <Button variant="ghost" size="icon">
                <X className="h-4 w-4" />
              </Button>
            </SheetClose>
          </div>
        </SheetHeader>

        <Form {...form}>
          <form className="flex-1 overflow-y-auto p-6 pt-0 space-y-6">

            {isSyncedTransaction && (
              <div className="p-3 mt-4 rounded-md bg-blue-50 border border-blue-200 text-blue-800 flex items-center gap-3 text-sm">
                <Info className="h-5 w-5 flex-shrink-0" />
                <p>This is a synced transaction. Core details are locked to match your bank record. You can still change the category and notes.</p>
              </div>
            )}

            <Tabs
              value={transactionNature}
              onValueChange={(value) => {
                if (isSyncedTransaction) return; // Prevent changing type for synced transactions
                setTransactionNature(value as "expense" | "income");
              }}
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="expense" disabled={isSyncedTransaction} className="flex items-center gap-2">
                  <ArrowDownLeft className="h-4 w-4" /> Expense
                </TabsTrigger>
                <TabsTrigger value="income" disabled={isSyncedTransaction} className="flex items-center gap-2">
                  <ArrowUpRight className="h-4 w-4" /> Income
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <TooltipProvider>
              {/* Description Field */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <Tooltip>
                      <TooltipTrigger asChild><div><FormLabelWithLock isLocked={isSyncedTransaction}>Description</FormLabelWithLock></div></TooltipTrigger>
                      {isSyncedTransaction && <TooltipContent><p>The merchant name is synced from your bank and cannot be changed.</p></TooltipContent>}
                    </Tooltip>
                    <FormControl>
                      <Input placeholder="e.g., Coffee with team" {...field} disabled={isSyncedTransaction} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Amount & Date Fields */}
              <div className="grid md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <Tooltip>
                        <TooltipTrigger asChild><div><FormLabelWithLock isLocked={isSyncedTransaction}>Amount</FormLabelWithLock></div></TooltipTrigger>
                        {isSyncedTransaction && <TooltipContent><p>Amount is synced from your bank and cannot be changed.</p></TooltipContent>}
                      </Tooltip>
                      <FormControl>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">{currencySymbol}</span>
                          <Input type="number" step="0.01" min="0" placeholder="0.00" className="pl-7" {...field} disabled={isSyncedTransaction} onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="transaction_datetime"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <Tooltip>
                        <TooltipTrigger asChild><div><FormLabelWithLock isLocked={isSyncedTransaction}>Date & Time</FormLabelWithLock></div></TooltipTrigger>
                        {isSyncedTransaction && <TooltipContent><p>The transaction date is synced from your bank and cannot be changed.</p></TooltipContent>}
                      </Tooltip>
                      <FormControl>
                        <DatetimePicker value={field.value} onChange={field.onChange} disabled={isSyncedTransaction} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Category & Account Fields */}
              <div className="grid md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="category_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <FormControl>
                        <SearchableSelect options={categoriesOptionsForSelect} value={field.value || ""} onChange={field.onChange} placeholder="Select category" searchPlaceholder="Search category..." />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="account_id"
                  render={({ field }) => (
                    <FormItem>
                      <Tooltip>
                        <TooltipTrigger asChild><div><FormLabelWithLock isLocked={isSyncedTransaction}>Account</FormLabelWithLock></div></TooltipTrigger>
                        {isSyncedTransaction && <TooltipContent><p>The account is synced from your bank and cannot be changed.</p></TooltipContent>}
                      </Tooltip>
                      <Select onValueChange={field.onChange} disabled={accountsLoading || isSyncedTransaction} value={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Select an account" /></SelectTrigger></FormControl>
                        <SelectContent>{accounts?.map((account) => <AccountOption key={account.id} account={account} />)}</SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="details.note"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes <span className="text-muted-foreground text-xs">(Optional)</span></FormLabel>
                    <FormControl>
                      <Textarea placeholder="Add any additional details or memo" {...field} value={field.value ?? ""} rows={3} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Recurring Transaction Option - Only show for non-synced transactions */}
              {!isSyncedTransaction && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Recurrence
                  </label>
                  <RecurringSelect
                    value={recurringType}
                    onChange={setRecurringType}
                    onCustomSave={(data) => {
                      console.log("Custom recurring data:", data);
                      // Handle custom recurring data
                    }}
                  />
                </div>
              )}
            </TooltipProvider>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  )
}

const AccountOption = memo(({ account }: { account: Account }) => {
  const { imageUrl } = useBrandImage(
    account.meta?.institution_name ?? "",
    config.VITE_BRANDFETCH_CLIENTID
  );

  return (
    <SelectItem value={account.id.toString()}>
      <div className="flex items-center gap-2">
        {imageUrl ? (
          <img src={imageUrl} alt="" className="h-5 w-5 rounded-full" />
        ) : (
          <div className="h-5 w-5 rounded-full bg-muted" />
        )}
        <span>{account.name}</span>
      </div>
    </SelectItem>
  );
});
