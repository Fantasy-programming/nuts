/**
 * Offline-First Authentication Service
 * 
 * Handles authentication in offline mode with secure refresh token storage
 * and smart token management for sync operations.
 */

import { connectivityService } from './connectivity.service';
import { featureFlagsService } from './feature-flags.service';
import { authService } from '@/features/auth/services/auth';
import { userService } from '@/features/preferences/services/user';
import { useAuthStore } from '@/features/auth/stores/auth.store';
import type { AuthNullable } from '@/features/auth/services/auth.types';

export interface CachedAuthState {
  user: AuthNullable;
  isAuthenticated: boolean;
  lastValidated: Date;
  expiresAt: Date | null;
  accessToken?: string;
  accessTokenExpiresAt?: Date;
}

export interface SecureTokenStorage {
  refreshToken: string;
  refreshTokenExpiresAt: Date | null; // null = non-expiring
  deviceId: string;
  lastUsed: Date;
}

class OfflineAuthService {
  private readonly STORAGE_KEY = 'nuts-offline-auth';
  private readonly SECURE_TOKEN_KEY = 'nuts-secure-tokens';
  private readonly CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days for offline auth
  private readonly ACCESS_TOKEN_DURATION = 15 * 60 * 1000; // 15 minutes for access token
  
  private deviceId: string;

  constructor() {
    // Generate or retrieve persistent device ID
    this.deviceId = this.getOrCreateDeviceId();
  }

  /**
   * Initialize offline auth service
   */
  async initialize(): Promise<void> {
    console.log('🔐 Initializing offline auth service...');

    // In fully offline mode, skip all server validation
    if (featureFlagsService.isEnabled('fully-offline-mode')) {
      console.log('🔒 Fully offline mode enabled - skipping auth validation');
      const cachedAuth = this.getCachedAuthState();
      if (cachedAuth && this.isCachedAuthValid(cachedAuth)) {
        useAuthStore.getState().setUser(cachedAuth.user);
        useAuthStore.getState().setAuthenticated(true);
        console.log('✅ Restored offline auth state from cache');
      }
      return;
    }

    // Check if we have cached auth state
    const cachedAuth = this.getCachedAuthState();
    
    if (cachedAuth && this.isCachedAuthValid(cachedAuth)) {
      // Restore auth state from cache
      useAuthStore.getState().setUser(cachedAuth.user);
      useAuthStore.getState().setAuthenticated(cachedAuth.isAuthenticated);
      console.log('✅ Restored auth state from cache');
    }

    // If online, try to validate or refresh with server
    if (connectivityService.hasServerAccess()) {
      try {
        await this.validateOrRefreshWithServer();
      } catch (error) {
        console.warn('Failed to validate auth with server, using cached state:', error);
        // If server validation fails but we have valid cached auth, continue offline
        if (cachedAuth && this.isCachedAuthValid(cachedAuth)) {
          console.log('🔄 Continuing with cached auth due to server validation failure');
        } else {
          // No valid cached auth and server failed - need fresh login
          this.clearAllAuthData();
          useAuthStore.getState().resetState();
        }
      }
    }
  }

  /**
   * Login with offline fallback
   */
  async login(credentials: any): Promise<any> {
    // In fully offline mode, don't allow new logins
    if (featureFlagsService.isEnabled('fully-offline-mode')) {
      throw new Error('Cannot login in fully offline mode - please disable offline mode for authentication');
    }

    if (connectivityService.hasServerAccess()) {
      // Online: use server login
      try {
        const response = await authService.login(credentials);
        
        // Cache successful auth state
        const user = await userService.getMe();
        await this.cacheAuthState({
          user,
          isAuthenticated: true,
          lastValidated: new Date(),
          expiresAt: new Date(Date.now() + this.CACHE_DURATION),
          accessToken: response.data?.access_token,
          accessTokenExpiresAt: new Date(Date.now() + this.ACCESS_TOKEN_DURATION)
        });

        // Store refresh token securely if provided
        if (response.data?.refresh_token) {
          await this.storeSecureTokens({
            refreshToken: response.data.refresh_token,
            refreshTokenExpiresAt: null, // Non-expiring as requested
            deviceId: this.deviceId,
            lastUsed: new Date()
          });
        }

        return response;
      } catch (error) {
        throw error;
      }
    } else {
      // Offline: check if we have cached credentials (for development/testing)
      throw new Error('Cannot login while offline - server connectivity required for authentication');
    }
  }

