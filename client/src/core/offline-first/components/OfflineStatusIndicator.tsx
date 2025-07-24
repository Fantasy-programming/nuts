/**
 * Offline Status Indicator
 * 
 * Shows the current sync status and offline/online state
 */

import React, { useState, useEffect } from 'react';
import { syncService, SyncState } from '../services/sync.service';
import { featureFlagsService } from '../services/feature-flags.service';
import { Badge } from '@/core/components/ui/badge';
import { Button } from '@/core/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/core/components/ui/tooltip';
import { RefreshCw, Wifi, WifiOff, AlertTriangle, CheckCircle, Clock, X } from 'lucide-react';

export const OfflineStatusIndicator: React.FC = () => {
  const [syncState, setSyncState] = useState<SyncState>(syncService.getSyncState());
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const unsubscribe = syncService.subscribe(setSyncState);
    return unsubscribe;
  }, []);

  // Don't show if offline-first is not enabled
  if (!featureFlagsService.isEnabled('offline-first-enabled')) {
    return null;
  }

  const getStatusColor = (status: SyncState['status']) => {
    switch (status) {
      case 'synced': return 'bg-green-500';
      case 'syncing': return 'bg-blue-500';
      case 'offline': return 'bg-gray-500';
      case 'error': return 'bg-red-500';
      case 'conflict': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: SyncState['status']) => {
    switch (status) {
      case 'synced': return <CheckCircle className="h-4 w-4" />;
      case 'syncing': return <RefreshCw className="h-4 w-4 animate-spin" />;
      case 'offline': return <WifiOff className="h-4 w-4" />;
      case 'error': return <X className="h-4 w-4" />;
      case 'conflict': return <AlertTriangle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusText = (status: SyncState['status']) => {
    switch (status) {
      case 'synced': return 'Synced';
      case 'syncing': return 'Syncing...';
      case 'offline': return 'Offline';
      case 'error': return 'Sync Error';
      case 'conflict': return 'Conflicts';
      default: return 'Unknown';
    }
  };

  const handleManualSync = async () => {
    try {
      await syncService.forcSync();
    } catch (error) {
      console.error('Manual sync failed:', error);
    }
  };

  const conflicts = syncService.getConflicts();

  return (
    <TooltipProvider>
      <div className="fixed bottom-4 right-4 z-50">
        {!isExpanded ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsExpanded(true)}
                className="flex items-center gap-2 bg-white shadow-lg"
              >
                {syncState.isOnline ? (
                  <Wifi className="h-4 w-4 text-green-500" />
                ) : (
                  <WifiOff className="h-4 w-4 text-gray-500" />
                )}
                {getStatusIcon(syncState.status)}
                <span className="hidden sm:inline">{getStatusText(syncState.status)}</span>
                {syncState.pendingOperations > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {syncState.pendingOperations}
                  </Badge>
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">
              <div className="text-sm">
                <div>Status: {getStatusText(syncState.status)}</div>
                <div>Connection: {syncState.isOnline ? 'Online' : 'Offline'}</div>
                {syncState.pendingOperations > 0 && (
                  <div>Pending: {syncState.pendingOperations} operations</div>
                )}
                {syncState.lastSyncAt && (
                  <div>Last sync: {syncState.lastSyncAt.toLocaleTimeString()}</div>
                )}
                {conflicts.length > 0 && (
                  <div>Conflicts: {conflicts.length}</div>
                )}
              </div>
            </TooltipContent>
          </Tooltip>
        ) : (
          <div className="bg-white rounded-lg shadow-lg border p-4 min-w-[300px]">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold">Sync Status</h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${getStatusColor(syncState.status)}`} />
                <span className="text-sm font-medium">{getStatusText(syncState.status)}</span>
              </div>

              <div className="flex items-center gap-2">
                {syncState.isOnline ? (
                  <Wifi className="h-4 w-4 text-green-500" />
                ) : (
                  <WifiOff className="h-4 w-4 text-gray-500" />
                )}
                <span className="text-sm">{syncState.isOnline ? 'Online' : 'Offline'}</span>
              </div>

              {syncState.pendingOperations > 0 && (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-orange-500" />
                  <span className="text-sm">
                    {syncState.pendingOperations} pending operations
                  </span>
                </div>
              )}

              {syncState.lastSyncAt && (
                <div className="text-xs text-gray-500">
                  Last sync: {syncState.lastSyncAt.toLocaleString()}
                </div>
              )}

              {syncState.error && (
                <div className="text-xs text-red-500 bg-red-50 p-2 rounded">
                  {syncState.error}
                </div>
              )}

              {conflicts.length > 0 && (
                <div className="text-xs text-yellow-600 bg-yellow-50 p-2 rounded">
                  {conflicts.length} sync conflicts need resolution
                </div>
              )}
            </div>

            <div className="mt-3 pt-3 border-t">
              <Button
                size="sm"
                onClick={handleManualSync}
                disabled={!syncState.isOnline || syncState.status === 'syncing'}
                className="w-full"
              >
                {syncState.status === 'syncing' ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Syncing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Sync Now
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
};