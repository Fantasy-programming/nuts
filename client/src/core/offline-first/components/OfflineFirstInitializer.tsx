/**
 * Offline-First Initialization Component
 * 
 * Handles the initialization of offline-first services and shows loading state
 */

import React from 'react';
import { useOfflineFirst } from '../hooks/useOfflineFirst';

interface OfflineFirstInitializerProps {
  children: React.ReactNode;
}

export const OfflineFirstInitializer: React.FC<OfflineFirstInitializerProps> = ({ children }) => {
  const { isInitializing, error, offlineFirstEnabled } = useOfflineFirst();

  // If offline-first is disabled, just render children
  if (!offlineFirstEnabled) {
    return <>{children}</>;
  }

  // Show error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-600 mb-2">
            Offline-First Initialization Failed
          </h2>
          <p className="text-gray-600 mb-4">{error.message}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Show loading state
  if (isInitializing) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            Initializing Offline-First Services
          </h2>
          <p className="text-gray-600">
            Setting up local storage and sync capabilities...
          </p>
        </div>
      </div>
    );
  }

  // If initialization is complete or not needed, render children
  return <>{children}</>;
};