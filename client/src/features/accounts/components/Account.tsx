import { useForm } from "react-hook-form";
import React, { useState, useCallback } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/core/components/ui/card";
import { Button } from "@/core/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/core/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/core/components/ui/select";
import { Input } from "@/core/components/ui/input";
import { accountService } from "@/features/accounts/services/account";
import { accountFormSchema, AccountSchema, AccountSubmit } from "./Account.type";
import { Plus } from "lucide-react";
import { ResponsiveDialog, ResponsiveDialogTrigger, ResponsiveDialogContent, ResponsiveDialogHeader, ResponsiveDialogTitle, ResponsiveDialogDescription } from "@/core/components/ui/dialog-sheet";
import { Account } from "@/features/accounts/services/account.types";

export function AccountList({ onSubmit }: { onSubmit: AccountSubmit }) {
  const {
    data: accounts,
    error,
    isFetching,
  } = useSuspenseQuery({
    queryKey: ["accounts"],
    queryFn: accountService.getAccounts,
  });

  if (error && !isFetching) {
    throw error;
  }

  return (
    <div className="w-full flex-1 overflow-hidden">

      <div className="no-scrollbar flex gap-4 overflow-x-auto pb-4 md:grid md:grid-cols-2 md:overflow-x-hidden lg:grid-cols-5">
        {accounts?.map((account) => <AccountCard key={account.id} account={account} />)}
        <AccountDialog onSubmit={onSubmit} />
      </div>
    </div>
  );
}

export const AccountCard = React.memo(({ account }: { account: Account }) => {
  return (
    <Card key={account.id} className="min-w-[280px] flex-shrink-0 md:w-auto md:min-w-0">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{account.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${account.balance < 0 ? "text-red-500" : ""}`}>${Math.abs(account.balance).toLocaleString()}</div>
      </CardContent>
    </Card>
  );
});

export function AccountDialog({ onSubmit }: { onSubmit: AccountSubmit }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <ResponsiveDialog open={isOpen} onOpenChange={setIsOpen}>
      <ResponsiveDialogTrigger>
        <Card className="min-w-[280px] border-dotted hover:border-gray-800 md:min-w-0">
          <CardContent className="p-0">
            <div className="flex h-25 w-full items-center justify-center text-gray-400 hover:text-gray-800">
              <div className="flex items-center justify-center gap-2">
                <Plus className="size-3" />
                <span>Create Account</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </ResponsiveDialogTrigger>
      <ResponsiveDialogContent>
        <ResponsiveDialogHeader className="px-4 md:p-0">
          <ResponsiveDialogTitle>Create New Account</ResponsiveDialogTitle>
        </ResponsiveDialogHeader>
        <ResponsiveDialogDescription className="hidden">Add a new account to the app</ResponsiveDialogDescription>
        <AccountForm onSubmit={onSubmit} modalChange={setIsOpen} />
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}

export function AccountForm({ onSubmit, modalChange }: { onSubmit: AccountSubmit; modalChange: (open: boolean) => void }) {
  const form = useForm<AccountSchema>({
    resolver: zodResolver(accountFormSchema),
    defaultValues: {
      name: "",
      type: "cash",
      currency: "USD",
      color: "blue",
      balance: 0,
    },
  });

  const handleSubmit = useCallback(
    (values: AccountSchema) => {
      onSubmit(values);
      form.reset();
      modalChange(false);
    },
    [onSubmit, form, modalChange]
  );

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 p-4 md:p-0">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Account Name</FormLabel>
              <FormControl>
                <Input {...field} />
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
              <FormLabel>Account Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select account type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="savings">Savings</SelectItem>
                  <SelectItem value="investment">Investment</SelectItem>
                  <SelectItem value="credit">Credit</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="currency"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Currency</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="GBP">GBP</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="color"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Color</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select color" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="red" className="flex items-center gap-2">
                    <div className="h-4 w-4 rounded-full bg-red-500" />
                    Red
                  </SelectItem>
                  <SelectItem value="green" className="flex items-center gap-2">
                    <div className="h-4 w-4 rounded-full bg-green-500" />
                    Green
                  </SelectItem>
                  <SelectItem value="blue" className="flex items-center gap-2">
                    <div className="h-4 w-4 rounded-full bg-blue-500" />
                    Blue
                  </SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="balance"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Initial Balance</FormLabel>
              <FormControl>
                <Input type="number" {...field} onChange={(e) => field.onChange(Number.parseFloat(e.target.value))} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full">
          Create Account
        </Button>
      </form>
    </Form>
  );
}
