import { useCallback } from "react"
import { Building, CreditCard, PiggyBank, Wallet, TrendingUp } from "lucide-react"

import { Button } from "@/core/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/core/components/ui/dialog"
import { Input } from "@/core/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/core/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/core/components/ui/avatar"
import { AccountWTrend, accountFormSchema, AccountFormSchema } from "../services/account.types"
import { AccountUpdate } from "../services/account.types"
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/core/components/ui/form";

export default function EditAccountModal({
  isOpen,
  onClose,
  account,
  onUpdateAccount,
}: {
  isOpen: boolean
  onClose: () => void
  account: AccountWTrend
  onUpdateAccount: AccountUpdate
}) {

  const form = useForm<AccountFormSchema>({
    resolver: zodResolver(accountFormSchema),
    defaultValues: {
      name: account.name,
      type: account.type,
      currency: account.currency,
      color: account.color,
      balance: account.balance,
      meta: account.meta,
    },
  });

  const handleSubmit = useCallback(
    (values: AccountFormSchema) => {
      if (account?.id) {
        onUpdateAccount(account.id, values);
      }
      form.reset();
      onClose()
    },
    [onUpdateAccount, form, onClose, account?.id]
  );

  const isLinkedAccount = !!account?.meta?.institution
  if (!account) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Account</DialogTitle>
          <DialogDescription>Update your account information and settings.</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 mt-4" id="updateAccount">
            {isLinkedAccount && (
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <Avatar className="h-10 w-10 rounded-md">
                  <AvatarImage src={account?.meta?.logo} alt={account?.meta?.institution} />
                  <AvatarFallback className="rounded-md bg-primary/10 text-primary">
                    {account?.meta?.institution?.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium">{account?.meta?.institution}</div>
                  <div className="text-sm text-muted-foreground">Bank-linked account</div>
                </div>
              </div>
            )}

            <div className="grid gap-4">
              <div className="grid gap-2">

                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Account Name</FormLabel>
                      <FormControl>
                        <Input disabled={isLinkedAccount} {...field} defaultValue={field.value} />
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
                      <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLinkedAccount}>
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
                        <>
                          <div className="relative">
                            <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
                            <Input type="number"
                              disabled={isLinkedAccount}
                              step="0.01"
                              min="0"
                              placeholder="0.00"
                              className="pl-8"
                              {...field} onChange={(e) => field.onChange(Number.parseFloat(e.target.value))} />
                          </div>

                          {isLinkedAccount && (
                            <p className="text-xs text-muted-foreground mt-1">Balance is automatically updated from your bank.</p>
                          )}</>
                      </FormControl>
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
            </div>
          </form>
        </Form>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="updateAccount" disabled={form.formState.isSubmitting}>
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