  /**
   * Logout with offline handling
   */
  async logout(): Promise<void> {
    // Clear all cached auth data
    this.clearAllAuthData();

    // Only attempt server logout if not in fully offline mode and server is accessible
    if (!featureFlagsService.isEnabled('fully-offline-mode') && connectivityService.hasServerAccess()) {
      try {
        await authService.logout();
      } catch (error) {
        console.warn('Failed to logout from server, cleared local state:', error);
      }
    }

    // Always clear local auth state
    useAuthStore.getState().resetState();
  }

  /**
   * Refresh auth token with offline fallback and smart token management
   */
  async refresh(): Promise<void> {
    // In fully offline mode, skip refresh and use cached auth
    if (featureFlagsService.isEnabled('fully-offline-mode')) {
      const cachedAuth = this.getCachedAuthState();
      if (!cachedAuth || !this.isCachedAuthValid(cachedAuth)) {
        throw new Error('No valid cached authentication available in offline mode');
      }
      return; // Continue with cached auth
    }

    if (connectivityService.hasServerAccess()) {
      try {
        // Try to use stored refresh token if access token expired
        const cachedAuth = this.getCachedAuthState();
        const secureTokens = await this.getSecureTokens();
        
        if (this.isAccessTokenExpired(cachedAuth) && secureTokens?.refreshToken) {
          // Use refresh token to get new access token
          await this.refreshUsingStoredToken(secureTokens);
        } else {
          // Use existing auth service refresh
          await authService.refresh();
        }
        
        // Update cached auth state
        const user = await userService.getMe();
        await this.cacheAuthState({
          user,
          isAuthenticated: true,
          lastValidated: new Date(),
          expiresAt: new Date(Date.now() + this.CACHE_DURATION),
          accessToken: cachedAuth?.accessToken, // Keep existing token if refresh succeeded
          accessTokenExpiresAt: new Date(Date.now() + this.ACCESS_TOKEN_DURATION)
        });
      } catch (error) {
        // If refresh fails, check if we have valid cached auth
        const cachedAuth = this.getCachedAuthState();
        if (!cachedAuth || !this.isCachedAuthValid(cachedAuth)) {
          // No valid cached auth, need to logout
          this.clearAllAuthData();
          useAuthStore.getState().resetState();
          throw error;
        }
        // Otherwise, continue with cached auth
        console.warn('Auth refresh failed, using cached auth state:', error);
      }
    } else {
      // Offline: validate cached auth state
      const cachedAuth = this.getCachedAuthState();
      if (!cachedAuth || !this.isCachedAuthValid(cachedAuth)) {
        throw new Error('No valid cached authentication available');
      }
      // Cached auth is valid, continue
    }
  }

  /**
   * Check if user is authenticated (works offline)
   */
  isAuthenticated(): boolean {
    // In fully offline mode, always check cached auth only
    if (featureFlagsService.isEnabled('fully-offline-mode')) {
      const cachedAuth = this.getCachedAuthState();
      return cachedAuth ? this.isCachedAuthValid(cachedAuth) && cachedAuth.isAuthenticated : false;
    }

    const currentAuth = useAuthStore.getState().isAuthenticated;
    
    if (connectivityService.hasServerAccess()) {
      return currentAuth;
    } else {
      // Offline: check cached auth
      const cachedAuth = this.getCachedAuthState();
      return cachedAuth ? this.isCachedAuthValid(cachedAuth) && cachedAuth.isAuthenticated : false;
    }
  }

