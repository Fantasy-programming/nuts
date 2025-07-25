/**
 * Connectivity Detection Service
 * 
 * Handles detection of network connectivity and determines if the app
 * should operate in fully offline mode.
 */

import { featureFlagsService } from './feature-flags.service';

export type ConnectivityStatus = 'online' | 'offline' | 'fully-offline';

export interface ConnectivityState {
  status: ConnectivityStatus;
  isOnline: boolean;
  hasServerAccess: boolean;
  lastServerCheck: Date | null;
}

class ConnectivityService {
  private state: ConnectivityState = {
    status: 'offline',
    isOnline: navigator.onLine,
    hasServerAccess: false,
    lastServerCheck: null
  };

  private listeners: Set<(state: ConnectivityState) => void> = new Set();
  private checkInterval: NodeJS.Timeout | null = null;
  private serverCheckUrl = '/auth/sessions'; // Use existing auth endpoint instead of health

  constructor() {
    this.setupOnlineStatusListener();
    this.startPeriodicServerCheck();
    this.setupFeatureFlagListener();
  }

  /**
   * Get current connectivity state
   */
  getState(): ConnectivityState {
    return { ...this.state };
  }

  /**
   * Check if we're in fully offline mode
   */
  isFullyOffline(): boolean {
    return this.state.status === 'fully-offline';
  }

  /**
   * Check if we have server access
   */
  hasServerAccess(): boolean {
    return this.state.hasServerAccess;
  }

  /**
   * Subscribe to connectivity changes
   */
  subscribe(listener: (state: ConnectivityState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Force fully offline mode (for testing or when user wants to work offline)
   */
  setFullyOfflineMode(enabled: boolean): void {
    if (enabled) {
      this.updateState({
        status: 'fully-offline',
        hasServerAccess: false
      });
    } else {
      // Re-check connectivity when coming out of fully offline mode
      this.checkServerConnectivity();
    }
  }

  /**
   * Setup browser online/offline event listeners
   */
  private setupOnlineStatusListener(): void {
    const updateOnlineStatus = () => {
      const isOnline = navigator.onLine;
      this.updateState({ isOnline });
      
      if (isOnline) {
        // When coming back online, check server connectivity
        this.checkServerConnectivity();
      } else {
        // When going offline, update status immediately
        this.updateState({
          status: 'offline',
          hasServerAccess: false
        });
      }
    };

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    // Initial check
    updateOnlineStatus();
  }

  /**
   * Start periodic server connectivity checks
   */
  private startPeriodicServerCheck(): void {
    // Check immediately
    this.checkServerConnectivity();

    // Check every 30 seconds
    this.checkInterval = setInterval(() => {
      this.checkServerConnectivity();
    }, 30000);
  }

  /**
   * Stop periodic server checks
   */
  stopPeriodicChecks(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  /**
   * Check if the server is accessible
   */
  private async checkServerConnectivity(): Promise<void> {
    if (!this.state.isOnline) {
      this.updateState({
        status: 'offline',
        hasServerAccess: false
      });
      return;
    }

    try {
      // Try a simple fetch to check server connectivity
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      const response = await fetch(this.serverCheckUrl, {
        method: 'HEAD',
        signal: controller.signal,
        cache: 'no-cache'
      });

      clearTimeout(timeoutId);

      const hasServerAccess = response.ok || response.status === 404; // 404 is ok, means server is reachable
      
      this.updateState({
        status: hasServerAccess ? 'online' : 'offline',
        hasServerAccess,
        lastServerCheck: new Date()
      });

    } catch (error) {
      // Server is not accessible
      this.updateState({
        status: 'offline',
        hasServerAccess: false,
        lastServerCheck: new Date()
      });
    }
  }

  /**
   * Update connectivity state and notify listeners
   */
  private updateState(updates: Partial<ConnectivityState>): void {
    const previousStatus = this.state.status;
    this.state = { ...this.state, ...updates };

    // Log status changes
    if (previousStatus !== this.state.status) {
      console.log(`🌐 Connectivity status changed: ${previousStatus} → ${this.state.status}`);
    }

    // Notify listeners
    this.listeners.forEach(listener => {
      try {
        listener(this.state);
      } catch (error) {
        console.error('Error in connectivity listener:', error);
      }
    });
  }

  /**
   * Manual connectivity check (for user-triggered refresh)
   */
  async refreshConnectivity(): Promise<ConnectivityState> {
    await this.checkServerConnectivity();
    return this.getState();
  }

  /**
   * Setup feature flag listener for fully offline mode
   */
  private setupFeatureFlagListener(): void {
    // Check initially and when feature flags change
    this.checkFullyOfflineMode();
    
    // Listen for storage events to detect feature flag changes
    window.addEventListener('storage', (event) => {
      if (event.key === 'nuts-feature-flags') {
        this.checkFullyOfflineMode();
      }
    });
  }

  /**
   * Check if fully offline mode is enabled and update state accordingly
   */
  private checkFullyOfflineMode(): void {
    if (featureFlagsService.isFullyOfflineModeEnabled()) {
      this.updateState({
        status: 'fully-offline',
        hasServerAccess: false
      });
    } else if (this.state.status === 'fully-offline') {
      // When fully offline mode is disabled, re-check connectivity
      this.checkServerConnectivity();
    }
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.stopPeriodicChecks();
    this.listeners.clear();
  }
}

// Export singleton instance
export const connectivityService = new ConnectivityService();