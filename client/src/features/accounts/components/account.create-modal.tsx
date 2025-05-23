import { useState, useId, useCallback, useMemo, useRef, useEffect } from "react"
import { useForm } from "react-hook-form";
import { useQuery } from "@tanstack/react-query"
import { accountFormSchema, AccountSubmit, AccountFormSchema } from "../services/account.types"
import { zodResolver } from "@hookform/resolvers/zod";
import { metaService } from "@/features/preferences/services/meta"
import { accountTypeOptions } from "./account.constants";
import getSymbolFromCurrency from "currency-symbol-map"

import { ResponsiveDialog, ResponsiveDialogContent, ResponsiveDialogTrigger, ResponsiveDialogHeader, ResponsiveDialogTitle, ResponsiveDialogDescription, ResponsiveDialogFooter, ResponsiveDialogClose } from "@/core/components/ui/dialog-sheet";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/core/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/core/components/ui/select";
import { SearchableSelect, SearchableSelectOption } from "@/core/components/ui/search-select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/core/components/ui/tabs"
import { Button } from "@/core/components/ui/button"
import { Input } from "@/core/components/ui/input"



export function AddAccountModal({
  children,
  onClose,
  onAddAccount,
}: {
  children: React.ReactNode
  onClose?: () => void
  onAddAccount: AccountSubmit
}) {
  const [activeTab, setActiveTab] = useState("manual")
  const [balanceInputPaddingLeft, setBalanceInputPaddingLeft] = useState<string | number>("2.5rem"); // Default to pl-10 (2.5rem)
  const currencyPrefixRef = useRef<HTMLSpanElement>(null);

  const formId = useId();
  const typeFieldId = useId();
  const currencyFieldId = useId();
  const colorFieldId = useId();


  // -- Data Fetches
  const {
    data: currenciesData,
    isLoading: isLoadingCurrencies,
    isError: isErrorCurrencies,
    error: currencyError,
  } = useQuery({
    queryKey: ["currencies"],
    queryFn: metaService.getCurrencies,
    staleTime: 5 * 60 * 1000,
    placeholderData: [],
  });

  const currencyOptionsForSelect: SearchableSelectOption[] = useMemo(() => {
    if (!currenciesData) return [];
    return currenciesData.map(currency => ({
      value: currency.code,
      label: `${currency.name} (${getSymbolFromCurrency(currency.code)})`,
      keywords: [currency.code, currency.name]
    }));
  }, [currenciesData]);


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

  const watchedCurrency = form.watch("currency");

  const currentCurrencyDetails = useMemo(() => {
    return currenciesData?.find(c => c.code === watchedCurrency);
  }, [currenciesData, watchedCurrency]);

  const balancePrefix = useMemo(() => {
    return getSymbolFromCurrency(currentCurrencyDetails?.code || "") || watchedCurrency || "$";
  }, [currentCurrencyDetails, watchedCurrency]);


  useEffect(() => {
    if (currencyPrefixRef.current) {
      const prefixWidth = currencyPrefixRef.current.offsetWidth;
      const newPadding = prefixWidth + 18; // prefix width + 12px buffer (0.75rem)
      setBalanceInputPaddingLeft(`${newPadding}px`);
    } else {
      const estimatedBasePadding = 8; // Base padding for the input itself
      const charWidthApproximation = 8; // Approx width per char
      const estimatedPrefixWidth = (balancePrefix?.length || 1) * charWidthApproximation;
      setBalanceInputPaddingLeft(`${estimatedPrefixWidth + estimatedBasePadding + 10}px`); // Add a small buffer
    }
  }, [balancePrefix]);


  const handleSubmit = useCallback(
    (values: AccountFormSchema) => {
      onAddAccount(values);
      form.reset();
      onClose?.()
    },
    [onAddAccount, form, onClose]
  );

  return (
    <ResponsiveDialog onOpenChange={(open) => !open && onClose?.()}>
      <ResponsiveDialogTrigger asChild>
        {children}
      </ResponsiveDialogTrigger>
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
              <form id={formId} onSubmit={form.handleSubmit(handleSubmit)}>
                <div className="grid gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Account Name</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g., Chase Checking, My Wallet" />
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
                        <FormLabel htmlFor={typeFieldId}>Account Type</FormLabel>
                        <FormControl>
                          <SearchableSelect
                            id={typeFieldId}
                            options={accountTypeOptions}
                            value={field.value}
                            onChange={field.onChange}
                            placeholder="Select account type"
                            searchPlaceholder="Search account type..."
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="balance"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Current Balance</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <span
                              ref={currencyPrefixRef}
                              className="
                              pointer-events-none  flex items-center justify-center   peer-disabled:opacity-50
                              absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground
                              ">
                              {balancePrefix}
                            </span>
                            <Input type="number"
                              step="0.01"
                              // min="0" // Allow negative balances for credit cards etc.
                              placeholder="0.00"
                              className="peer"
                              style={{ paddingLeft: balanceInputPaddingLeft }}
                              {...field}
                              value={field.value === undefined || field.value === null || isNaN(Number(field.value)) ? "" : Number(field.value)}
                              onChange={(e) => {
                                const val = e.target.value;
                                field.onChange(val === "" ? null : Number.parseFloat(val));
                              }}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="currency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel htmlFor={currencyFieldId}>Currency</FormLabel>
                        <FormControl>
                          {isErrorCurrencies ? (
                            <div className="flex items-center justify-start w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-destructive min-h-[40px]">
                              Error: Could not load currencies.
                              {currencyError?.message && <span className="ml-1">({currencyError.message})</span>}
                            </div>
                          ) : (
                            <SearchableSelect
                              id={currencyFieldId}
                              options={currencyOptionsForSelect}
                              value={field.value}
                              onChange={field.onChange}
                              placeholder="Select currency"
                              searchPlaceholder="Search currency..."
                              isLoading={isLoadingCurrencies} // Pass loading state from useQuery
                              loadingText="Loading currencies..."
                              emptyText="No currencies found." // Text if API returns empty or error
                            />
                          )}
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="color"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel htmlFor={colorFieldId}>Color Tag</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger id={colorFieldId}>
                              <SelectValue placeholder="Select color" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="red"><div className="flex items-center gap-2"><div className="h-3 w-3 rounded-full bg-red-500" />Red</div></SelectItem>
                            <SelectItem value="green"><div className="flex items-center gap-2"><div className="h-3 w-3 rounded-full bg-green-500" />Green</div></SelectItem>
                            <SelectItem value="blue"><div className="flex items-center gap-2"><div className="h-3 w-3 rounded-full bg-blue-500" />Blue</div></SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <button type="submit" style={{ display: "none" }} aria-hidden="true"></button>
              </form>
            </Form>
          </TabsContent>
        </Tabs>

        <ResponsiveDialogFooter>
          <ResponsiveDialogClose asChild>
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button></ResponsiveDialogClose>
          <Button
            type="submit"
            form={formId}
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
