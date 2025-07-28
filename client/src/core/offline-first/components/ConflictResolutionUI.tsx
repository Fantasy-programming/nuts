/**
 * Conflict Resolution UI Component
 * 
 * Displays sync conflicts and provides resolution options for users.
 * This is a basic implementation for Phase 3.
 */

import { useState, useEffect } from 'react';
import { syncService, type SyncConflict } from '../services/sync.service';
import { featureFlagsService } from '../services/feature-flags.service';
import { X, AlertTriangle, Check, RefreshCw } from 'lucide-react';

interface ConflictResolutionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  conflicts: SyncConflict[];
}

export function ConflictResolutionDialog({ isOpen, onClose, conflicts }: ConflictResolutionDialogProps) {
  const [resolving, setResolving] = useState<string | null>(null);

  if (!isOpen || conflicts.length === 0) return null;

  const handleResolveConflict = async (conflictId: string, resolution: 'local' | 'server' | 'merge') => {
    setResolving(conflictId);
    try {
      await syncService.resolveConflict(conflictId, resolution);
      console.log(`Resolved conflict ${conflictId} with ${resolution} version`);
    } catch (error) {
      console.error('Failed to resolve conflict:', error);
    } finally {
      setResolving(null);
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    return new Date(timestamp).toLocaleString();
  };

  const getConflictTitle = (conflict: SyncConflict) => {
    const type = conflict.type.charAt(0).toUpperCase() + conflict.type.slice(1);
    const name = conflict.localVersion?.name || conflict.serverVersion?.name || 'Unknown';
    return `${type}: ${name}`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-orange-500" />
            <h2 className="text-xl font-semibold text-gray-900">
              Sync Conflicts ({conflicts.length})
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          <div className="space-y-6">
            {conflicts.map((conflict) => (
              <div key={conflict.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium text-gray-900">
                    {getConflictTitle(conflict)}
                  </h3>
                  <span className="text-sm text-gray-500">
                    {formatTimestamp(conflict.timestamp)}
                  </span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
                  {/* Local Version */}
                  <div className="border border-blue-200 rounded-lg p-3 bg-blue-50">
                    <h4 className="font-medium text-blue-900 mb-2">Your Local Version</h4>
                    <div className="text-sm text-blue-800 space-y-1">
                      {conflict.localVersion?.name && (
                        <div><span className="font-medium">Name:</span> {conflict.localVersion.name}</div>
                      )}
                      {conflict.localVersion?.amount && (
                        <div><span className="font-medium">Amount:</span> ${conflict.localVersion.amount}</div>
                      )}
                      {conflict.localVersion?.updated_at && (
                        <div><span className="font-medium">Updated:</span> {formatTimestamp(new Date(conflict.localVersion.updated_at))}</div>
                      )}
                    </div>
                  </div>

                  {/* Server Version */}
                  <div className="border border-green-200 rounded-lg p-3 bg-green-50">
                    <h4 className="font-medium text-green-900 mb-2">Server Version</h4>
                    <div className="text-sm text-green-800 space-y-1">
                      {conflict.serverVersion?.name && (
                        <div><span className="font-medium">Name:</span> {conflict.serverVersion.name}</div>
                      )}
                      {conflict.serverVersion?.amount && (
                        <div><span className="font-medium">Amount:</span> ${conflict.serverVersion.amount}</div>
                      )}
                      {conflict.serverVersion?.updated_at && (
                        <div><span className="font-medium">Updated:</span> {formatTimestamp(new Date(conflict.serverVersion.updated_at))}</div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Resolution Buttons */}
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => handleResolveConflict(conflict.id, 'local')}
                    disabled={resolving === conflict.id}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {resolving === conflict.id ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Check className="w-4 h-4" />
                    )}
                    Keep Local
                  </button>
                  
                  <button
                    onClick={() => handleResolveConflict(conflict.id, 'server')}
                    disabled={resolving === conflict.id}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {resolving === conflict.id ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Check className="w-4 h-4" />
                    )}
                    Use Server
                  </button>
                  
                  <button
                    onClick={() => handleResolveConflict(conflict.id, 'merge')}
                    disabled={resolving === conflict.id}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {resolving === conflict.id ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Check className="w-4 h-4" />
                    )}
                    Auto-Merge
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function ConflictResolutionIndicator() {
  const [conflicts, setConflicts] = useState<SyncConflict[]>([]);
  const [showDialog, setShowDialog] = useState(false);

  useEffect(() => {
    // Only show if sync is enabled
    if (!featureFlagsService.useSyncEnabled()) return;

    const updateConflicts = () => {
      const currentConflicts = syncService.getConflicts();
      setConflicts(currentConflicts);
    };

    // Initial load
    updateConflicts();

    // Listen for sync state changes
    const unsubscribe = syncService.subscribe(() => {
      updateConflicts();
    });

    return unsubscribe;
  }, []);

  if (conflicts.length === 0) return null;

  return (
    <>
      <div className="fixed bottom-20 right-4 z-40">
        <button
          onClick={() => setShowDialog(true)}
          className="flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-orange-600 transition-colors animate-pulse"
        >
          <AlertTriangle className="w-5 h-5" />
          <span className="font-medium">
            {conflicts.length} Sync Conflict{conflicts.length > 1 ? 's' : ''}
          </span>
        </button>
      </div>

      <ConflictResolutionDialog
        isOpen={showDialog}
        onClose={() => setShowDialog(false)}
        conflicts={conflicts}
      />
    </>
  );
}