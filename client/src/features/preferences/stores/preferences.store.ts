import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { preferencesService } from '../services/preferences'; // Adjust path
import i18n from '@/core/i18n/config.ts'; // Adjust path
import { tryCatch } from '@/lib/trycatch';

interface PreferenceState {
  locale: string;
  currency: string;
  theme: string;

  isLoading: boolean;
  error: null | string;
  isInitialized: boolean;

  setLoading: (isLoading: boolean) => void;
  setError: (error: string) => void;

  setLanguageInternal: (language: string) => void;

  updateLocale: (locale: string) => void;
  updateTheme: (theme: 'light' | 'dark' | 'system') => void;
  updateCurrency: (currency: string) => void;


  fetchPreferences: () => Promise<void>;
  resetPreferences: () => void;
}


const initialState = {
  locale: i18n.language?.split('-')[0] || 'en-US',
  currency: 'USD',
  theme: 'system',
  isLoading: false,
  error: null,
  // Flag to know if preferences have been loaded from backend
  isInitialized: false,
};

export const usePreferenceStore = create<PreferenceState>()(
  devtools(
    (set, get) => ({
      ...initialState,

      setLoading: (isLoading: boolean) => set({ isLoading }),
      setError: (error: string) => set({ error }),

      /**
       * Fetches preferences from the backend and updates the store.
       * IMPORTANT: This should typically be called AFTER authentication.
       */
      fetchPreferences: async () => {
        if (get().isLoading) return; // Prevent concurrent fetches
        set({ isLoading: true, error: null });

        const { data: preferences, error } = await tryCatch(preferencesService.getPreferences());

        if (error) {
          console.error("fetchPreferences error:", error.message);
          set({ error: error.message, isLoading: false, isInitialized: true });
          return
        }

        // Call Code to update relevant subsystems
        const savedLang = preferences.locale;

        if (savedLang === "") {
          console.log('No language preference found in DB. Using current/fallback.');
          set({
            locale: i18n.language.split('-')[0],
            isLoading: false,
            isInitialized: true,
          });
          return
        }

        console.log(`Preferences fetched. Language from DB: ${savedLang}`);


        if (savedLang !== i18n.language.split('-')[0]) {
          if (i18n.isInitialized) {
            await i18n.changeLanguage(savedLang);
            console.log(`i18next language changed to: ${savedLang}`);
          } else {
            console.warn('i18next not ready during fetchPreferences, language may not update immediately.');
          }
        }

        // Update store state regardless
        set({ locale: savedLang, isLoading: false, isInitialized: true });

        // Set other preferences from `prefs` object here if needed

      },

      setLanguageInternal: (language: string) => {
        set({ locale: language.split('-')[0] }); // Store base language code
      },

      /**
       * Updates the language preference both locally (i18next & store) and on the server.
       * Should be called from the UI (e.g., LanguageSwitcher).
       * @param {string} locale - The new language code (e.g., 'fr')
       */
      updateLocale: async (locale: string) => {
        const currentLocale = get().locale;

        if (locale === currentLocale || get().isLoading) {
          return; // No change or already updating
        }

        set({ isLoading: true, error: null });

        // 1. Update i18next locally first for responsiveness
        const { error: e1 } = await tryCatch(i18n.changeLanguage(locale))

        if (e1) {
          console.error("updateLanguagePreference error:", e1.message);
          set({ error: e1.message, isLoading: false });
          return
        }

        // 2. Update the store state
        set({ locale: locale });

        // 3. Update the backend (only if authenticated - check can happen here or in component)
        // Assuming the call originates from an authenticated context
        const { error: e2 } = await tryCatch(preferencesService.updatePreferences({ locale }))

        if (e2) {
          console.error("updateLanguagePreference error:", e2.message);
          set({ error: e2.message, isLoading: false });
          return

          // Optional: Rollback local changes on server update failure
          // set({ language: currentLang });
          // if (i18n.language !== previousLang) {
          //    await i18n.changeLanguage(previousLang);
          // }
          // Consider notifying the user about the failure
          // throw err; // Re-throw if the component needs to know about the error

        }

        console.log(`Server language preference updated to: ${locale}`);
        set({ isLoading: false }); // Success
      },

      updateCurrency: async (currency: string) => {
        const currentCurrency = get().currency;

        if (currency === currentCurrency || get().isLoading) {
          return; // No change or already updating
        }

        set({ isLoading: true, error: null });

        // 1. Update the store state
        set({ currency: currency });

        // 3. Update the backend (only if authenticated - check can happen here or in component)
        // Assuming the call originates from an authenticated context
        const { error: e2 } = await tryCatch(preferencesService.updatePreferences({ currency }))

        if (e2) {
          console.error("updateCurrencyPreference error:", e2.message);
          set({ error: e2.message, isLoading: false });
          return

          // Optional: Rollback local changes on server update failure
        }

        console.log(`Server currency preference updated to: ${currency}`);
        set({ isLoading: false }); // Success
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
          console.error("updateThemePreference error:", e2.message);
          set({ error: e2.message, isLoading: false });
          return

          // Optional: Rollback local changes on server update failure
        }

        console.log(`Server Theme preference updated to: ${theme}`);
        set({ isLoading: false }); // Success
      },




      // Action to reset preferences (e.g., on logout)
      resetPreferences: () => {
        console.log("Resetting preference store");
        // Reset to initial i18next language or default fallback
        const defaultLang = i18n.language.split('-')[0] || 'en';
        set({ ...initialState, locale: defaultLang });
        // You might want to ensure i18next also reverts if needed, though often
        // page reload on logout handles this, or LanguageDetector picks up browser default.
        // if (i18n.language.split('-')[0] !== defaultLang) {
        //    i18n.changeLanguage(defaultLang);
        // }
      },
    }),
    {
      name: 'preference-storage',
      // Persisting language might cause flicker if persisted != fetched.
      // Generally better to fetch the source of truth (DB).
      // Not persisting by default. Uncomment if needed, but be cautious.
      // getStorage: () => localStorage, // or sessionStorage
      // partialize: (state) => ({ language: state.language }),
    }
  )
);

// Optional: Listen to i18next language changes to keep store in sync
// This handles cases where language might be changed by other means (e.g., query param detector)
// Needs to be called once, e.g., in your main App component or index.js
export const syncPreferenceStoreWithI18n = () => {
  const handleLanguageChange = (lng: string) => {
    console.log('i18next languageChanged event detected:', lng);
    const baseLang = lng.split('-')[0];
    const { locale: language, isLoading, setLanguageInternal } = usePreferenceStore.getState();
    if (baseLang && baseLang !== language && !isLoading) { // Check isLoading to avoid loops during updates
      console.log(`Syncing preference store language to: ${baseLang}`);
      setLanguageInternal(baseLang); // Use internal setter to avoid triggering updates
    }
  };

  if (i18n.isInitialized) {
    handleLanguageChange(i18n.language); // Sync initial state
  } else {
    i18n.on('initialized', () => {
      handleLanguageChange(i18n.language); // Sync once initialized
      i18n.on('languageChanged', handleLanguageChange);
    });
  }

  // Cleanup listener on unmount (if called within a component)
  // return () => {
  //   i18n.off('languageChanged', handleLanguageChange);
  // };
}

// Call syncPreferenceStoreWithI18n() in your main App component or index.js
// Example in App.js:
// useEffect(() => {
//    syncPreferenceStoreWithI18n();
// }, []);
