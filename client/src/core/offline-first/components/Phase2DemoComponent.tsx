/**
 * Phase 2 Demo Component
 * 
 * A simple component that demonstrates Phase 2 offline-first functionality
 */

import React, { useState, useEffect } from 'react';
import { useOfflineFirst } from '../hooks/useOfflineFirst';
import { syncService, featureFlagsService } from '../index';
import { Button } from '@/core/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Badge } from '@/core/components/ui/badge';

export const Phase2DemoComponent: React.FC = () => {
  const { isInitialized, isInitializing, error, offlineFirstEnabled } = useOfflineFirst();
  const [syncState, setSyncState] = useState(syncService.getSyncState());
  const [testResults, setTestResults] = useState<any>(null);

  useEffect(() => {
    const unsubscribe = syncService.subscribe(setSyncState);
    return unsubscribe;
  }, []);

  const runPhase2Test = async () => {
    try {
      const { testOfflineFirstInfrastructure } = await import('../test/infrastructure.test');
      const results = await testOfflineFirstInfrastructure();
      setTestResults(results);
    } catch (error) {
      setTestResults({ success: false, error: 'Test failed to run' });
    }
  };

  const runValidation = async () => {
    try {
      const { validatePhase2Implementation } = await import('../test/phase2-validation.test');
      const results = await validatePhase2Implementation();
      setTestResults(results);
    } catch (error) {
      setTestResults({ success: false, error: 'Validation failed to run' });
    }
  };

  if (!offlineFirstEnabled) {
    return (
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Offline-First Phase 2 Demo</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">
            Offline-first functionality is disabled. Enable it in the feature flags panel.
          </p>
          <Button 
            onClick={() => featureFlagsService.enableDevelopmentMode()}
            className="mt-4"
          >
            Enable Development Mode
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-red-600">Initialization Error</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-600">{error.message}</p>
          <Button 
            onClick={() => window.location.reload()}
            className="mt-4"
          >
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (isInitializing) {
    return (
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Initializing Phase 2...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
            <span>Setting up offline-first services...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full max-w-4xl space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>🚀 Offline-First Phase 2 Demo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <h4 className="font-semibold">Initialization</h4>
              <Badge variant={isInitialized ? "default" : "secondary"}>
                {isInitialized ? "Ready" : "Not Ready"}
              </Badge>
            </div>
            <div>
              <h4 className="font-semibold">Connection</h4>
              <Badge variant={syncState.isOnline ? "default" : "destructive"}>
                {syncState.isOnline ? "Online" : "Offline"}
              </Badge>
            </div>
            <div>
              <h4 className="font-semibold">Sync Status</h4>
              <Badge variant={
                syncState.status === 'synced' ? 'default' :
                syncState.status === 'syncing' ? 'secondary' :
                syncState.status === 'error' ? 'destructive' : 'outline'
              }>
                {syncState.status}
              </Badge>
            </div>
          </div>

          {syncState.pendingOperations > 0 && (
            <div className="bg-yellow-50 p-3 rounded-lg border">
              <p className="text-yellow-800">
                📤 {syncState.pendingOperations} operations pending sync
              </p>
            </div>
          )}

          {syncState.lastSyncAt && (
            <div className="bg-green-50 p-3 rounded-lg border">
              <p className="text-green-800">
                ✅ Last synced: {syncState.lastSyncAt.toLocaleString()}
              </p>
            </div>
          )}

          <div className="flex space-x-2">
            <Button onClick={runPhase2Test}>
              Run Phase 2 Test
            </Button>
            <Button onClick={runValidation} variant="outline">
              Validate Implementation
            </Button>
            <Button 
              onClick={() => syncService.forcSync()} 
              variant="outline"
              disabled={!syncState.isOnline}
            >
              Force Sync
            </Button>
          </div>
        </CardContent>
      </Card>

      {testResults && (
        <Card>
          <CardHeader>
            <CardTitle>
              Test Results {testResults.success ? '✅' : '❌'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-gray-100 p-4 rounded-lg overflow-auto text-sm">
              {JSON.stringify(testResults, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
};