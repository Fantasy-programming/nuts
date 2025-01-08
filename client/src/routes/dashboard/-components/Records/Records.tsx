import { useForm } from "react-hook-form";
import { useState } from "react";
import { useQueries, useSuspenseQuery } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/core/components/ui/table";
import { DateTimePicker } from '@/core/components/ui/datetime';

import { Button } from "@/core/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/core/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/core/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/core/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/core/components/ui/tabs";
import { Input } from "@/core/components/ui/input";
import { accountService } from "@/features/accounts/services/account";
import { getTransactions } from "@/features/transactions/services/transaction";
import { RecordsSubmit, RecordSchema, recordCreateSchema } from "@/features/transactions/services/transaction.types";
import { categoryService } from "@/features/categories/services/category";
import { Textarea } from "@/core/components/ui/textarea";
import { ChevronDown } from "lucide-react";

export function RecordsTable() {
  const { data: transactions, error, isFetching } = useSuspenseQuery({
    queryKey: ["transactions"],
    queryFn: getTransactions,
  });

  if (error && !isFetching) {
    throw error
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Date</TableHead>
          <TableHead>Description</TableHead>
          <TableHead>Category</TableHead>
          <TableHead className="text-right">Amount</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {transactions?.map((transaction) => (
          <TableRow key={transaction.id}>
            <TableCell>{transaction.transaction_datetime.toUTCString()}</TableCell>
            <TableCell>{transaction.description}</TableCell>
            <TableCell>{transaction.category_id}</TableCell>
            <TableCell
              className={`text-right ${transaction.amount < 0 ? "text-red-500" : "text-green-500"}`}
            >
              ${Math.abs(transaction.amount).toFixed(2)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

export function RecordsDialog({ onSubmit }: { onSubmit: RecordsSubmit }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>Add Transaction</Button>
      </DialogTrigger>
      <DialogContent className="max-w-[900px]">
        <DialogHeader>
          <DialogTitle>Create New Transaction</DialogTitle>
        </DialogHeader>
        <RecordsForm onSubmit={onSubmit} modalChange={setIsOpen} />
      </DialogContent>
    </Dialog>
  );
}


export function RecordsForm({ onSubmit, modalChange }: { onSubmit: RecordsSubmit, modalChange: (open: boolean) => void }) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [transactionType, setTransactionType] = useState<
    "expense" | "income" | "transfer"
  >("expense");

  const form = useForm<RecordSchema>({
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
      }
    },
  });

  const [{ data: accounts, isLoading: loadingAct }, { data: categories, isLoading: loadingCtg }] = useQueries({
    queries: [
      {
        queryKey: ["accounts"],
        queryFn: accountService.getAccounts,
      }, {

        queryKey: ["categories"],
        queryFn: categoryService.getCategories,
      }

    ]
  });


  function onsubmit(values: RecordSchema) {
    onSubmit(values)
    form.reset()
    modalChange(false)
  }

  return (
    <Tabs
      value={transactionType}
      onValueChange={(v) =>
        setTransactionType(v as "expense" | "income" | "transfer")
      }
    >
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="expense">Expense</TabsTrigger>
        <TabsTrigger value="income">Income</TabsTrigger>
        <TabsTrigger value="transfer">Transfer</TabsTrigger>
      </TabsList>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onsubmit)} className="mt-4">
          <div className="grid grid-cols-[2fr,1fr] gap-6">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) =>
                            field.onChange(
                              Number.parseFloat(e.target.value),
                            )
                          }
                        />
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
                      <FormLabel>Account</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select account" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {accounts?.map((account) => (
                            <SelectItem
                              key={account.id}
                              value={account.id}
                            >
                              {account.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

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

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Input {...field} />
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
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories?.map((category) => (
                          <SelectItem
                            key={category.id}
                            value={category.id}
                          >
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {transactionType === "transfer" && (
                <FormField
                  control={form.control}
                  name="destinationAccountId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Destination Account</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select destination account" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {accounts?.map((account) => (
                            <SelectItem
                              key={account.id}
                              value={account.id}
                            >
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
            </div>

            {/* Advanced Options Section */}
            <div>
              <Button
                type="button"
                variant="ghost"
                className="flex w-full items-center justify-between mb-4"
                onClick={() => setShowAdvanced(!showAdvanced)}
              >
                Advanced Options
                <ChevronDown
                  className={`h-4 w-4 transform transition-transform ${showAdvanced ? "rotate-180" : ""}`}
                />
              </Button>

              <div
                className={`border-l pl-6 space-y-4 transition-all ${showAdvanced ? "opacity-100" : "opacity-0 hidden"}`}
              >
                {/* Advanced fields only render when showAdvanced is true */}
                {showAdvanced && (
                  <>
                    <FormField
                      control={form.control}
                      name="details.payment_medium"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Payment Medium</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select payment medium" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="cash">Cash</SelectItem>
                              <SelectItem value="card">Card</SelectItem>
                              <SelectItem value="bank">
                                Bank Transfer
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="details.location"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Location</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="details.payment_status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Payment Status</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select status" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="completed">
                                Completed
                              </SelectItem>
                              <SelectItem value="pending">
                                Pending
                              </SelectItem>
                              <SelectItem value="failed">
                                Failed
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="details.note"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Note</FormLabel>
                          <FormControl>
                            <Textarea {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="mt-6">
            <Button type="submit" className="w-full">
              Create Transaction
            </Button>
          </div>
        </form>
      </Form>
    </Tabs>
  );
}