  /**
   * Get current user (works offline)
   */
  getCurrentUser(): AuthNullable {
    // In fully offline mode, always use cached data
    if (featureFlagsService.isEnabled('fully-offline-mode')) {
      const cachedAuth = this.getCachedAuthState();
      return (cachedAuth && this.isCachedAuthValid(cachedAuth)) ? cachedAuth.user : null;
    }

    const currentUser = useAuthStore.getState().user;
    
    if (connectivityService.hasServerAccess()) {
      return currentUser;
    } else {
      // Offline: get from cache
      const cachedAuth = this.getCachedAuthState();
      return (cachedAuth && this.isCachedAuthValid(cachedAuth)) ? cachedAuth.user : null;
    }
  }

  /**
   * Check if we can perform sync operations (requires valid tokens when online)
   */
  canSync(): boolean {
    // In fully offline mode, no sync allowed
    if (featureFlagsService.isEnabled('fully-offline-mode')) {
      return false;
    }

    // If offline, no sync possible
    if (!connectivityService.hasServerAccess()) {
      return false;
    }

    // Online: check if we have valid authentication for sync
    const cachedAuth = this.getCachedAuthState();
    return cachedAuth && this.isCachedAuthValid(cachedAuth) && cachedAuth.isAuthenticated;
  }

  /**
   * Get access token for API calls (only when sync is allowed)
   */
  async getAccessTokenForSync(): Promise<string | null> {
    if (!this.canSync()) {
      return null;
    }

    const cachedAuth = this.getCachedAuthState();
    
    // If access token is expired, try to refresh
    if (this.isAccessTokenExpired(cachedAuth)) {
      try {
        await this.refresh();
        const updatedAuth = this.getCachedAuthState();
        return updatedAuth?.accessToken || null;
      } catch (error) {
        console.warn('Failed to refresh access token for sync:', error);
        return null;
      }
    }

    return cachedAuth?.accessToken || null;
  }

  /**
   * Validate auth state with server or refresh using stored tokens
   */
  private async validateOrRefreshWithServer(): Promise<void> {
    try {
      const user = await userService.getMe();
      
      // Update cached auth state
      const cachedAuth = this.getCachedAuthState();
      await this.cacheAuthState({
        user,
        isAuthenticated: true,
        lastValidated: new Date(),
        expiresAt: new Date(Date.now() + this.CACHE_DURATION),
        accessToken: cachedAuth?.accessToken,
        accessTokenExpiresAt: cachedAuth?.accessTokenExpiresAt
      });

      // Update store
      useAuthStore.getState().setUser(user);
      useAuthStore.getState().setAuthenticated(true);
      
    } catch (error) {
      // If validation fails, try refresh with stored tokens
      const secureTokens = await this.getSecureTokens();
      if (secureTokens?.refreshToken) {
        try {
          await this.refreshUsingStoredToken(secureTokens);
          return;
        } catch (refreshError) {
          console.warn('Both validation and refresh failed:', error, refreshError);
        }
      }
      
      // If everything fails, clear auth state
      this.clearAllAuthData();
      useAuthStore.getState().resetState();
      throw error;
    }
  }

  /**
   * Refresh authentication using stored refresh token
   */
  private async refreshUsingStoredToken(tokens: SecureTokenStorage): Promise<void> {
    try {
      // This would make a call to the refresh endpoint with the stored refresh token
      // For now, we'll use the existing refresh method and assume it handles refresh tokens
      await authService.refresh();
      
      // Update last used timestamp
      await this.storeSecureTokens({
        ...tokens,
        lastUsed: new Date()
      });
      
    } catch (error) {
      // If refresh token is invalid, clear it
      await this.clearSecureTokens();
      throw error;
    }
  }

  /**
   * Check if access token is expired
   */
  private isAccessTokenExpired(auth: CachedAuthState | null): boolean {
    if (!auth?.accessTokenExpiresAt) return true;
    return new Date() >= auth.accessTokenExpiresAt;
  }

