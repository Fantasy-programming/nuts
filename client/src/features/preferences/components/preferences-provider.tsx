import { useEffect, ReactNode } from 'react';
import { usePreferencesStore } from '../stores/preferences.store.ts';
import { preferencesService } from '../services/preferences';
import { logger } from '@/lib/logger.ts';
import { parseApiError } from '@/lib/error.ts';
import { useAuthenticatedQuery } from '@/lib/authed-query.ts';

interface PreferencesProviderProps {
  children: ReactNode;
}

export function PreferencesProvider({ children }: PreferencesProviderProps) {

  const setLoading = usePreferencesStore((state) => state.setLoading)
  const setError = usePreferencesStore((state) => state.setError)
  const setPreferences = usePreferencesStore(state => state.setPreferences)

  const { data, isLoading, error, isSuccess, isError } = useAuthenticatedQuery({
    queryKey: ['preferences'],
    queryFn: preferencesService.getPreferences,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: 1,
  });

  useEffect(() => {
    if (isLoading && !isSuccess && !isError) {
      setLoading(true);
    }

    if (isSuccess && data) {
      void setPreferences(data);
    }

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

    if (!isLoading && !isError) {
      setLoading(false);
    }
  }, [isLoading, isSuccess, isError, data, error, setPreferences, setLoading, setError]);


  return <>{children}</>;
}
