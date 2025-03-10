import { useForm } from "react-hook-form";
import { useState, useCallback } from "react";
import { useQueries } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { DateTimePicker } from "@/core/components/ui/datetime";

import { Label } from "@/core/components/ui/label";
import { Button } from "@/core/components/ui/button";
import { Root } from "@radix-ui/react-visually-hidden";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  InnerDialog,
  InnerDialogContent,
  InnerDialogHeader,
  InnerDialogTitle,
  InnerDialogTrigger,
} from "@/core/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/core/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/core/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/core/components/ui/tabs";
import { Input } from "@/core/components/ui/input";
import { accountService } from "@/features/accounts/services/account";
import { RecordsSubmit, RecordCreateSchema, recordCreateSchema } from "@/features/transactions/services/transaction.types";
import { categoryService } from "@/features/categories/services/category";
import { Textarea } from "@/core/components/ui/textarea";
import { ArrowUpRight, ArrowDownLeft, ArrowLeftRight, Sparkles, Pencil } from "lucide-react";

//TODO: Fix and make everything works

interface DialogProps extends React.PropsWithChildren {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: RecordsSubmit;
}

export function RecordsDialog({ onSubmit, children, open, onOpenChange }: DialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Transaction</DialogTitle>
          <Root>
            <DialogDescription>Record a new transaction</DialogDescription>
          </Root>
        </DialogHeader>
        <RecordsForm onSubmit={onSubmit} modalChange={onOpenChange} />
      </DialogContent>
    </Dialog>
  );
}

interface ParsedTransaction {
  type: "expense" | "income";
  description: string;
  amount: number;
  category: string;
  date: string;
}

export function RecordsForm({ onSubmit, modalChange }: { onSubmit: RecordsSubmit; modalChange: (open: boolean) => void }) {
  const [transactionType, setTransactionType] = useState<"expense" | "income" | "transfer">("expense");
  const [naturalInput, setNaturalInput] = useState("");
  const [parsedTransactions, setParsedTransactions] = useState<ParsedTransaction[]>([]);
  const [editingTransaction, setEditingTransaction] = useState<ParsedTransaction | null>(null);

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
        queryFn: accountService.getAccounts,
      },
      {
        queryKey: ["categories"],
        queryFn: categoryService.getCategories,
      },
    ],
  });


  const transfertCatID = categories?.find((cat) => cat.name === "Transfers")?.id;

  const handleSubmit = useCallback(
    (values: RecordCreateSchema) => {
      onSubmit(values);
      modalChange(false);
      form.reset();
    },
    [onSubmit, modalChange, form]
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

  const handleNaturalInput = useCallback(() => {
    // This is where you'd integrate with a natural language processing service
    // For now, we'll just demonstrate the UI with some mock parsed transactions
    const mockParsed: ParsedTransaction[] = [
      {
        type: "expense",
        description: "Grocery shopping at Walmart",
        amount: 120.5,
        category: "Food",
        date: new Date().toISOString(),
      },
      {
        type: "expense",
        description: "Gas station fill up",
        amount: 45.0,
        category: "Transportation",
        date: new Date().toISOString(),
      },
    ];
    setParsedTransactions(mockParsed);
  }, []);

  const handleUpdateParsedTransaction = (updatedTransaction: ParsedTransaction) => {
    setParsedTransactions((current) => current.map((t) => (t.description === editingTransaction?.description ? updatedTransaction : t)));
    setEditingTransaction(null);
  };

  return (
    <Tabs value={transactionType} onValueChange={(v) => handleTabChange(v)}>
      <TabsList className="grid w-full grid-cols-4">
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
        <TabsTrigger value="natural" className="flex items-center gap-2">
          <Sparkles className="h-4 w-4" />
          Natural
        </TabsTrigger>
      </TabsList>

      <TabsContent value="expense">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
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
                    <DateTimePicker hourCycle={12} {...field} />
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
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
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
                    <DateTimePicker hourCycle={12} {...field} />
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
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
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
                    <DateTimePicker hourCycle={12} {...field} />
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

      {/* Natural Language Input */}
      <TabsContent value="natural">
        <div className="space-y-6">
          <div className="space-y-2">
            <Label>Enter your transactions naturally</Label>
            <Textarea
              placeholder="Example: Spent $45 on gas yesterday, bought groceries at Walmart for $120.50 today"
              className="min-h-[100px]"
              value={naturalInput}
              onChange={(e) => setNaturalInput(e.target.value)}
            />
            <p className="text-muted-foreground text-sm">Enter multiple transactions in plain English. We'll parse them for you.</p>
          </div>

          <Button onClick={handleNaturalInput} className="w-full" disabled={!naturalInput.trim()}>
            <Sparkles className="mr-2 h-4 w-4" />
            Parse Transactions
          </Button>

          {parsedTransactions.length > 0 && (
            <div className="space-y-4">
              <h4 className="font-medium">Parsed Transactions</h4>
              <div className="space-y-2">
                <InnerDialog>
                  {parsedTransactions.map((transaction, index) => (
                    <div key={index} className="flex items-center justify-between rounded-lg border p-3">
                      <div>
                        <p className="font-medium">{transaction.description}</p>
                        <p className="text-muted-foreground text-sm">
                          {transaction.category} • {new Date(transaction.date).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-red-500">-${transaction.amount.toFixed(2)}</p>
                        <InnerDialogTrigger asChild>
                          <Button variant="ghost" size="icon" onClick={() => setEditingTransaction(transaction)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </InnerDialogTrigger>
                      </div>
                    </div>
                  ))}

                  <InnerDialogContent>
                    {editingTransaction && (
                      <>
                        <InnerDialogHeader>
                          <InnerDialogTitle>Edit Transaction</InnerDialogTitle>
                        </InnerDialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label>Description</Label>
                            <Input
                              value={editingTransaction.description}
                              onChange={(e) =>
                                setEditingTransaction({
                                  ...editingTransaction,
                                  description: e.target.value,
                                })
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Amount</Label>
                            <Input
                              type="number"
                              step="0.01"
                              value={editingTransaction.amount}
                              onChange={(e) =>
                                setEditingTransaction({
                                  ...editingTransaction,
                                  amount: parseFloat(e.target.value),
                                })
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Category</Label>
                            <Select
                              value={editingTransaction.category}
                              onValueChange={(value) =>
                                setEditingTransaction({
                                  ...editingTransaction,
                                  category: value,
                                })
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Food">Food</SelectItem>
                                <SelectItem value="Transportation">Transportation</SelectItem>
                                <SelectItem value="Utilities">Utilities</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Date</Label>
                            <Input
                              type="date"
                              value={new Date(editingTransaction.date).toISOString().split("T")[0]}
                              onChange={(e) =>
                                setEditingTransaction({
                                  ...editingTransaction,
                                  date: new Date(e.target.value).toISOString(),
                                })
                              }
                            />
                          </div>
                          <Button className="w-full" onClick={() => handleUpdateParsedTransaction(editingTransaction)}>
                            Update Transaction
                          </Button>
                        </div>
                      </>
                    )}
                  </InnerDialogContent>
                </InnerDialog>
              </div>
              <Button className="w-full">Create All Transactions</Button>
            </div>
          )}
        </div>
      </TabsContent>
    </Tabs>
  );
}
