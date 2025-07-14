import { useState, useId, useCallback, useMemo, useRef, useEffect } from "react"
import { useForm } from "react-hook-form";
import { useQuery } from "@tanstack/react-query"
import { accountFormSchema, AccountSubmit, AccountFormSchema } from "../services/account.types"
import { zodResolver } from "@hookform/resolvers/zod";
import { metaService } from "@/features/preferences/services/meta"
import { accountService } from "@/features/accounts/services/account";
import { accountTypeOptions } from "./account.constants";
import getSymbolFromCurrency from "currency-symbol-map"

import { ResponsiveDialog, ResponsiveDialogContent, ResponsiveDialogTrigger, ResponsiveDialogHeader, ResponsiveDialogTitle, ResponsiveDialogFooter } from "@/core/components/ui/dialog-sheet";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/core/components/ui/form";
import { ScrollArea } from "@/core/components/ui/scroll-area";
import { SearchableSelect, SearchableSelectOption } from "@/core/components/ui/search-select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/core/components/ui/tabs"
import { Button } from "@/core/components/ui/button"
import { Input } from "@/core/components/ui/input"

import { useTellerConnect } from 'teller-connect-react';
// import { usePlaidLink } from 'react-plaid-link';
import { useMono } from "../hooks/useMono"
import { config } from "@/lib/env"

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
  const [modalOpen, setModalOpen] = useState(false)
  const [balanceInputPaddingLeft, setBalanceInputPaddingLeft] = useState<string | number>("2.5rem"); // Default to pl-10 (2.5rem)
  const currencyPrefixRef = useRef<HTMLSpanElement>(null);

  const { open, ready } = useTellerConnect({
    applicationId: config.VITE_TELLER_APP_ID,
    environment: "sandbox",
    onSuccess: (authorization) => {
      accountService.linkTellerAccount(authorization)
      onClose?.()
    },
  });

  // const { open: openPlaid, ready: plaidReady } = usePlaidLink({
  //   token: config.VITE_PLAID_TOKEN,
  //   onSuccess: (public_token, metadata) => {
  //     console.log(public_token, metadata)
  //   },
  // });

  //todo: Mono takes fields like name and email in the data: customer object field
  const { openMono, context, isMonoReady } = useMono({
    key: config.VITE_MONO_PUBLIC_KEY,
    onSuccess: (payload) => {
      accountService.linkMonoAccount({
        code: payload.code,
        institution: context.institution.name,
        institutionID: context.institution.id
      })
      onClose?.()
    },
  });

  const formId = useId();
  const typeFieldId = useId();
  const currencyFieldId = useId();


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


  const onSubmit = useCallback(
    (values: AccountFormSchema) => {
      onAddAccount(values);
      form.reset();
      setModalOpen(false)
    },
    [onAddAccount, form]
  );

  return (
    <ResponsiveDialog open={modalOpen} onOpenChange={(open) => {
      if (!modalOpen) {
        onClose?.()
      }
      setModalOpen(open)
    }}>
      <ResponsiveDialogTrigger asChild>
        {children}
      </ResponsiveDialogTrigger>
      <ResponsiveDialogContent className="sm:max-w-[500px] no-scrollbar">
        <ScrollArea className="overflow-y-auto no-scrollbar">
          <ResponsiveDialogHeader>
            <ResponsiveDialogTitle className="text-center md:text-start mb-2">Add New Account</ResponsiveDialogTitle>
          </ResponsiveDialogHeader>
          <Tabs defaultValue="linked" value={activeTab} onValueChange={setActiveTab} className="mt-4 px-4 md:px-1">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="linked">Bank Linked</TabsTrigger>
              <TabsTrigger value="manual">Manual Account</TabsTrigger>
            </TabsList>

            <TabsContent value="linked" className="space-y-4 mt-4">
              <div className="flex flex-col gap-3">
                {/* <Button onClick={openPlaid} disabled={!plaidReady}>Open Plaid</Button> */}
                <Button onClick={open} disabled={!ready}>Open teller</Button>
                <Button onClick={openMono} disabled={!isMonoReady}>Open Mono</Button>
              </div>
            </TabsContent>
            <TabsContent value="manual" className="space-y-4 mt-4">
              <Form {...form}>
                <form id={formId} onSubmit={form.handleSubmit(onSubmit)}>
                  <div className="grid gap-6">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem className="group relative">
                          <FormLabel className="bg-card text-foreground/80 absolute start-1 top-0 z-10 block -translate-y-1/2 px-2 text-xs font-medium group-has-disabled:opacity-50">Account Name</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Example account name" className="text-md placeholder:text-sm placeholder:text-foreground/50 shadow-card h-11" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="type"
                      render={({ field }) => (
                        <FormItem className="group relative">
                          <FormLabel htmlFor={typeFieldId} className="bg-card group-has-disabled:opacity-50bg-background text-foreground absolute start-1 top-0 z-10 block -translate-y-1/2 px-2 text-xs font-medium group-has-disabled:opacity-50">Account Type</FormLabel>
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
                        <FormItem className="group relative">
                          <FormLabel className="bg-card text-foreground/80 absolute start-1 top-0 z-10 block -translate-y-1/2 px-2 text-xs font-medium group-has-disabled:opacity-50">Current Balance</FormLabel>
                          <FormControl className=" relative">
                            <div>
                              <span
                                ref={currencyPrefixRef}
                                className="
                              pointer-events-none  flex items-center justify-center   peer-disabled:opacity-50
                              absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground
                              ">
                                {balancePrefix}
                              </span>

                              <Input type="number" step="1" style={{ paddingLeft: balanceInputPaddingLeft }} {...field} placeholder="0.00" className="text-md peer placeholder:text-sm shadow-card"
                                value={field.value === undefined || field.value === null || isNaN(Number(field.value)) ? "" : Number(field.value)}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  field.onChange(val === "" ? null : Number.parseFloat(val));
                                }}
                              /></div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="currency"
                      render={({ field }) => (
                        <FormItem className="group relative">
                          <FormLabel htmlFor={currencyFieldId} className="bg-background   group-has-disabled:opacity-50bg-background text-foreground absolute start-1 top-0 z-10 block -translate-y-1/2 px-2 text-xs font-medium group-has-disabled:opacity-50">Currency</FormLabel>
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

                  </div>
                  <button type="submit" style={{ display: "none" }} aria-hidden="true"></button>
                </form>
              </Form>
            </TabsContent>
          </Tabs>

          {activeTab === "manual" && (
            <ResponsiveDialogFooter>
              <Button
                className="w-full mt-4 px-2"
                type="submit"
                form={formId}
                onClick={async () => {
                  console.log(form.formState.errors)
                }}
              >
                Add Account
              </Button>
            </ResponsiveDialogFooter>
          )}
        </ScrollArea>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}
