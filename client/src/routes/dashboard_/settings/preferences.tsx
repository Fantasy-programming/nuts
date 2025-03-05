import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/core/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/core/components/ui/select";
import { Label } from "@/core/components/ui/label";

import { useSettingsStore } from "@/features/preferences/stores/settings.store";
import { createFileRoute } from "@tanstack/react-router";
import { metaService } from "@/features/preferences/services/meta";
import { useState } from "react";
import getSymbolFromCurrency from "currency-symbol-map";

const locales = [
  { value: "en-US", label: "English (US)" },
  { value: "en-GB", label: "English (UK)" },
  { value: "fr-FR", label: "French" },
  { value: "de-DE", label: "German" },
  { value: "es-ES", label: "Spanish" },
];

const themes = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "System" },
];

export const Route = createFileRoute("/dashboard_/settings/preferences")({
  component: RouteComponent,
  loader: async () => {
    const currencies = await metaService.getCurrencies();
    return { currencies };
  },
  gcTime: 1000 * 60 * 5,
  staleTime: 1000 * 60 * 2,
  pendingComponent: () => <div>Loading account data...</div>,
  pendingMs: 150,
  pendingMinMs: 200,
});

function RouteComponent() {
  const { currencies } = Route.useLoaderData();
  const [curr, setCurr] = useState<string | undefined>();

  const { preferences, updatePreferences } = useSettingsStore();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Preferences</CardTitle>
        <CardDescription>Customize your application experience</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6">
        <div className="grid gap-2">
          <Label>Language</Label>
          <Select value={preferences.locale} onValueChange={(value) => updatePreferences({ locale: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {locales.map((locale) => (
                <SelectItem key={locale.value} value={locale.value}>
                  {locale.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-2">
          <Label>Currency</Label>
          <Select value={curr} onValueChange={(value) => setCurr(value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {currencies.map((currency) => (
                <SelectItem key={currency.code} value={currency.code}>
                  {currency.name} ({getSymbolFromCurrency(currency.code)})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-2">
          <Label>Theme</Label>
          <Select value={preferences.theme} onValueChange={(value: "light" | "dark" | "system") => updatePreferences({ theme: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {themes.map((theme) => (
                <SelectItem key={theme.value} value={theme.value}>
                  {theme.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}
