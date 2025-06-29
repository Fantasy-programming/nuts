import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { preferencesService, PreferencesResponse } from '../services/preferences'; // Adjust path
import i18n from '@/core/i18n/config.ts'; // Adjust path
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
  resetPreferences: () => void;
}



export const usePreferencesStore = create<PreferenceState>()(
  devtools(
    (set, get) => ({

      setLoading: (isLoading: boolean) => set({ isLoading }),
      setError: (error: string) => set({ error }),

      setPreferences: async (preferences: PreferencesResponse) => {
        const savedLang = preferences.locale;

        if (savedLang === "") {
          logger.warn('No language preference found in DB. Using current/fallback.');
          set({
            ...preferences,
            locale: i18n.language.split('-')[0],
            isLoading: false
          });
          return
        }

        logger.debug(`Preferences fetched. Language from DB: ${savedLang}`);


        if (savedLang !== i18n.language.split('-')[0]) {
          if (i18n.isInitialized) {
            await i18n.changeLanguage(savedLang);
            logger.debug(`i18next language changed to: ${savedLang}`);
          } else {
            logger.warn('i18next not ready during fetchPreferences, language may not update immediately.');
          }
        }

        // Update store state regardless
        set({ ...preferences, isLoading: false });
      },

      setLanguageInternal: (language: string) => {
        set({ locale: language.split('-')[0] }); // Store base language code
      },

      updateTheme: async (theme: 'light' | 'dark' | 'system') => {
        const currentTheme = get().theme;

        if (currentTheme === theme || get().isLoading) {
          return; // No change or already updating
        }

        set({ isLoading: true, error: null });

        // 1. Update the store state
        set({ theme: theme });

        // 3. Update the backend (only if authenticated - check can happen here or in component)
        // Assuming the call originates from an authenticated context
        const { error: e2 } = await tryCatch(preferencesService.updatePreferences({ theme }))

        if (e2) {
          const parsedErr = parseApiError(e2)
          logger.error(e2, {
            file: "PreferenceStore",
            action: "updateTheme",
            parsedErrorType: parsedErr.type,
            parsedUserMessage: parsedErr.userMessage,
            validationErrors: parsedErr.validationErrors,
            statusCode: parsedErr.statusCode,
            axiosErrorCode: parsedErr.axiosErrorCode,
            attemptedTheme: theme,
          });

          set({ error: e2.message, isLoading: false });
          return

          // Optional: Rollback local changes on server update failure
        }

        logger.info(`Server Theme preference updated to: ${theme}`);
        set({ isLoading: false });
      },

      // Action to reset preferences (e.g., on logout)
      resetPreferences: () => {
        logger.info("Resetting preference store");

        // Reset to initial i18next language or default fallback
        const defaultLang = i18n.language || 'en-US';
        set({ locale: defaultLang });
      },
    }),
    {
      name: 'preference-storage',
    }
  )
);

// Optional: Listen to i18next language changes to keep store in sync
// This handles cases where language might be changed by other means (e.g., query param detector)
// Needs to be called once, e.g., in your main App component or index.js

// export const syncPreferenceStoreWithI18n = () => {
//   const handleLanguageChange = (lng: string) => {
//     console.log('i18next languageChanged event detected:', lng);
//     const baseLang = lng.split('-')[0];
//     const { locale: language, isLoading, setLanguageInternal } = usePreferenceStore.getState();
//     if (baseLang && baseLang !== language && !isLoading) { // Check isLoading to avoid loops during updates
//       console.log(`Syncing preference store language to: ${baseLang}`);
//       setLanguageInternal(baseLang); // Use internal setter to avoid triggering updates
//     }
//   };
//
//   if (i18n.isInitialized) {
//     handleLanguageChange(i18n.language); // Sync initial state
//   } else {
//     i18n.on('initialized', () => {
//       handleLanguageChange(i18n.language); // Sync once initialized
//       i18n.on('languageChanged', handleLanguageChange);
//     });
//   }
//
//   // Cleanup listener on unmount (if called within a component)
//   // return () => {
//   //   i18n.off('languageChanged', handleLanguageChange);
//   // };
// }

// Call syncPreferenceStoreWithI18n() in your main App component or index.js
// Example in App.js:
// useEffect(() => {
//    syncPreferenceStoreWithI18n();
// }, []);
