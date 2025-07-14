import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { preferencesService, PreferencesResponse } from '../services/preferences';
import i18n from '@/core/i18n/config.ts';
import { tryCatch } from '@/lib/trycatch';
import { logger } from '@/lib/logger';
import { parseApiError } from '@/lib/error';

interface PreferenceState extends PreferencesResponse {
  isLoading: boolean;
  error: null | string;
  isInitialized: boolean;

  setLoading: (isLoading: boolean) => void;
  setError: (error: string) => void;

  setLanguageInternal: (language: string) => void;

  setPreferences: (preferences: PreferencesResponse) => Promise<void>;
  updateTheme: (theme: 'light' | 'dark' | 'system') => Promise<void>;
  resetPreferences: () => void;
}


const initialState: Partial<PreferenceState> = {
  locale: i18n.language?.split('-')[0],
  theme: 'light',
  isLoading: false,
  error: null,
  isInitialized: false,
};

export const usePreferencesStore = create<PreferenceState>()(
  devtools(
    (set, get) => ({
      ...initialState as PreferenceState,

      setLoading: (isLoading: boolean) => set({ isLoading }),
      setError: (error: string) => set({ error }),

      setLanguageInternal: (language: string) => set({ locale: language.split('-')[0] }),

      setPreferences: async (preferences) => {
        const savedLang = preferences.locale;

        if (!savedLang) {
          logger.warn('No language preference found in DB.');
          set({
            ...preferences,
            locale: i18n.language.split('-')[0],
            isLoading: false,
            isInitialized: true
          });
          return;
        }

        if (savedLang !== i18n.language.split('-')[0]) {
          if (i18n.isInitialized) {
            await i18n.changeLanguage(savedLang);
            logger.debug(`i18next language changed to: ${savedLang}`);
          } else {
            logger.warn('i18next not ready, language may not update immediately.');
          }
        }

        set({ ...preferences, isLoading: false, isInitialized: true });
      },


      updateTheme: async (theme) => {
        const { theme: prevTheme, isLoading } = get();
        if (isLoading || prevTheme === theme) return;

        set({ isLoading: true, error: null, theme });

        const { error: e2 } = await tryCatch(preferencesService.updatePreferences({ theme }));
        if (e2) {
          const parsed = parseApiError(e2);
          logger.error(e2, { action: 'updateTheme', parsed });
          set({ theme: prevTheme, error: e2.message, isLoading: false });
          return;
        }

        set({ isLoading: false });
      },

      resetPreferences: () => {
        const defaultLang = i18n.language.split('-')[0] || 'en';
        set({ locale: defaultLang, isInitialized: false });
      },
    }),
    {
      name: 'preference-storage',
    }
  )
);
