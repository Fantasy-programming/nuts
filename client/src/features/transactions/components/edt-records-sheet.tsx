import { useState, useEffect, useCallback } from "react"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

import { Button } from "@/core/components/ui/button"
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetClose } from "@/core/components/ui/sheet"
import { Input } from "@/core/components/ui/input"
import { Textarea } from "@/core/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/core/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/core/components/ui/tabs"
import { Badge } from "@/core/components/ui/badge"
import { X, Plus, ArrowDownLeft, ArrowUpRight, CloudUpload, FileText, Trash2 } from "lucide-react"
import { RecordSchema } from "../services/transaction.types"; // Your transaction schemas
import { NestedCategorySelect } from "@/core/components/nested-select"
import { Category } from "@/features/categories/services/category.types"
import { Account } from "@/features/accounts/services/account.types"
import { Form, FormField, FormItem, FormControl, FormMessage, FormLabel } from "@/core/components/ui/form"
import { DateTimePicker } from "@/core/components/ui/datetime"
import { groupCategories } from "@/core/components/nested-select/utils"
import { cn } from "@/lib/utils"

// Zod schema for the form values (remains largely the same)
const recordUpdateFormSchema = z.object({
  description: z.string().min(1, "Description is required"),
  amount: z.coerce.number().positive("Amount must be a positive number."), // Always positive in form
  transaction_datetime: z.date({ required_error: "Date is required" }),
  category_id: z.string().min(1, "Category is required"),
  account_id: z.string().min(1, "Account is required"),
  details: z.object({
    note: z.string().optional(),
    // If other details like payment_medium, location are editable, add them here.
  }).optional(),
  tags: z.array(z.string()).optional(), // Tags collected by the form
  attachments: z.array(z.instanceof(File)).optional(),
});

type RecordUpdateFormValues = z.infer<typeof recordUpdateFormSchema>;

// This DTO is what the sheet will pass to the onUpdateTransaction callback
type RecordUpdateDTO = Omit<RecordUpdateFormValues, 'attachments'> & {
  // No, amount should be part of RecordUpdateFormValues, parent handles sign.
  // Omit amount from here as well if parent applies sign
  // type RecordUpdateDTO = Omit<RecordUpdateFormValues, 'attachments' | 'amount'> & {
  //   amount: number; // Absolute amount from form
  type: "income" | "expense"; // The type selected in the form
  original_transaction_type: RecordSchema['type'];
};


interface EditTransactionSheetProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: RecordSchema | null;
  onUpdateTransaction: (
    id: string,
    // Pass the raw form values; parent can derive type and sign
    updateData: RecordUpdateFormValues & { new_type: 'income' | 'expense', original_type: RecordSchema['type'] },
    newAttachments?: File[]
  ) => void; // Or Promise<void>
  accounts: Account[];
  categories: Category[];
  isSubmitting?: boolean;
}

