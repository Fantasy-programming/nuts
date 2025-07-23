import { describe, it, expect, beforeEach } from 'vitest';
import { useSettingsStore } from '../settings.store';

describe('Settings Integration Tests', () => {
  beforeEach(() => {
    // Reset the store before each test
    useSettingsStore.setState({
      tags: [],
      categories: [],
      merchants: [],
      webhooks: [],
    });
  });

  describe('Complete workflow scenarios', () => {
    it('should handle a complete category management workflow', () => {
      const { addCategory, addSubcategory, updateCategory, updateSubcategory, deleteSubcategory, deleteCategory } = useSettingsStore.getState();
      
      // Add a category
      addCategory({ name: 'Food & Dining', icon: 'Utensils' });
      let state = useSettingsStore.getState();
      expect(state.categories).toHaveLength(1);
      const categoryId = state.categories[0].id;

      // Add subcategories
      addSubcategory(categoryId, 'Restaurants');
      addSubcategory(categoryId, 'Groceries');
      addSubcategory(categoryId, 'Coffee Shops');
      
      state = useSettingsStore.getState();
      expect(state.categories[0].subcategories).toHaveLength(3);

      // Update category name and icon
      updateCategory(categoryId, { name: 'Food & Beverages', icon: 'Coffee' });
      state = useSettingsStore.getState();
      expect(state.categories[0].name).toBe('Food & Beverages');
      expect(state.categories[0].icon).toBe('Coffee');

      // Update a subcategory
      const subcategoryId = state.categories[0].subcategories[0].id;
      updateSubcategory(categoryId, subcategoryId, 'Fine Dining');
      state = useSettingsStore.getState();
      expect(state.categories[0].subcategories[0].name).toBe('Fine Dining');

      // Delete a subcategory
      deleteSubcategory(categoryId, subcategoryId);
      state = useSettingsStore.getState();
      expect(state.categories[0].subcategories).toHaveLength(2);

      // Delete the entire category
      deleteCategory(categoryId);
      state = useSettingsStore.getState();
      expect(state.categories).toHaveLength(0);
    });

    it('should handle multiple categories with different subcategories', () => {
      const { addCategory, addSubcategory } = useSettingsStore.getState();
      
      // Add multiple categories
      addCategory({ name: 'Transportation', icon: 'Car' });
      addCategory({ name: 'Entertainment', icon: 'Music' });
      addCategory({ name: 'Shopping', icon: 'ShoppingCart' });

      let state = useSettingsStore.getState();
      expect(state.categories).toHaveLength(3);

      // Add subcategories to each
      const transportId = state.categories[0].id;
      const entertainmentId = state.categories[1].id;
      const shoppingId = state.categories[2].id;

      addSubcategory(transportId, 'Gas');
      addSubcategory(transportId, 'Public Transit');
      addSubcategory(entertainmentId, 'Movies');
      addSubcategory(entertainmentId, 'Concerts');
      addSubcategory(shoppingId, 'Clothing');
      addSubcategory(shoppingId, 'Electronics');

      state = useSettingsStore.getState();
      expect(state.categories.find(c => c.id === transportId)?.subcategories).toHaveLength(2);
      expect(state.categories.find(c => c.id === entertainmentId)?.subcategories).toHaveLength(2);
      expect(state.categories.find(c => c.id === shoppingId)?.subcategories).toHaveLength(2);
    });

    it('should handle a complete tag management workflow', () => {
      const { addTag, updateTag, deleteTag } = useSettingsStore.getState();
      
      // Add multiple tags
      addTag({ name: 'Business', icon: 'Briefcase' });
      addTag({ name: 'Personal', icon: 'User' });
      addTag({ name: 'Travel', icon: 'Plane' });

      let state = useSettingsStore.getState();
      expect(state.tags).toHaveLength(3);

      // Update a tag
      const businessTagId = state.tags[0].id;
      updateTag(businessTagId, { name: 'Work', icon: 'Building' });
      
      state = useSettingsStore.getState();
      expect(state.tags[0].name).toBe('Work');
      expect(state.tags[0].icon).toBe('Building');

      // Delete a tag
      deleteTag(businessTagId);
      state = useSettingsStore.getState();
      expect(state.tags).toHaveLength(2);
      expect(state.tags.find(t => t.name === 'Work')).toBeUndefined();
    });

    it('should handle merchants with categories', () => {
      const { addMerchant, addCategory, updateMerchant } = useSettingsStore.getState();
      
      // Add a category first
      addCategory({ name: 'E-commerce', icon: 'ShoppingCart' });
      let state = useSettingsStore.getState();
      const categoryName = state.categories[0].name;

      // Add merchants with category reference
      addMerchant({ name: 'Amazon', website: 'amazon.com', category: categoryName });
      addMerchant({ name: 'eBay', website: 'ebay.com', category: categoryName });

      state = useSettingsStore.getState();
      expect(state.merchants).toHaveLength(2);
      expect(state.merchants[0].category).toBe(categoryName);
      expect(state.merchants[1].category).toBe(categoryName);

      // Update merchant category
      const amazonId = state.merchants[0].id;
      updateMerchant(amazonId, { category: 'Online Shopping' });
      
      state = useSettingsStore.getState();
      expect(state.merchants[0].category).toBe('Online Shopping');
    });
  });

  describe('Edge cases and validation', () => {
    it('should handle updating non-existent items gracefully', () => {
      const { updateTag, updateCategory, updateMerchant, updateWebhook } = useSettingsStore.getState();
      
      // These should not crash or affect the store
      updateTag('non-existent-id', { name: 'Updated' });
      updateCategory('non-existent-id', { name: 'Updated' });
      updateMerchant('non-existent-id', { name: 'Updated' });
      updateWebhook('non-existent-id', { active: false });

      const state = useSettingsStore.getState();
      expect(state.tags).toHaveLength(0);
      expect(state.categories).toHaveLength(0);
      expect(state.merchants).toHaveLength(0);
      expect(state.webhooks).toHaveLength(0);
    });

    it('should handle deleting non-existent items gracefully', () => {
      const { deleteTag, deleteCategory, deleteMerchant, deleteWebhook } = useSettingsStore.getState();
      
      // Add some items first
      const { addTag, addCategory, addMerchant, addWebhook } = useSettingsStore.getState();
      addTag({ name: 'Test', icon: 'Star' });
      addCategory({ name: 'Test', icon: 'Star' });
      addMerchant({ name: 'Test' });
      addWebhook({ url: 'https://test.com', events: ['test'] });

      let state = useSettingsStore.getState();
      expect(state.tags).toHaveLength(1);
      expect(state.categories).toHaveLength(1);
      expect(state.merchants).toHaveLength(1);
      expect(state.webhooks).toHaveLength(1);

      // Try to delete non-existent items
      deleteTag('non-existent-id');
      deleteCategory('non-existent-id');
      deleteMerchant('non-existent-id');
      deleteWebhook('non-existent-id');

      // Original items should still exist
      state = useSettingsStore.getState();
      expect(state.tags).toHaveLength(1);
      expect(state.categories).toHaveLength(1);
      expect(state.merchants).toHaveLength(1);
      expect(state.webhooks).toHaveLength(1);
    });

    it('should handle subcategory operations on non-existent categories', () => {
      const { addSubcategory, updateSubcategory, deleteSubcategory } = useSettingsStore.getState();
      
      // These should not crash
      addSubcategory('non-existent-category', 'Test Subcategory');
      updateSubcategory('non-existent-category', 'non-existent-subcategory', 'Updated');
      deleteSubcategory('non-existent-category', 'non-existent-subcategory');

      const state = useSettingsStore.getState();
      expect(state.categories).toHaveLength(0);
    });
  });

  describe('Data consistency', () => {
    it('should maintain unique IDs for all items', () => {
      const { addTag, addCategory, addMerchant, addWebhook } = useSettingsStore.getState();
      
      // Add multiple items
      addTag({ name: 'Tag1', icon: 'Star' });
      addTag({ name: 'Tag2', icon: 'Heart' });
      addCategory({ name: 'Cat1', icon: 'Home' });
      addCategory({ name: 'Cat2', icon: 'Car' });
      addMerchant({ name: 'Merchant1' });
      addMerchant({ name: 'Merchant2' });
      addWebhook({ url: 'https://test1.com', events: ['test'] });
      addWebhook({ url: 'https://test2.com', events: ['test'] });

      const state = useSettingsStore.getState();
      
      // Check tag IDs are unique
      const tagIds = state.tags.map(t => t.id);
      expect(new Set(tagIds).size).toBe(tagIds.length);

      // Check category IDs are unique
      const categoryIds = state.categories.map(c => c.id);
      expect(new Set(categoryIds).size).toBe(categoryIds.length);

      // Check merchant IDs are unique
      const merchantIds = state.merchants.map(m => m.id);
      expect(new Set(merchantIds).size).toBe(merchantIds.length);

      // Check webhook IDs are unique
      const webhookIds = state.webhooks.map(w => w.id);
      expect(new Set(webhookIds).size).toBe(webhookIds.length);
    });

    it('should maintain subcategory IDs unique within each category', () => {
      const { addCategory, addSubcategory } = useSettingsStore.getState();
      
      addCategory({ name: 'Category1', icon: 'Home' });
      addCategory({ name: 'Category2', icon: 'Car' });

      const state1 = useSettingsStore.getState();
      const cat1Id = state1.categories[0].id;
      const cat2Id = state1.categories[1].id;

      // Add subcategories to both
      addSubcategory(cat1Id, 'Sub1');
      addSubcategory(cat1Id, 'Sub2');
      addSubcategory(cat2Id, 'Sub3');
      addSubcategory(cat2Id, 'Sub4');

      const state2 = useSettingsStore.getState();
      
      // Get all subcategory IDs
      const allSubIds = state2.categories.flatMap(c => c.subcategories.map(s => s.id));
      expect(new Set(allSubIds).size).toBe(allSubIds.length);
    });
  });
});