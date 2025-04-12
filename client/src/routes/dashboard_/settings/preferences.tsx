import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient, useMutation, useQuery } from "@tanstack/react-query";
import { usePreferenceStore } from "@/features/preferences/stores/preferences.store";
import { metaService } from "@/features/preferences/services/meta";
import { preferencesService } from "@/features/preferences/services/preferences";
import getSymbolFromCurrency from "currency-symbol-map";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/core/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/core/components/ui/select";
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


const locales = [
  { value: "en-US", label: "English (US)" },
  { value: "en-GB", label: "English (UK)" },
  { value: "fr-FR", label: "French" },
  { value: "de-DE", label: "German" },
  { value: "es-ES", label: "Spanish" },
];

const THEMES = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "System" },
];


// TODO: Sync server state and zustand with react-query
export const Route = createFileRoute("/dashboard_/settings/preferences")({
  component: RouteComponent,
  loader: async ({ context }) => {
    const queryClient = context.queryClient;
    const currencies = await metaService.getCurrencies();

    // Prefetch preferences
    queryClient.prefetchQuery({
      queryKey: ["preferences"],
      queryFn: preferencesService.getPreferences,
    });

    return { currencies };
  },
  gcTime: 1000 * 60 * 5,
  staleTime: 1000 * 60 * 2,
  pendingComponent: () => <div>Loading account data...</div>,
  pendingMs: 150,
  pendingMinMs: 200,
});



function RouteComponent() {
  // const queryClient = useQueryClient();
  const { currencies } = Route.useLoaderData();

  const { data: preferences } = useQuery({
    queryKey: ["preferences"],
    queryFn: preferencesService.getPreferences,
  });

  const [isSaving, setIsSaving] = useState(false);
  const [isCSelectorOpen, setIsCSelectorOpen] = useState(false);
  const [isLSelectorOpen, setIsLSelectorOpen] = useState(false);

  const theme = usePreferenceStore((state) => state.theme)
  const currency = usePreferenceStore((state) => state.currency)
  const locale = usePreferenceStore((state) => state.locale)
  const updateLocale = usePreferenceStore((state) => state.updateLocale);
  const updateTheme = usePreferenceStore((state) => state.updateTheme);
  const updateCurrency = usePreferenceStore((state) => state.updateCurrency);

  // const updatePreferencesMutation = useMutation({
  //   mutationFn: preferencesService.updatePreferences,
  //   onSuccess: (updatedPreferences) => {
  //     queryClient.invalidateQueries({ queryKey: ["preferences"] });
  //     updatePreferences(updatedPreferences); // Update local store with server response
  //     setIsSaving(false);
  //   },
  //   onError: (error) => {
  //     console.error("Failed to update preferences:", error);
  //     setIsSaving(false);
  //   }
  // });

  const onThemeUpdate = (value: "system" | "light" | "dark") => {
    setIsSaving(true);
    updateTheme(value);
    setIsSaving(false);

    // updatePreferencesMutation.mutate({
    //   ...preferences,
    //   theme: value
    // })
  }

  const onCurrencyUpdate = (value: string) => {
    setIsSaving(true);
    updateCurrency(value)
    setIsSaving(false);
    // updatePreferences({ currency: value });

    // updatePreferencesMutation.mutate({
    //   ...preferences,
    //   currency: value
    // })
  }


  const onLocaleUpdate = (value: string) => {
    setIsSaving(true);
    updateLocale(value)
    setIsSaving(false);
    // updatePreferences({ locale: value });

    // updatePreferencesMutation.mutate({
    //   ...preferences,
    //   locale: value
    // })
  }

  // // Handle preference updates
  // const handlePreferenceUpdate = (key: string, value: any) => {
  //   setIsSaving(true);
  //
  //   // Update locally for immediate feedback
  //   updatePreferences({ [key]: value });
  //
  //   // Update on server
  //   updatePreferencesMutation.mutate({
  //     ...preferences,
  //     [key]: value
  //   });
  // };



  return (
    <Card>
      <CardHeader>
        <CardTitle>Preferences</CardTitle>
        <CardDescription>Customize your application experience</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6">
        <div className="grid gap-2">
          <Label>Language</Label>

          <ComboBox open={isLSelectorOpen} onOpenChange={setIsLSelectorOpen}>
            <ComboBoxTrigger>
              <Button variant="outline" role="combobox"
                aria-expanded={isLSelectorOpen} className="justify-between">
                {locale ? <>{locales.find((lcl => lcl.value === locale))?.label}</> : <>Select Language</>}
                <ChevronsUpDown className="opacity-50" />
              </Button>
            </ComboBoxTrigger>
            <ComboBoxContent>
              <Command>
                <CommandInput placeholder="Filter languages..." />
                <CommandList>
                  <CommandEmpty>No results found.</CommandEmpty>
                  <CommandGroup>
                    {locales.map((locale) => (
                      <CommandItem
                        key={locale.value}
                        value={locale.value}
                        keywords={[locale.label]}
                        onSelect={(value) => {
                          onLocaleUpdate(value)
                          setIsLSelectorOpen(false)
                        }}
                      >
                        {locale.label}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </ComboBoxContent>
          </ComboBox>
        </div>

        <div className="grid gap-2">
          <Label>Currency</Label>
          <ComboBox open={isCSelectorOpen} onOpenChange={setIsCSelectorOpen}>
            <ComboBoxTrigger>
              <Button variant="outline" role="combobox"
                aria-expanded={isCSelectorOpen} className="justify-between">
                {currency ? <>{currencies.find((c => c.code === currency))?.name} ({getSymbolFromCurrency(currency)})</> : <>Select Language</>}
                <ChevronsUpDown className="opacity-50" />
              </Button>
            </ComboBoxTrigger>
            <ComboBoxContent>
              <Command>
                <CommandInput placeholder="Filter status..." />
                <CommandList>
                  <CommandEmpty>No results found.</CommandEmpty>
                  <CommandGroup>
                    {currencies.map((currency) => (
                      <CommandItem
                        key={currency.code}
                        value={currency.code}
                        keywords={[currency.code, currency.name]}
                        onSelect={(value) => {
                          onCurrencyUpdate(value)
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

        <div className="grid gap-2">
          <Label>Theme</Label>
          <Select value={theme} onValueChange={(value: "light" | "dark" | "system") => onThemeUpdate(value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {THEMES.map((theme) => (
                <SelectItem key={theme.value} value={theme.value}>
                  {theme.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {isSaving && <p className="text-sm text-blue-500">Saving preferences...</p>}
      </CardContent>
    </Card>
  );
}

