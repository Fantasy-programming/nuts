import { useState, useCallback } from "react"
import { Building, CreditCard, PiggyBank, Wallet, TrendingUp } from "lucide-react"

import { Button } from "@/core/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/core/components/ui/tabs"
import { Input } from "@/core/components/ui/input"
import { accountFormSchema, AccountSubmit, AccountFormSchema } from "../services/account.types"
import { ResponsiveDialog, ResponsiveDialogContent, ResponsiveDialogHeader, ResponsiveDialogTitle, ResponsiveDialogDescription, ResponsiveDialogFooter } from "@/core/components/ui/dialog-sheet";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/core/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/core/components/ui/select";


export default function AddAccountModal({
  isOpen,
  onClose,
  onAddAccount,
}: {
  isOpen: boolean
  onClose: () => void
  onAddAccount: AccountSubmit
}) {
  const [activeTab, setActiveTab] = useState("linked")

  const form = useForm<AccountFormSchema>({
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
    (values: AccountFormSchema) => {
      onAddAccount(values);
      form.reset();
      onClose()
    },
    [onAddAccount, form, onClose]
  );


  return (
    <ResponsiveDialog open={isOpen} onOpenChange={onClose}>
      <ResponsiveDialogContent className="sm:max-w-[500px]">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>Add New Account</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>Connect to your bank or add a manual account to track your finances.</ResponsiveDialogDescription>
        </ResponsiveDialogHeader>

        <Tabs defaultValue="linked" value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="linked">Bank Linked</TabsTrigger>
            <TabsTrigger value="manual">Manual Account</TabsTrigger>
          </TabsList>

          <TabsContent value="linked" className="space-y-4 mt-4">
            <div className="flex">
              Coming soon.....
            </div>
          </TabsContent>
          <TabsContent value="manual" className="space-y-4 mt-4">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)}>
                <div className="grid gap-4">
                  <div className="grid gap-2">
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
                  </div>

                  <div className="grid gap-2">

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
                              <SelectItem value="credit">Credit</SelectItem>
                              <SelectItem value="checking">
                                <div className="flex items-center gap-2">
                                  <Building className="h-4 w-4 text-blue-500" />
                                  <span>Checking</span>
                                </div>
                              </SelectItem>
                              <SelectItem value="savings">
                                <div className="flex items-center gap-2">
                                  <PiggyBank className="h-4 w-4 text-emerald-500" />
                                  <span>Savings</span>
                                </div>
                              </SelectItem>
                              <SelectItem value="investment">
                                <div className="flex items-center gap-2">
                                  <TrendingUp className="h-4 w-4 text-purple-500" />
                                  <span>Investment</span>
                                </div>
                              </SelectItem>
                              <SelectItem value="cash">
                                <div className="flex items-center gap-2">
                                  <Wallet className="h-4 w-4 text-amber-500" />
                                  <span>Cash</span>
                                </div>
                              </SelectItem>
                              <SelectItem value="other">
                                <div className="flex items-center gap-2">
                                  <CreditCard className="h-4 w-4 text-slate-500" />
                                  <span>Other</span>
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid gap-2">

                    <FormField
                      control={form.control}
                      name="balance"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Current Balance</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
                              <Input type="number"

                                step="0.01"
                                min="0"
                                placeholder="0.00"
                                className="pl-8"
                                {...field} onChange={(e) => field.onChange(Number.parseFloat(e.target.value))} />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid gap-2">
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
                  </div>
                  <div className="grid gap-2">

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
                  </div>

                  <Button
                    type="submit" > Submit test </Button>

                </div>
              </form>
            </Form>
          </TabsContent>
        </Tabs>

        <ResponsiveDialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            onClick={() => {
              console.log(form.formState.isValid)
              console.log(form.formState.errors)
              form.handleSubmit(handleSubmit)
            }}
          >
            Add Account
          </Button>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}
