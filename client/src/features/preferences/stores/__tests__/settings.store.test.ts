import { describe, it, expect, beforeEach } from 'vitest';
import { useSettingsStore } from '../settings.store';

describe('Settings Store', () => {
  beforeEach(() => {
    // Reset the store before each test
    useSettingsStore.setState({
      tags: [],
      categories: [],
      merchants: [],
      webhooks: [],
    });
  });

  describe('Tags functionality', () => {
    it('should add a new tag', () => {
      const { addTag } = useSettingsStore.getState();
      
      addTag({ name: 'Food', icon: 'Utensils' });
      
      const state = useSettingsStore.getState();
      expect(state.tags).toHaveLength(1);
      expect(state.tags[0].name).toBe('Food');
      expect(state.tags[0].icon).toBe('Utensils');
      expect(state.tags[0].id).toBeDefined();
    });

    it('should update an existing tag', () => {
      const { addTag, updateTag } = useSettingsStore.getState();
      
      addTag({ name: 'Food', icon: 'Utensils' });
      const tagId = useSettingsStore.getState().tags[0].id;
      
      updateTag(tagId, { name: 'Restaurant', icon: 'UtensilsCrossed' });
      
      const state = useSettingsStore.getState();
      expect(state.tags[0].name).toBe('Restaurant');
      expect(state.tags[0].icon).toBe('UtensilsCrossed');
    });

    it('should delete a tag', () => {
      const { addTag, deleteTag } = useSettingsStore.getState();
      
      addTag({ name: 'Food', icon: 'Utensils' });
      const tagId = useSettingsStore.getState().tags[0].id;
      
      deleteTag(tagId);
      
      const state = useSettingsStore.getState();
      expect(state.tags).toHaveLength(0);
    });
  });

  describe('Categories functionality', () => {
    it('should add a new category', () => {
      const { addCategory } = useSettingsStore.getState();
      
      addCategory({ name: 'Transportation', icon: 'Car' });
      
      const state = useSettingsStore.getState();
      expect(state.categories).toHaveLength(1);
      expect(state.categories[0].name).toBe('Transportation');
      expect(state.categories[0].icon).toBe('Car');
      expect(state.categories[0].subcategories).toEqual([]);
      expect(state.categories[0].id).toBeDefined();
    });

    it('should update an existing category', () => {
      const { addCategory, updateCategory } = useSettingsStore.getState();
      
      addCategory({ name: 'Transportation', icon: 'Car' });
      const categoryId = useSettingsStore.getState().categories[0].id;
      
      updateCategory(categoryId, { name: 'Transport', icon: 'Truck' });
      
      const state = useSettingsStore.getState();
      expect(state.categories[0].name).toBe('Transport');
      expect(state.categories[0].icon).toBe('Truck');
    });

    it('should delete a category', () => {
      const { addCategory, deleteCategory } = useSettingsStore.getState();
      
      addCategory({ name: 'Transportation', icon: 'Car' });
      const categoryId = useSettingsStore.getState().categories[0].id;
      
      deleteCategory(categoryId);
      
      const state = useSettingsStore.getState();
      expect(state.categories).toHaveLength(0);
    });

    it('should add a subcategory to an existing category', () => {
      const { addCategory, addSubcategory } = useSettingsStore.getState();
      
      addCategory({ name: 'Transportation', icon: 'Car' });
      const categoryId = useSettingsStore.getState().categories[0].id;
      
      addSubcategory(categoryId, 'Gas');
      
      const state = useSettingsStore.getState();
      expect(state.categories[0].subcategories).toHaveLength(1);
      expect(state.categories[0].subcategories[0].name).toBe('Gas');
      expect(state.categories[0].subcategories[0].id).toBeDefined();
    });

    it('should update a subcategory', () => {
      const { addCategory, addSubcategory, updateSubcategory } = useSettingsStore.getState();
      
      addCategory({ name: 'Transportation', icon: 'Car' });
      const categoryId = useSettingsStore.getState().categories[0].id;
      
      addSubcategory(categoryId, 'Gas');
      const subcategoryId = useSettingsStore.getState().categories[0].subcategories[0].id;
      
      updateSubcategory(categoryId, subcategoryId, 'Fuel');
      
      const state = useSettingsStore.getState();
      expect(state.categories[0].subcategories[0].name).toBe('Fuel');
    });

    it('should delete a subcategory', () => {
      const { addCategory, addSubcategory, deleteSubcategory } = useSettingsStore.getState();
      
      addCategory({ name: 'Transportation', icon: 'Car' });
      const categoryId = useSettingsStore.getState().categories[0].id;
      
      addSubcategory(categoryId, 'Gas');
      const subcategoryId = useSettingsStore.getState().categories[0].subcategories[0].id;
      
      deleteSubcategory(categoryId, subcategoryId);
      
      const state = useSettingsStore.getState();
      expect(state.categories[0].subcategories).toHaveLength(0);
    });
  });

  describe('Merchants functionality', () => {
    it('should add a new merchant', () => {
      const { addMerchant } = useSettingsStore.getState();
      
      addMerchant({ name: 'Amazon', website: 'amazon.com', category: 'Shopping' });
      
      const state = useSettingsStore.getState();
      expect(state.merchants).toHaveLength(1);
      expect(state.merchants[0].name).toBe('Amazon');
      expect(state.merchants[0].website).toBe('amazon.com');
      expect(state.merchants[0].category).toBe('Shopping');
      expect(state.merchants[0].id).toBeDefined();
    });

    it('should update an existing merchant', () => {
      const { addMerchant, updateMerchant } = useSettingsStore.getState();
      
      addMerchant({ name: 'Amazon', website: 'amazon.com' });
      const merchantId = useSettingsStore.getState().merchants[0].id;
      
      updateMerchant(merchantId, { category: 'E-commerce' });
      
      const state = useSettingsStore.getState();
      expect(state.merchants[0].category).toBe('E-commerce');
    });

    it('should delete a merchant', () => {
      const { addMerchant, deleteMerchant } = useSettingsStore.getState();
      
      addMerchant({ name: 'Amazon', website: 'amazon.com' });
      const merchantId = useSettingsStore.getState().merchants[0].id;
      
      deleteMerchant(merchantId);
      
      const state = useSettingsStore.getState();
      expect(state.merchants).toHaveLength(0);
    });
  });

  describe('Webhooks functionality', () => {
    it('should add a new webhook', () => {
      const { addWebhook } = useSettingsStore.getState();
      
      addWebhook({ url: 'https://example.com/webhook', events: ['transaction.created'] });
      
      const state = useSettingsStore.getState();
      expect(state.webhooks).toHaveLength(1);
      expect(state.webhooks[0].url).toBe('https://example.com/webhook');
      expect(state.webhooks[0].events).toEqual(['transaction.created']);
      expect(state.webhooks[0].active).toBe(true);
      expect(state.webhooks[0].id).toBeDefined();
    });

    it('should update an existing webhook', () => {
      const { addWebhook, updateWebhook } = useSettingsStore.getState();
      
      addWebhook({ url: 'https://example.com/webhook', events: ['transaction.created'] });
      const webhookId = useSettingsStore.getState().webhooks[0].id;
      
      updateWebhook(webhookId, { active: false });
      
      const state = useSettingsStore.getState();
      expect(state.webhooks[0].active).toBe(false);
    });

    it('should delete a webhook', () => {
      const { addWebhook, deleteWebhook } = useSettingsStore.getState();
      
      addWebhook({ url: 'https://example.com/webhook', events: ['transaction.created'] });
      const webhookId = useSettingsStore.getState().webhooks[0].id;
      
      deleteWebhook(webhookId);
      
      const state = useSettingsStore.getState();
      expect(state.webhooks).toHaveLength(0);
    });
  });
});