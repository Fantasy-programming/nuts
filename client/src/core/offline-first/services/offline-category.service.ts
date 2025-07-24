/**
 * Offline-First Category Service
 * 
 * Provides the same API as the server-based category service but operates
 * on local CRDT data. This service can be swapped in place of the server
 * service using feature flags.
 */

import { crdtService } from './crdt.service';
import { sqliteIndexService } from './sqlite-index.service';
import { CRDTCategory } from '../types/crdt-schema';
import { Category, CategoryCreate } from '@/features/categories/services/category.types';
import { v4 as uuidv4 } from 'uuid';

class OfflineFirstCategoryService {
  private isInitialized = false;
  
  /**
   * Initialize the offline-first category service
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    try {
      await crdtService.initialize();
      await sqliteIndexService.initialize();
      
      this.isInitialized = true;
      console.log('Offline-first category service initialized');
    } catch (error) {
      console.error('Failed to initialize offline-first category service:', error);
      throw error;
    }
  }
  
  /**
   * Ensure the service is initialized
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }
  }
  
  /**
   * Get all categories
   */
  async getCategories(): Promise<Category[]> {
    await this.ensureInitialized();
    
    try {
      const crdtCategories = crdtService.getCategories();
      
      // Convert CRDT categories to API format
      const categories = Object.values(crdtCategories).map(category => 
        this.convertFromCRDTFormat(category)
      );
      
      // Sort by name for consistency
      return categories.sort((a, b) => a.name.localeCompare(b.name));
    } catch (error) {
      console.error('Failed to get categories:', error);
      throw error;
    }
  }
  
  /**
   * Create a new category
   */
  async createCategory(categoryData: CategoryCreate): Promise<Category> {
    await this.ensureInitialized();
    
    try {
      const id = uuidv4();
      const crdtCategory = this.convertToCRDTFormat({
        ...categoryData,
        id,
        is_default: false,
        updated_at: new Date().toISOString()
      });
      
      await crdtService.createCategory(crdtCategory);
      
      console.log('Created category:', id);
      return this.convertFromCRDTFormat(crdtCategory);
    } catch (error) {
      console.error('Failed to create category:', error);
      throw error;
    }
  }
  
  /**
   * Update an existing category
   */
  async updateCategory(id: string, categoryData: CategoryCreate): Promise<Category> {
    await this.ensureInitialized();
    
    try {
      const crdtUpdates = this.convertToCRDTFormat({
        ...categoryData,
        id,
        is_default: false,
        updated_at: new Date().toISOString()
      });
      
      // Remove the id since we're updating
      const { id: _, ...updates } = crdtUpdates;
      
      await crdtService.updateCategory(id, updates);
      
      // Get the updated category
      const categories = crdtService.getCategories();
      const updatedCategory = categories[id];
      
      if (!updatedCategory) {
        throw new Error(`Category with ID ${id} not found`);
      }
      
      console.log('Updated category:', id);
      return this.convertFromCRDTFormat(updatedCategory);
    } catch (error) {
      console.error('Failed to update category:', error);
      throw error;
    }
  }
  
  /**
   * Delete a category (soft delete)
   */
  async deleteCategory(id: string): Promise<void> {
    await this.ensureInitialized();
    
    try {
      const timestamp = new Date().toISOString();
      await crdtService.updateCategory(id, { 
        deleted_at: timestamp,
        updated_at: timestamp 
      });
      
      console.log('Deleted category:', id);
    } catch (error) {
      console.error('Failed to delete category:', error);
      throw error;
    }
  }
  
  /**
   * Convert CRDT category format to API format
   */
  private convertFromCRDTFormat(crdtCategory: CRDTCategory): Category {
    return {
      id: crdtCategory.id,
      name: crdtCategory.name,
      parent_id: crdtCategory.parent_id || null,
      is_default: false, // CRDT schema doesn't have is_default, default to false
      updated_at: crdtCategory.updated_at,
      icon: crdtCategory.icon || '',
      color: crdtCategory.color || null
    };
  }
  
  /**
   * Convert API category format to CRDT format
   */
  private convertToCRDTFormat(category: any): CRDTCategory {
    return {
      id: category.id,
      name: category.name,
      color: category.color || '#000000',
      icon: category.icon || '',
      parent_id: category.parent_id || undefined,
      is_active: true,
      created_at: category.created_at || new Date().toISOString(),
      updated_at: category.updated_at || new Date().toISOString()
    };
  }
}

// Add missing updateCategory method to CRDTService if it doesn't exist
// We'll check this and add it if needed

// Export singleton instance
export const offlineFirstCategoryService = new OfflineFirstCategoryService();