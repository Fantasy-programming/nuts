/**
 * Adaptive Preferences Wrapper
 * 
 * Switches between regular preferences provider and offline-first preferences provider
 * based on feature flags and connectivity.
 */

import { ReactNode } from 'react';
import { PreferencesProvider } from '@/features/preferences/components/preferences-provider';
import { OfflineFirstPreferencesProvider } from './OfflineFirstPreferencesProvider';
import { featureFlagsService } from '../services/feature-flags.service';
import { connectivityService } from '../services/connectivity.service';

interface AdaptivePreferencesWrapperProps {
  children: ReactNode;
}

export function AdaptivePreferencesWrapper({ children }: AdaptivePreferencesWrapperProps) {
  // Use offline-first preferences when fully offline mode is enabled or when server is not accessible
  const shouldUseOfflineFirst = featureFlagsService.isFullyOfflineModeEnabled() || !connectivityService.hasServerAccess();

  if (shouldUseOfflineFirst) {
    return <OfflineFirstPreferencesProvider>{children}</OfflineFirstPreferencesProvider>;
  }

  return <PreferencesProvider>{children}</PreferencesProvider>;
}