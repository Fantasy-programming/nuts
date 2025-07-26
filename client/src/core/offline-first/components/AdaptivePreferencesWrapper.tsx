/**
 * Adaptive Preferences Wrapper
 * 
 * Switches between regular preferences provider and offline-first preferences provider
 * based on feature flags and connectivity.
 */

import { ReactNode } from 'react';
import { PreferencesProvider } from '@/features/preferences/components/preferences-provider';
import { AdaptivePreferencesProvider } from './AdaptivePreferencesProvider';
import { featureFlagsService } from '../services/feature-flags.service';

interface AdaptivePreferencesWrapperProps {
  children: ReactNode;
}

export function AdaptivePreferencesWrapper({ children }: AdaptivePreferencesWrapperProps) {
  // Use adaptive preferences when offline-first preferences are enabled
  const shouldUseAdaptivePreferences = featureFlagsService.useOfflineFirstPreferences() || featureFlagsService.isFullyOfflineModeEnabled();

  if (shouldUseAdaptivePreferences) {
    return <AdaptivePreferencesProvider>{children}</AdaptivePreferencesProvider>;
  }

  return <PreferencesProvider>{children}</PreferencesProvider>;
}