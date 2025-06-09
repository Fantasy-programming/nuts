import React from 'react';
import MonoConnect from '@mono.co/connect.js';
import { logger } from '@/lib/logger';

interface UseMomoProps {
  key: string,
  onSuccess?: (payload: { code: string }) => void
  onLoad?: () => void
  onClose?: () => void
  onEvent?: (eventName: string, eventData: unknown) => void
}

interface useMonoReturn {
  openMono: () => void
  reauthoriseAccount: (accountId: string) => void
  isWidgetLoading: boolean
  isMonoReady: boolean
}

export function useMono({ key, onSuccess, onLoad, onClose, onEvent }: UseMomoProps): useMonoReturn {
  const [isWidgetLoading, setIsWidgetLoading] = React.useState(false);

  const monoInstance = React.useMemo(() => {
    if (!key) return null;

    const connectInstance = new MonoConnect({
      key: key,
      onSuccess: (payload: { code: string }) => {
        setIsWidgetLoading(false);
        if (onSuccess) onSuccess(payload);
      },
      onLoad: () => {
        // Widget is ready to be opened, but not necessarily visible yet
        // setIsWidgetLoading(true) might be premature here, better on open()
        if (onLoad) onLoad();
      },
      onClose: () => {
        setIsWidgetLoading(false);
        if (onClose) onClose();
      },
      onEvent: (eventName: string, eventData: unknown) => {
        logger.debug(`Mono event: ${eventName} ${eventData}`);
        if (onEvent) onEvent(eventName, eventData);
      },
    });
    // IMPORTANT: Do not call setup() or reauthorise() here in useMemo
    // Call them right before open() in the respective functions.
    return connectInstance;
  }, [onSuccess, onLoad, onClose, onEvent, key]); // Dependencies for callbacks

  const openMono = React.useCallback(() => {
    if (!monoInstance) {
      console.error("Mono instance not initialized. Check public key.");
      return;
    }
    setIsWidgetLoading(true);

    monoInstance.setup(); // Call setup for new linking
    monoInstance.open();
  }, [monoInstance]);

  const reauthoriseAccount = React.useCallback((accountId: string) => {
    if (!monoInstance) {
      console.error("Mono instance not initialized. Check public key.");
      return;
    }
    if (!accountId) {
      console.error("Account ID is required for re-authorisation.");
      return;
    }
    setIsWidgetLoading(true);

    monoInstance.reauthorise(accountId); // Call reauthorise for existing accounts
    monoInstance.open();
  }, [monoInstance]);

  return {
    openMono,
    reauthoriseAccount,
    isWidgetLoading,
    isMonoReady: !!monoInstance, // To check if Mono could be initialized
  };
}
