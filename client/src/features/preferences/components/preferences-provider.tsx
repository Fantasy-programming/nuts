import { useEffect, ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { usePreferencesStore } from '../stores/preferences.store.ts';
import { preferencesService } from '../services/preferences';
import { logger } from '@/lib/logger.ts';
import { parseApiError } from '@/lib/error.ts';

interface PreferencesProviderProps {
  children: ReactNode;
}

export function PreferencesProvider({ children }: PreferencesProviderProps) {

  const setLoading = usePreferencesStore((state) => state.setLoading)
  const setError = usePreferencesStore((state) => state.setError)
  const setPreferences = usePreferencesStore(state => state.setPreferences)

  const { data, isLoading, error, isSuccess, isError } = useQuery({
    queryKey: ['preferences'],
    queryFn: preferencesService.getPreferences,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: 1,
  });

  // Effect to synchronize React Query state with Zustand store
  useEffect(() => {
    if (isLoading && !isSuccess && !isError) {
      setLoading(true);
    }

    if (isSuccess && data) {
      setPreferences(data);
    }

    // If fetch fails, update error state in Zustand
    if (isError && error) {
      const parsedErr = parseApiError(error)
      setError(parsedErr.userMessage);

      logger.error(error, {
        component: "PreferenceProvider",
        action: "useEffect",
        parsedErrorType: parsedErr.type,
        parsedUserMessage: parsedErr.userMessage,
        validationErrors: parsedErr.validationErrors,
        statusCode: parsedErr.statusCode,
        axiosErrorCode: parsedErr.axiosErrorCode,
      });
    }
  }, [isLoading, isSuccess, isError, data, error, setPreferences, setLoading, setError]);


  return <>{children}</>;
}
