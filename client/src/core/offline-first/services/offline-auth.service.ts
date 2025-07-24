/**
 * Offline-First Authentication Service
 * 
 * Handles authentication in offline mode by caching auth state
 * and validating it without server calls when offline.
 */

import { connectivityService } from './connectivity.service';
import { authService } from '@/features/auth/services/auth';
import { userService } from '@/features/preferences/services/user';
import { useAuthStore } from '@/features/auth/stores/auth.store';
import type { AuthNullable } from '@/features/auth/services/auth.types';

export interface CachedAuthState {
  user: AuthNullable;
  isAuthenticated: boolean;
  lastValidated: Date;
  expiresAt: Date | null;
}

class OfflineAuthService {
  private readonly STORAGE_KEY = 'nuts-offline-auth';
  private readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

  /**
   * Initialize offline auth service
   */
  async initialize(): Promise<void> {
    console.log('🔐 Initializing offline auth service...');

    // Check if we have cached auth state
    const cachedAuth = this.getCachedAuthState();
    
    if (cachedAuth && this.isCachedAuthValid(cachedAuth)) {
      // Restore auth state from cache
      useAuthStore.getState().setUser(cachedAuth.user);
      useAuthStore.getState().setAuthenticated(cachedAuth.isAuthenticated);
      console.log('✅ Restored auth state from cache');
    }

    // If online, try to validate with server
    if (connectivityService.hasServerAccess()) {
      try {
        await this.validateWithServer();
      } catch (error) {
        console.warn('Failed to validate auth with server, using cached state:', error);
      }
    }
  }

  /**
   * Login with offline fallback
   */
  async login(credentials: any): Promise<any> {
    if (connectivityService.hasServerAccess()) {
      // Online: use server login
      try {
        const response = await authService.login(credentials);
        
        // Cache successful auth state
        const user = await userService.getMe();
        this.cacheAuthState({
          user,
          isAuthenticated: true,
          lastValidated: new Date(),
          expiresAt: new Date(Date.now() + this.CACHE_DURATION)
        });

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
    // Clear cached auth state
    this.clearCachedAuthState();

    if (connectivityService.hasServerAccess()) {
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
   * Refresh auth token with offline fallback
   */
  async refresh(): Promise<void> {
    if (connectivityService.hasServerAccess()) {
      try {
        await authService.refresh();
        
        // Update cached auth state
        const user = await userService.getMe();
        this.cacheAuthState({
          user,
          isAuthenticated: true,
          lastValidated: new Date(),
          expiresAt: new Date(Date.now() + this.CACHE_DURATION)
        });
      } catch (error) {
        // If refresh fails, check if we have valid cached auth
        const cachedAuth = this.getCachedAuthState();
        if (!cachedAuth || !this.isCachedAuthValid(cachedAuth)) {
          // No valid cached auth, need to logout
          this.clearCachedAuthState();
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
   * Validate auth state with server (when online)
   */
  private async validateWithServer(): Promise<void> {
    try {
      const user = await userService.getMe();
      
      // Update cached auth state
      this.cacheAuthState({
        user,
        isAuthenticated: true,
        lastValidated: new Date(),
        expiresAt: new Date(Date.now() + this.CACHE_DURATION)
      });

      // Update store
      useAuthStore.getState().setUser(user);
      useAuthStore.getState().setAuthenticated(true);
      
    } catch (error) {
      // If server validation fails, clear auth state
      this.clearCachedAuthState();
      useAuthStore.getState().resetState();
      throw error;
    }
  }

  /**
   * Cache authentication state
   */
  private cacheAuthState(authState: CachedAuthState): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify({
        ...authState,
        lastValidated: authState.lastValidated.toISOString(),
        expiresAt: authState.expiresAt?.toISOString()
      }));
    } catch (error) {
      console.warn('Failed to cache auth state:', error);
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
        expiresAt: parsed.expiresAt ? new Date(parsed.expiresAt) : null
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
   * Clear cached authentication state
   */
  private clearCachedAuthState(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch (error) {
      console.warn('Failed to clear cached auth state:', error);
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
    this.clearCachedAuthState();
  }
}

// Export singleton instance
export const offlineAuthService = new OfflineAuthService();