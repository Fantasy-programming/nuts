import { api } from "@/lib/axios";

const PREFERENCES_ENDPOINT = "/preferences";

export interface PreferencesResponse {
  locale: string;
  timezone: string; // e.g., 'America/New_York', 'Europe/Paris'
  time_format: '12h' | '24h';
  date_format: 'dd/mm/yyyy' | 'mm/dd/yyyy' | 'yyyy-mm-dd';
  start_week_on_monday: boolean;
  currency: string;
  theme: "light" | "dark" | "system";
  dark_sidebar: boolean;
}

const getPreferences = async (): Promise<PreferencesResponse> => {
  const response = await api.get(PREFERENCES_ENDPOINT);
  return response.data;
};

const updatePreferences = async (preferences: Partial<PreferencesResponse>): Promise<PreferencesResponse> => {
  const response = await api.put(PREFERENCES_ENDPOINT, preferences);
  return response.data;
};

export const preferencesService = {
  getPreferences,
  updatePreferences,
};