  /**
   * Cache authentication state
   */
  private async cacheAuthState(authState: CachedAuthState): Promise<void> {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify({
        ...authState,
        lastValidated: authState.lastValidated.toISOString(),
        expiresAt: authState.expiresAt?.toISOString(),
        accessTokenExpiresAt: authState.accessTokenExpiresAt?.toISOString()
      }));
    } catch (error) {
      console.warn('Failed to cache auth state:', error);
    }
  }

  /**
   * Store refresh tokens securely using IndexedDB for larger storage
   */
  private async storeSecureTokens(tokens: SecureTokenStorage): Promise<void> {
    try {
      // For now, use localStorage with encryption-like encoding
      // In production, this should use IndexedDB with proper encryption
      const encoded = btoa(JSON.stringify({
        ...tokens,
        refreshTokenExpiresAt: tokens.refreshTokenExpiresAt?.toISOString(),
        lastUsed: tokens.lastUsed.toISOString()
      }));
      localStorage.setItem(this.SECURE_TOKEN_KEY, encoded);
    } catch (error) {
      console.warn('Failed to store secure tokens:', error);
    }
  }

  /**
   * Get stored secure tokens
   */
  private async getSecureTokens(): Promise<SecureTokenStorage | null> {
    try {
      const encoded = localStorage.getItem(this.SECURE_TOKEN_KEY);
      if (!encoded) return null;

      const decoded = JSON.parse(atob(encoded));
      return {
        ...decoded,
        refreshTokenExpiresAt: decoded.refreshTokenExpiresAt ? new Date(decoded.refreshTokenExpiresAt) : null,
        lastUsed: new Date(decoded.lastUsed)
      };
    } catch (error) {
      console.warn('Failed to load secure tokens:', error);
      return null;
    }
  }

  /**
   * Clear secure tokens
   */
  private async clearSecureTokens(): Promise<void> {
    try {
      localStorage.removeItem(this.SECURE_TOKEN_KEY);
    } catch (error) {
      console.warn('Failed to clear secure tokens:', error);
    }
  }

  /**
   * Get cached authentication state
   */
  private getCachedAuthState(): CachedAuthState | null {
    try {
      const cached = localStorage.getItem(this.STORAGE_KEY);
      if (!cached) return null;

      const parsed = JSON.parse(cached);
      return {
        ...parsed,
        lastValidated: new Date(parsed.lastValidated),
        expiresAt: parsed.expiresAt ? new Date(parsed.expiresAt) : null,
        accessTokenExpiresAt: parsed.accessTokenExpiresAt ? new Date(parsed.accessTokenExpiresAt) : undefined
      };
    } catch (error) {
      console.warn('Failed to load cached auth state:', error);
      return null;
    }
  }

  /**
   * Check if cached auth state is still valid
   */
  private isCachedAuthValid(cachedAuth: CachedAuthState): boolean {
    if (!cachedAuth.expiresAt) return false;
    return new Date() < cachedAuth.expiresAt;
  }

  /**
   * Get or create persistent device ID
   */
  private getOrCreateDeviceId(): string {
    const existing = localStorage.getItem('nuts-device-id');
    if (existing) return existing;
    
    const newId = crypto.randomUUID();
    localStorage.setItem('nuts-device-id', newId);
    return newId;
  }

  /**
   * Clear all authentication data
   */
  private clearAllAuthData(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
      this.clearSecureTokens();
    } catch (error) {
      console.warn('Failed to clear auth data:', error);
    }
  }

  /**
   * Check if auth cache is about to expire (within 1 hour)
   */
  isAuthCacheExpiringSoon(): boolean {
    const cachedAuth = this.getCachedAuthState();
    if (!cachedAuth || !cachedAuth.expiresAt) return false;
    
    const oneHourFromNow = new Date(Date.now() + 60 * 60 * 1000);
    return cachedAuth.expiresAt < oneHourFromNow;
  }

  /**
   * Clear all offline auth data (for logout/reset)
   */
  clear(): void {
    this.clearAllAuthData();
  }
}

// Export singleton instance
export const offlineAuthService = new OfflineAuthService();