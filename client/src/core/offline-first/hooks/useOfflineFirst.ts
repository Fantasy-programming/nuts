/**
 * React Hook for Offline-First Initialization
 * 
 * Manages the initialization of offline-first services in React components
 */

import { useEffect, useState } from 'react';
import { offlineFirstInitService } from '../services/offline-first-init.service';
import { featureFlagsService } from '../services/feature-flags.service';

export interface OfflineFirstStatus {
  isInitialized: boolean;
  isInitializing: boolean;
  error: Error | null;
  offlineFirstEnabled: boolean;
}

export const useOfflineFirst = (): OfflineFirstStatus => {
  const [status, setStatus] = useState<OfflineFirstStatus>({
    isInitialized: false,
    isInitializing: false,
    error: null,
    offlineFirstEnabled: featureFlagsService.isEnabled('offline-first-enabled')
  });

  useEffect(() => {
    const initializeServices = async () => {
      if (!featureFlagsService.isEnabled('offline-first-enabled')) {
        setStatus(prev => ({ ...prev, offlineFirstEnabled: false }));
        return;
      }

      if (offlineFirstInitService.isReady()) {
        setStatus(prev => ({ 
          ...prev, 
          isInitialized: true, 
          offlineFirstEnabled: true 
        }));
        return;
      }

      setStatus(prev => ({ 
        ...prev, 
        isInitializing: true, 
        offlineFirstEnabled: true 
      }));

      try {
        await offlineFirstInitService.initialize();
        setStatus(prev => ({ 
          ...prev, 
          isInitialized: true, 
          isInitializing: false, 
          error: null 
        }));
      } catch (error) {
        setStatus(prev => ({ 
          ...prev, 
          isInitializing: false, 
          error: error instanceof Error ? error : new Error('Unknown initialization error') 
        }));
      }
    };

    initializeServices();

    // Listen for feature flag changes
    const checkFeatureFlags = () => {
      const isEnabled = featureFlagsService.isEnabled('offline-first-enabled');
      setStatus(prev => ({ ...prev, offlineFirstEnabled: isEnabled }));
      
      if (isEnabled && !offlineFirstInitService.isReady()) {
        initializeServices();
      }
    };

    // Simple polling for feature flag changes (in production, use proper event system)
    const interval = setInterval(checkFeatureFlags, 5000);

    return () => clearInterval(interval);
  }, []);

  return status;
};

/**
 * React Hook for Offline-First Transaction Service
 * 
 * Provides access to the adaptive transaction service with initialization status
 */
export const useAdaptiveTransactions = () => {
  const offlineStatus = useOfflineFirst();
  
  return {
    ...offlineStatus,
    isUsingOfflineFirst: featureFlagsService.useOfflineFirstTransactions(),
  };
};

/**
 * React Hook for Offline-First Account Service
 * 
 * Provides access to the adaptive account service with initialization status
 */
export const useAdaptiveAccounts = () => {
  const offlineStatus = useOfflineFirst();
  
  return {
    ...offlineStatus,
    isUsingOfflineFirst: featureFlagsService.useOfflineFirstAccounts(),
  };
};

/**
 * React Hook for Offline-First Category Service
 * 
 * Provides access to the adaptive category service with initialization status
 */
export const useAdaptiveCategories = () => {
  const offlineStatus = useOfflineFirst();
  
  return {
    ...offlineStatus,
    isUsingOfflineFirst: featureFlagsService.useOfflineFirstCategories(),
  };
};