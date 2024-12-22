import { useForm } from "react-hook-form";
import { useState } from "react";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/core/components/ui/card";
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
import { Input } from "@/core/components/ui/input";

import { accountService } from "@/features/accounts/services/account";

export const Route = createFileRoute("/dashboard/accounts")({
  component: RouteComponent,
});

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  balance: z.number().min(0, "Balance must be positive"),
  currency: z.string().min(1, "Currency is required"),
  color: z.enum(["red", "green", "blue"], {
    required_error: "Please select a color",
  }),
  type: z.enum(["cash", "savings", "investment", "credit"]),
});

function RouteComponent() {
  const [isOpen, setIsOpen] = useState(false);
  const queryClient = useQueryClient();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      type: "cash",
      currency: "USD",
      color: "blue",
      balance: 0,
    },
  });

  const { data: accounts, isLoading } = useQuery({
    queryKey: ["accounts"],
    queryFn: accountService.getAccounts,
  });

  const createMutation = useMutation({
    mutationFn: accountService.createAccount,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      setIsOpen(false);
      form.reset();
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    createMutation.mutate(values);
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Accounts</h2>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button>Add Account</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Account</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
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
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
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
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
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
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select color" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem
                            value="red"
                            className="flex items-center gap-2"
                          >
                            <div className="h-4 w-4 rounded-full bg-red-500" />
                            Red
                          </SelectItem>
                          <SelectItem
                            value="green"
                            className="flex items-center gap-2"
                          >
                            <div className="h-4 w-4 rounded-full bg-green-500" />
                            Green
                          </SelectItem>
                          <SelectItem
                            value="blue"
                            className="flex items-center gap-2"
                          >
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
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) =>
                            field.onChange(Number.parseFloat(e.target.value))
                          }
                        />
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
          </DialogContent>
        </Dialog>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {accounts?.map((account) => (
          <Card key={account.id}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {account.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className={`text-2xl font-bold ${account.balance < 0 ? "text-red-500" : ""}`}
              >
                ${Math.abs(account.balance).toLocaleString()}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
