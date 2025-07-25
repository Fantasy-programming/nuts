import { useForm } from "react-hook-form";
import { useState, useCallback } from "react";
import { useQueries } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { DatetimePicker } from "@/core/components/ui/datetime";

import { Button } from "@/core/components/ui/button";
import { Root } from "@radix-ui/react-visually-hidden";
import {
  DialogDescription,
} from "@/core/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/core/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/core/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/core/components/ui/tabs";
import { Input } from "@/core/components/ui/input";
import { adaptiveAccountService, adaptiveCategoryService, adaptiveTransactionService } from "@/core/offline-first";
import { RecordsSubmit, RecordCreateSchema, recordCreateSchema } from "@/features/transactions/services/transaction.types";
import { ArrowUpRight, ArrowDownLeft, ArrowLeftRight } from "lucide-react";
import { ResponsiveDialog, ResponsiveDialogContent, ResponsiveDialogHeader, ResponsiveDialogTitle, ResponsiveDialogTrigger } from "@/core/components/ui/dialog-sheet";
import { useMutation } from "@tanstack/react-query"
import { useQueryClient } from "@tanstack/react-query"


export function RecordsDialog({ children }: React.PropsWithChildren) {
  const [isOpen, setIsOpen] = useState(false);
  const queryClient = useQueryClient();


  const createMutation = useMutation({
    mutationFn: adaptiveTransactionService.createTransaction,
    onSuccess: () => {
      setIsOpen(false);
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
    },
  });


  const onSubmit = useCallback((values: RecordCreateSchema) => {
    createMutation.mutate(values);
  }, [createMutation]);



  return (
    <ResponsiveDialog open={isOpen} onOpenChange={setIsOpen}>
      <ResponsiveDialogTrigger asChild>{children}</ResponsiveDialogTrigger>
      <ResponsiveDialogContent>
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>Create New Transaction</ResponsiveDialogTitle>
          <Root>
            <DialogDescription>Record a new transaction</DialogDescription>
          </Root>
        </ResponsiveDialogHeader>
        <RecordsForm onSubmit={onSubmit} />
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}


export function RecordsForm({ onSubmit }: { onSubmit: RecordsSubmit }) {
  const [transactionType, setTransactionType] = useState<"expense" | "income" | "transfer">("expense");

  const form = useForm<RecordCreateSchema>({
    resolver: zodResolver(recordCreateSchema),
    defaultValues: {
      type: "expense",
      amount: 0,
      transaction_datetime: new Date(),
      description: "",
      category_id: "",
      account_id: "",
      details: {
        payment_medium: "",
        location: "",
        note: "",
        payment_status: "completed",
      },
    },
  });

  const [{ data: accounts, isLoading: loadingAct }, { data: categories, isLoading: loadingCtg }] = useQueries({
    queries: [
      {
        queryKey: ["accounts"],
        queryFn: adaptiveAccountService.getAccounts,
      },
      {
        queryKey: ["categories"],
        queryFn: adaptiveCategoryService.getCategories,
      },
    ],
  });


  const transfertCatID = categories?.find((cat) => cat.name === "Transfers")?.id;

  const handleSubmit = useCallback(
    (values: RecordCreateSchema) => {
      onSubmit(values);
      form.reset();
    },
    [onSubmit, form]
  );

  const handleTabChange = useCallback(
    (value: string) => {
      setTransactionType(value as "expense" | "income" | "transfer");
      form.reset(
        value === "transfer"
          ? {
            type: "transfer",
            amount: 0,
            transaction_datetime: new Date(),
            description: "",
            category_id: transfertCatID,
            account_id: "",
            destination_account_id: "", // Required for transfers
            details: {
              payment_medium: "",
              location: "",
              note: "",
              payment_status: "completed",
            },
          }
          : {
            type: value as "expense" | "income",
            amount: 0,
            transaction_datetime: new Date(),
            description: "",
            category_id: "",
            account_id: "",
            details: {
              payment_medium: "",
              location: "",
              note: "",
              payment_status: "completed",
            },
          }
      );
    },
    [form, transfertCatID]
  );



  return (
    <Tabs value={transactionType} onValueChange={(v) => handleTabChange(v)} >
      <TabsList className="grid w-full grid-cols-3 px-4 md:px-1">
        <TabsTrigger value="expense" className="flex items-center gap-2">
          <ArrowDownLeft className="h-4 w-4" />
          Expense
        </TabsTrigger>
        <TabsTrigger value="income" className="flex items-center gap-2">
          <ArrowUpRight className="h-4 w-4" />
          Income
        </TabsTrigger>
        <TabsTrigger value="transfer" className="flex items-center gap-2">
          <ArrowLeftRight className="h-4 w-4" />
          Transfer
        </TabsTrigger>
      </TabsList>

      <TabsContent value="expense">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 p-4 md:p-0">
            <FormField
              control={form.control}
              name="account_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>From Account</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} disabled={loadingAct}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select account" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {accounts?.map((account) => (
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
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" min={0} placeholder="0.00" {...field} onChange={(e) => field.onChange(parseFloat(e.target.value))} />
                  </FormControl>
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
                  <Select onValueChange={field.onChange} defaultValue={field.value} disabled={loadingCtg}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories?.map((category) => (
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

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Input placeholder="What was this expense for?" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="transaction_datetime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date</FormLabel>
                  <FormControl>
                    <DatetimePicker  {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full">
              Create Expense
            </Button>
          </form>
        </Form>
      </TabsContent>

      {/* Income Form */}
      <TabsContent value="income">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 p-4 md:p-0">
            <FormField
              control={form.control}
              name="account_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>To Account</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select account" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {accounts?.map((account) => (
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
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" min={0} placeholder="0.00" {...field} onChange={(e) => field.onChange(parseFloat(e.target.value))} />
                  </FormControl>
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
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories?.map((category) => (
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

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Input placeholder="Source of income" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="transaction_datetime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date</FormLabel>
                  <FormControl>
                    <DatetimePicker  {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full">
              Create Income
            </Button>
          </form>
        </Form>
      </TabsContent>

      {/* Transfer Form */}
      <TabsContent value="transfer">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 p-4 md:p-0">
            <FormField
              control={form.control}
              name="account_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>From Account</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select account" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {accounts?.map((account) => (
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
              name="destination_account_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>To Account</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select account" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {accounts
                        ?.filter((account) => account.id !== form.watch("account_id"))
                        .map((account) => (
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
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" min={0} placeholder="0.00" {...field} onChange={(e) => field.onChange(parseFloat(e.target.value))} />
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
                    <Input placeholder="Reason for transfer" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="transaction_datetime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date</FormLabel>
                  <FormControl>
                    <DatetimePicker  {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full">
              Create Transfer
            </Button>
          </form>
        </Form>
      </TabsContent>
    </Tabs>
  );
}