export default function EditTransactionSheet({
  isOpen,
  onClose,
  transaction,
  onUpdateTransaction,
  accounts,
  categories,
  isSubmitting,
}: EditTransactionSheetProps) {
  const [transactionNature, setTransactionNature] = useState<"expense" | "income">("expense");
  const [newTag, setNewTag] = useState("");

  const grouppedCategories = groupCategories(categories);

  const form = useForm<RecordUpdateFormValues>({
    resolver: zodResolver(recordUpdateFormSchema), // Use the renamed schema
    defaultValues: {
      description: "",
      amount: 0,
      transaction_datetime: new Date(),
      category_id: "",
      account_id: "",
      details: { note: "" },
      tags: [],
      attachments: [],
    },
  });

  const currentAmountForDisplay = form.watch("amount");

  useEffect(() => {
    if (transaction) {
      let nature: "expense" | "income" = "expense"; // Default
      if (transaction.type === "expense") {
        nature = "expense";
      } else if (transaction.type === "income") {
        nature = "income";
      } else if (transaction.type === "transfer") {
        console.warn(
          "EditTransactionSheet: Editing a 'transfer' transaction. This form is designed for 'expense' or 'income'. Submitting will change the transaction type. The 'amount' for a transfer is typically positive."
        );
        // For transfers, default to 'income' so amount is initially positive.
        // The 'type' will change to 'income' or 'expense' upon submission based on tab.
        nature = "income";
      } else {
        // Fallback for older data or unexpected types, infer from amount sign
        nature = transaction.amount >= 0 ? "income" : "expense";
      }
      setTransactionNature(nature);

      form.reset({
        description: transaction.description || "",
        amount: Math.abs(transaction.amount) || 0, // Form always handles positive amount
        transaction_datetime: new Date(transaction.transaction_datetime), // RecordSchema uses date object
        category_id: transaction.category?.id?.toString() || "", // From nested category object
        account_id: transaction.account?.id?.toString() || "",   // From nested account object
        details: {
          note: transaction.details?.note || "",
          // Populate other editable details fields here if added to form
        },
        // Your RecordSchema does not have top-level tags.
        // If tags are stored elsewhere or as (transaction as any).tags:
        tags: (transaction as any).tags || [],
        // If tags are within transaction.details (e.g. transaction.details.tags):
        // tags: transaction.details?.tags || [], // Adjust if tags are in details
        attachments: [], // New attachments are always reset
      });
    } else {
      form.reset();
      setTransactionNature("expense");
    }
  }, [transaction, form, categories, accounts]); // Added categories and accounts as dependencies for safety if IDs might not exist

  const handleAddTag = useCallback(() => { /* ... same as before ... */ }, [newTag, form]);
  const handleRemoveTag = useCallback((tagToRemove: string) => { /* ... same as before ... */ }, [form]);

  const onSubmit = (values: RecordUpdateFormValues) => {
    if (!transaction) return;

    // The parent component (onUpdateTransaction) will handle:
    // - Setting the correct sign for 'amount' based on 'transactionNature'.
    // - Mapping 'category_id', 'account_id' to full objects if its internal state uses RecordSchema.
    // - Uploading 'values.attachments'.
    // - Persisting 'tags' appropriately (e.g., in details or a separate system).

    const updatePayload = {
      ...values, // contains description, amount (abs), transaction_datetime, category_id, account_id, details, tags
      new_type: transactionNature,
      original_type: transaction.type,
    };

    onUpdateTransaction(transaction.id, updatePayload, values.attachments);

    // Consider closing the sheet only after onUpdateTransaction promise (if any) resolves.
    // For now, it might close before submission completes if onUpdateTransaction is async.
    // onClose();
  };

  if (!isOpen || !transaction) return null;

  const currencySymbol = "$"; // TODO: Make dynamic based on account or user settings

  // The rest of the JSX structure (Sheet, SheetHeader, Form, Fields, SheetFooter)
  // remains the same as in the previous detailed JSX response.
  // Ensure FormField names match `recordUpdateFormSchema`.
  // For example, `details.note` for notes.
  // The "Attachments" section also remains the same.

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent
        className={cn(
          // Base internal structure (you already have this)
          "p-0",
          "flex flex-col",

          // --- Overrides and additions for the "floating panel" style ---
          // 1. Positioning and Sizing:
          "top-4", // 1rem margin from the top of the viewport
          "bottom-4", // 1rem margin from the bottom of the viewport
          "right-4",
          "h-auto", // Crucial: Override shadcn's default h-full for side="right"
          // This makes height determined by top-4 and bottom-4.
          // `right-0` is typically part of the `side="right"` variant, so it should be flush right.

          // 2. Width Control:
          // On small screens (mobile), make it almost full width but with a left margin.
          // `theme(spacing.4)` refers to 1rem by default in Tailwind.
          "w-[calc(100%-theme(spacing.4))]", // e.g., 1rem left margin because right is 0
          // On larger screens, use auto width up to a max-width.
          // Adjust these breakpoints and max-widths as needed for your design.
          "sm:w-auto sm:max-w-md md:max-w-lg lg:max-w-xl xl:max-w-2xl",
          "[&>button:last-child]:hidden",
          // 3. Visual Styling (like images 2 & 3):
          "rounded-lg", // Rounded corners on the left side (top-left, bottom-left)
          // Since it's flush right (right-0), only left corners are "internal"
          "border-l border-t border-b", // Borders on the top, left, and bottom edges
          "shadow-xl", // A more pronounced shadow for the floating effect

          // Ensure background is applied (shadcn default is bg-background, but being explicit can help)
          "bg-background"
        )}
      >
        {/* ... SheetHeader from previous response ... */}
        <SheetHeader className="p-6 bg-muted/20">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-lg">Edit Transaction</SheetTitle>
            <SheetClose asChild>
              <Button variant="ghost" size="icon">
                <X className="h-4 w-4" />
              </Button>
            </SheetClose>
          </div>
          <SheetDescription>
            Update details for this {transactionNature}.
            Current amount: {currencySymbol}
            {currentAmountForDisplay.toFixed(2)}
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          {/* Add overflow-y-auto to the form itself if content exceeds viewport */}
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Tabs for Expense/Income */}
            <Tabs
              value={transactionNature}
              onValueChange={(value) => {
                if (transaction?.type === "transfer") {
                  console.warn("Changing type tab for a transaction that was originally a transfer. This will change its type upon saving.");
                }
                setTransactionNature(value as "expense" | "income")
              }
              }
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="expense" className="flex items-center gap-2" disabled={transaction?.type === 'transfer' && isSubmitting /* Optional: Disable if it was a transfer? */}>
                  <ArrowDownLeft className="h-4 w-4" /> Expense
                </TabsTrigger>
                <TabsTrigger value="income" className="flex items-center gap-2" disabled={transaction?.type === 'transfer' && isSubmitting /* Optional: Disable if it was a transfer? */}>
                  <ArrowUpRight className="h-4 w-4" /> Income
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Description Field */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Coffee with team, Salary" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Amount & Date Fields (Grid) */}
            <div className="grid md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                          {currencySymbol}
                        </span>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          className="pl-7"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
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
                    <FormLabel>Date & Time</FormLabel>
                    <FormControl>
                      <DateTimePicker
                        value={field.value}
                        onChange={field.onChange}
                        hourCycle={12} // Or 24
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Category & Account Fields (Grid) */}
            <div className="grid md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="category_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <NestedCategorySelect
                      categories={grouppedCategories}
                      value={field.value}
                      onValueChange={field.onChange}
                      placeholder="Select a category"
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="account_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Account</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select an account" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {accounts.map((account) => (
                          <SelectItem key={account.id} value={account.id.toString()}>
                            <div className="flex items-center gap-2">
                              {account.meta?.institution || account.institution /* backward compatibility */ ? ( // Check both meta.institution and root institution
                                <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold ring-1 ring-primary/20">
                                  {((account.meta?.institution || account.institution) ?? "NA").substring(0, 1).toUpperCase()}
                                </div>
                              ) : (
                                <div className="h-5 w-5 rounded-full bg-muted"></div>
                              )}
                              <span>{account.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Notes Field */}
            <FormField
              control={form.control}
              name="details.note" // Correctly namespaced
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

            {/* Tags Field */}
            <FormField
              control={form.control}
              name="tags" // Stays top-level as per current form schema
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tags <span className="text-muted-foreground text-xs">(Optional)</span></FormLabel>
                  <div className="flex items-center gap-2">
                    <Input
                      id="newTag"
                      placeholder="Type a tag and press Enter"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddTag();
                        }
                      }}
                      className="flex-grow"
                    />
                    <Button type="button" variant="outline" onClick={handleAddTag}>
                      <Plus className="h-4 w-4 mr-1" /> Add Tag
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {(field.value || []).map((tag) => (
                      <Badge key={tag} variant="secondary" className="gap-1.5 py-1 px-2.5">
                        {tag}
                        <X className="h-3.5 w-3.5 cursor-pointer hover:text-destructive" onClick={() => handleRemoveTag(tag)} />
                      </Badge>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Attachments Section (same as previous response) */}
            <FormField
              control={form.control}
              name="attachments"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Attachments (Receipts, etc.) <span className="text-muted-foreground text-xs">(Optional)</span></FormLabel>
                  <FormControl>
                    <div className="flex items-center justify-center w-full">
                      <label
                        htmlFor="dropzone-file"
                        className={cn(
                          "flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-lg cursor-pointer",
                          "bg-background hover:bg-muted/50 dark:hover:bg-muted/20",
                          "border-muted-foreground/30 hover:border-muted-foreground/50"
                        )}
                      >
                        <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center">
                          <CloudUpload className="w-10 h-10 mb-3 text-muted-foreground" />
                          <p className="mb-2 text-sm text-muted-foreground">
                            <span className="font-semibold">Click to upload</span> or drag and drop
                          </p>
                          <p className="text-xs text-muted-foreground">PDF, JPG, PNG, GIF (MAX. 10MB each)</p>
                        </div>
                        <Input
                          id="dropzone-file"
                          type="file"
                          className="hidden"
                          multiple
                          accept=".pdf,.jpg,.jpeg,.png,.gif"
                          onChange={(e) => {
                            const newFiles = Array.from(e.target.files || []);
                            const currentFiles = field.value || [];
                            field.onChange([...currentFiles, ...newFiles]);
                          }}
                        />
                      </label>
                    </div>
                  </FormControl>
                  {(field.value || []).length > 0 && (
                    <div className="mt-3 space-y-2">
                      <p className="text-sm font-medium text-foreground">New files to upload:</p>
                      <div className="space-y-2">
                        {(field.value as File[]).map((file, index) => (
                          <div key={index} className="flex items-center justify-between p-2 border rounded-md bg-muted/30">
                            <div className="flex items-center gap-2 truncate">
                              <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                              <span className="text-sm truncate" title={file.name}>{file.name}</span>
                              <span className="text-xs text-muted-foreground">({(file.size / 1024).toFixed(1)} KB)</span>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-destructive"
                              onClick={() => {
                                const updatedFiles = (field.value as File[]).filter((_, i) => i !== index);
                                field.onChange(updatedFiles);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>

        {/* ... SheetFooter from previous response ... */}
        <SheetFooter className="p-6 border-t bg-muted/20">
          <Button variant="outline" type="button" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            type="submit"
            onClick={form.handleSubmit(onSubmit)}
            disabled={isSubmitting || !form.formState.isDirty || !form.formState.isValid /* Optional: also check isValid */}
          >
            {isSubmitting ? "Saving..." : "Save Changes"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
