/**
 * Adaptive Auth Wrapper
 * 
 * Switches between regular auth interceptor and offline-first auth interceptor
 * based on feature flags and connectivity.
 */

import { FC } from 'react';
import { AuthInterceptor } from '@/features/auth/components/auth-interceptor';
import { OfflineFirstAuthInterceptor } from './OfflineFirstAuthInterceptor';
import { featureFlagsService } from '../services/feature-flags.service';
import { connectivityService } from '../services/connectivity.service';

interface AdaptiveAuthWrapperProps {
  children: React.ReactNode;
}

export const AdaptiveAuthWrapper: FC<AdaptiveAuthWrapperProps> = ({ children }) => {
  // Use offline-first auth when fully offline mode is enabled or when server is not accessible
  const shouldUseOfflineFirst = featureFlagsService.isFullyOfflineModeEnabled() || !connectivityService.hasServerAccess();

  if (shouldUseOfflineFirst) {
    return <OfflineFirstAuthInterceptor>{children}</OfflineFirstAuthInterceptor>;
  }

  return <AuthInterceptor>{children}</AuthInterceptor>;
};