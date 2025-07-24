/**
 * Adaptive Category Service
 * 
 * This service acts as a proxy that routes requests to either the server-based
 * category service or the offline-first service based on feature flags.
 * This allows for seamless switching between implementations during migration.
 */

import { featureFlagsService } from './feature-flags.service';
import { connectivityService } from './connectivity.service';
import { offlineFirstCategoryService } from './offline-category.service';
import * as serverCategoryService from '@/features/categories/services/category';
import { Category, CategoryCreate } from '@/features/categories/services/category.types';

class AdaptiveCategoryService {
  /**
   * Determine if we should use offline-first based on feature flags and connectivity
   */
  private shouldUseOfflineFirst(): boolean {
    try {
      // If fully offline mode is enabled, always use offline
      if (featureFlagsService?.isFullyOfflineModeEnabled?.()) {
        return true;
      }

      // If offline-first is disabled, never use offline
      if (!featureFlagsService?.useOfflineFirstCategories?.()) {
        return false;
      }

      // If we're in fully offline mode (no server access), use offline
      if (connectivityService?.isFullyOffline?.() || !connectivityService?.hasServerAccess?.()) {
        return true;
      }

      // Default to offline-first when feature flag is enabled and we have connectivity
      return true;
    } catch (error) {
      console.warn('Error in shouldUseOfflineFirst, defaulting to false:', error);
      return false;
    }
  }
  /**
   * Get all categories using the appropriate service based on feature flags
   */
  async getCategories(): Promise<Category[]> {
    if (this.shouldUseOfflineFirst()) {
      return offlineFirstCategoryService.getCategories();
    } else {
      return serverCategoryService.categoryService.getCategories();
    }
  }
  
  /**
   * Create a new category
   */
  async createCategory(category: CategoryCreate): Promise<Category> {
    if (this.shouldUseOfflineFirst()) {
      return offlineFirstCategoryService.createCategory(category);
    } else {
      return serverCategoryService.categoryService.createCategory(category);
    }
  }
  
  /**
   * Update an existing category
   */
  async updateCategory(id: string, category: CategoryCreate): Promise<Category> {
    if (this.shouldUseOfflineFirst()) {
      return offlineFirstCategoryService.updateCategory(id, category);
    } else {
      // Note: The server category service doesn't have an update method yet
      // This would need to be added to the server service in future
      throw new Error('Category update not implemented in server service');
    }
  }
  
  /**
   * Delete a category
   */
  async deleteCategory(id: string): Promise<void> {
    if (this.shouldUseOfflineFirst()) {
      return offlineFirstCategoryService.deleteCategory(id);
    } else {
      // Note: The server category service doesn't have a delete method yet
      // This would need to be added to the server service in future
      throw new Error('Category deletion not implemented in server service');
    }
  }
  
  /**
   * Initialize the appropriate service
   */
  async initialize(): Promise<void> {
    if (this.shouldUseOfflineFirst()) {
      await offlineFirstCategoryService.initialize();
      console.log('✅ Adaptive category service initialized with offline-first mode');
    } else {
      console.log('✅ Adaptive category service initialized with server mode');
    }
  }

  /**
   * Check if the service is using offline-first mode
   */
  isUsingOfflineFirst(): boolean {
    return this.shouldUseOfflineFirst();
  }
}

// Export singleton instance
export const adaptiveCategoryService = new AdaptiveCategoryService();