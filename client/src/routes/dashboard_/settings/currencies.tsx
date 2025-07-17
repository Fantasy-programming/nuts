import { useState } from "react";
import { createFileRoute } from '@tanstack/react-router'
import { usePreferencesStore } from "@/features/preferences/stores/preferences.store";
import { preferencesService } from "@/features/preferences/services/preferences";
import { metaService } from "@/features/preferences/services/meta";
import getSymbolFromCurrency from "currency-symbol-map";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/core/components/ui/card";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/core/components/ui/command"
import {
  ComboBox,
  ComboBoxContent,
  ComboBoxTrigger,
} from "@/core/components/ui/combobox"
import { Label } from "@/core/components/ui/label";
import { Button } from "@/core/components/ui/button";
import { ChevronsUpDown } from "lucide-react";


export const Route = createFileRoute('/dashboard_/settings/currencies')({
  component: RouteComponent,
  loader: async ({ context }) => {
    const queryClient = context.queryClient;

    queryClient.prefetchQuery({
      queryKey: ["currencies"],
      queryFn: metaService.getCurrencies,
    });

  },
  gcTime: 1000 * 60 * 5,
  staleTime: 1000 * 60 * 2,
  pendingComponent: () => <div>Loading account data...</div>,
  pendingMs: 150,
  pendingMinMs: 200,
})

function RouteComponent() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const currency = usePreferencesStore((state) => state.currency)
  const [isCSelectorOpen, setIsCSelectorOpen] = useState(false);

  const {
    data: currencies
  } = useSuspenseQuery({
    queryKey: ["currencies"],
    queryFn: metaService.getCurrencies,
  });

  const updatePreferences = useMutation({
    mutationFn: preferencesService.updatePreferences,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['preferences'] });

    },
  });


  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('currency.defaultCurrency')}</CardTitle>
        <CardDescription>{t('currency.defaultCurrencyDescription')}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6">

        <div className="grid gap-2">
          <Label>{t('common.currency')}</Label>
          <ComboBox open={isCSelectorOpen} onOpenChange={setIsCSelectorOpen}>
            <ComboBoxTrigger>
              <Button variant="outline" role="combobox"
                aria-expanded={isCSelectorOpen} className="justify-between">
                {currency ? <>{currencies.find((c => c.code === currency))?.name} ({getSymbolFromCurrency(currency)})</> : <>{t('currency.selectCurrency')}</>}
                <ChevronsUpDown className="opacity-50" />
              </Button>
            </ComboBoxTrigger>
            <ComboBoxContent>
              <Command>
                <CommandInput placeholder={t('common.search')} />
                <CommandList>
                  <CommandEmpty>{t('common.noResults')}</CommandEmpty>
                  <CommandGroup>
                    {currencies.map((currency) => (
                      <CommandItem
                        key={currency.code}
                        value={currency.code}
                        keywords={[currency.code, currency.name]}
                        onSelect={(value) => {
                          updatePreferences.mutate({ currency: value })
                          setIsCSelectorOpen(false)
                        }}
                      >
                        {currency.name} ({getSymbolFromCurrency(currency.code)})
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </ComboBoxContent>
          </ComboBox>
        </div>

        {updatePreferences.isPending && <p className="text-sm text-blue-500">{t('common.loading')}</p>}
      </CardContent>
    </Card>

  )
}
