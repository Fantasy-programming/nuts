import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { usePreferencesStore } from "@/features/preferences/stores/preferences.store";
import { preferencesService, PreferencesResponse } from "@/features/preferences/services/preferences";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/core/components/ui/card";
import { Label } from "@/core/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/core/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/core/components/ui/radio-group";
import { Switch } from "@/core/components/ui/switch";
import { Suspense } from "react";
import { useTranslation } from "react-i18next";
import timezones from 'timezones-list';

const AVAILABLE_LOCALES = [
  { value: 'en-US', label: 'English (United States)' },
  { value: 'en-GB', label: 'English (United Kingdom)' },
  { value: 'fr-FR', label: 'Français (France)' },
  { value: 'es-ES', label: 'Español (España)' },
  { value: 'de-DE', label: 'Deutsch (Deutschland)' },
];


const DATE_FORMATS = ['dd/mm/yyyy', 'mm/dd/yyyy', 'yyyy-mm-dd'] as const;
const TIME_FORMATS = ['12h', '24h'] as const;


export const Route = createFileRoute("/dashboard_/settings/localization")({
  component: LocalizationSettingsComponent,
});

function LocalizationSettingsComponent() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  const locale = usePreferencesStore((state) => state.locale)
  const timezone = usePreferencesStore((state) => state.timezone)
  const time_format = usePreferencesStore((state) => state.time_format)
  const date_format = usePreferencesStore((state) => state.date_format)
  const start_week_on_monday = usePreferencesStore((state) => state.start_week_on_monday)
  const isLoading = usePreferencesStore((state) => state.isLoading)


  const updatePreferences = useMutation({
    mutationFn: preferencesService.updatePreferences,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['preferences'] });
    },
  });


  // Helper to create label text for date formats
  const getDateFormatLabel = (format: PreferencesResponse["date_format"]) => {
    switch (format) {
      case 'dd/mm/yyyy': return `26/10/2024 (${format})`;
      case 'mm/dd/yyyy': return `10/26/2024 (${format})`;
      case 'yyyy-mm-dd': return `2024-10-26 (${format})`;
      default: return format;
    }
  };

  // Helper to create label text for time formats
  const getTimeFormatLabel = (format: PreferencesResponse['time_format']) => {
    const now = new Date();
    now.setHours(15, 30, 0); // 3:30 PM
    const options: Intl.DateTimeFormatOptions = { hour: 'numeric', minute: 'numeric' };
    if (format === '12h') options.hour12 = true;
    if (format === '24h') options.hour12 = false;
    try {
      return `${now.toLocaleTimeString(locale || 'en-US', options)} (${format})`;
    } catch (e) {
      // Fallback if locale is bad somehow
      console.error(e)
      return `${format === '12h' ? '3:30 PM' : '15:30'} (${format})`;
    }
  };

  return (
    <div className="space-y-6">
      <Suspense fallback={<div>{t('common.loading')}</div>}>

        <Card className="flex justify-between items-center">
          <CardHeader>
            <CardTitle>{t('localization.language')}</CardTitle>
            <CardDescription>
              {t('localization.languageDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent className=" p-0 pr-6">
            <Label htmlFor="locale-select" className="sr-only">{t('localization.language')}</Label>
            <Select
              value={locale}
              onValueChange={(value) => updatePreferences.mutate({ locale: value })}
              disabled={isLoading}
            >
              <SelectTrigger id="locale-select" className="w-[280px]">
                <SelectValue placeholder={t('localization.selectLanguage')} />
              </SelectTrigger>
              <SelectContent>
                {AVAILABLE_LOCALES.map((locale) => (
                  <SelectItem key={locale.value} value={locale.value}>
                    {locale.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card className="flex justify-between items-center">
          <CardHeader>
            <CardTitle>{t('localization.timezone')}</CardTitle>
            <CardDescription>{t('localization.timezoneDescription')}</CardDescription>
          </CardHeader>
          <CardContent className="p-0 pr-6">
            <div className="space-y-2">
              <Label htmlFor="timezone-select" className="sr-only">{t('localization.timezone')}</Label>
              <Select
                value={timezone}
                onValueChange={(value) => updatePreferences.mutate({ timezone: value })}
                disabled={isLoading}
              >
                <SelectTrigger id="timezone-select" className="w-[280px]">
                  <SelectValue placeholder={t('localization.selectTimezone')} />
                </SelectTrigger>
                {/* Consider using SelectGroup for regions if list is long */}
                {/* Consider adding a search input for very long lists */}
                <SelectContent className="max-h-[200px]">
                  {timezones.map((locale) => (
                    <SelectItem key={locale.label} value={locale.tzCode}>
                      {locale.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card className="flex justify-between items-center">
          <CardHeader>
            <CardTitle>{t('localization.timeFormat')}</CardTitle>
          </CardHeader>
          <CardContent className="p-0 pr-6">
            <div className="space-y-2">
              <Label className="sr-only">{t('localization.timeFormat')}</Label>
              <RadioGroup
                value={time_format}
                onValueChange={(value: PreferencesResponse['time_format']) => updatePreferences.mutate({ time_format: value })}
                className="flex space-x-4"
                disabled={isLoading}
              >
                {TIME_FORMATS.map(format => (
                  <div key={format} className="flex items-center space-x-2">
                    <RadioGroupItem value={format} id={`time-${format}`} />
                    <Label htmlFor={`time-${format}`}>{getTimeFormatLabel(format)}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          </CardContent>
        </Card>

        <Card className="flex justify-between items-center">
          <CardHeader>
            <CardTitle>{t('localization.dateFormat')}</CardTitle>
          </CardHeader>
          <CardContent className="p-0 pr-6">
            <div className="space-y-2">
              <Label className="sr-only">{t('localization.dateFormat')}</Label>
              <RadioGroup
                value={date_format}
                onValueChange={(value: PreferencesResponse['date_format']) => updatePreferences.mutate({ date_format: value })}
                className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-4" // Adjust layout for responsiveness
                disabled={isLoading}
              >
                {DATE_FORMATS.map(format => (
                  <div key={format} className="flex items-center space-x-2">
                    <RadioGroupItem value={format} id={`date-${format}`} />
                    <Label htmlFor={`date-${format}`}>{getDateFormatLabel(format)}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          </CardContent>
        </Card>

        <Card className="flex justify-between items-center">
          <CardHeader>
            <CardTitle>{t('localization.startWeekMonday')}</CardTitle>
          </CardHeader>
          <CardContent className="p-0 pr-6">
            <div className="flex items-center space-x-3 pt-2">
              <Switch
                id="start-week-monday"
                checked={start_week_on_monday}
                onCheckedChange={(checked) => updatePreferences.mutate({ start_week_on_monday: checked })}
                disabled={isLoading}
              />
              <Label htmlFor="start-week-monday" className="sr-only">{t('localization.startWeekMonday')}</Label>
            </div>
          </CardContent>
        </Card>

      </Suspense>
    </div>
  );
}
