import { api } from "@/lib/axios";
import { Category } from "@/features/categories/services/category.types";
import { GroupedCategory, groupCategories } from "@/core/components/nested-select/utils";

export interface CreateCategoryRequest {
  name: string;
  icon: string;
  color?: string;
  parent_id?: string | null;
}

export interface UpdateCategoryRequest {
  name?: string;
  icon?: string;
  color?: string;
  parent_id?: string | null;
}

export interface CreateSubcategoryRequest {
  name: string;
  icon?: string;
  color?: string;
}

const CATEGORIES_ENDPOINT = "/categories";

/**
 * Get all categories for the current user
 */
const getCategories = async (): Promise<GroupedCategory[]> => {
  const response = await api.get(CATEGORIES_ENDPOINT);
  // Convert flat category list with parent_id to hierarchical structure
  return groupCategories(response.data);
};

/**
 * Create a new category
 */
const createCategory = async (category: CreateCategoryRequest): Promise<Category> => {
  const response = await api.post(CATEGORIES_ENDPOINT, category);
  return response.data;
};

/**
 * Update an existing category
 */
const updateCategory = async (id: string, category: UpdateCategoryRequest): Promise<Category> => {
  const response = await api.put(`${CATEGORIES_ENDPOINT}/${id}`, category);
  return response.data;
};

/**
 * Delete a category
 */
const deleteCategory = async (id: string): Promise<void> => {
  await api.delete(`${CATEGORIES_ENDPOINT}/${id}`);
};

/**
 * Create a subcategory within a category
 */
const createSubcategory = async (categoryId: string, subcategory: CreateSubcategoryRequest): Promise<GroupedCategory[]> => {
  const requestData = {
    ...subcategory,
    parent_id: categoryId
  };
  await api.post(CATEGORIES_ENDPOINT, requestData);
  // Return updated categories list
  return getCategories();
};

/**
 * Update a subcategory
 */
const updateSubcategory = async (_categoryId: string, subcategoryId: string, subcategory: CreateSubcategoryRequest): Promise<GroupedCategory[]> => {
  await api.put(`${CATEGORIES_ENDPOINT}/${subcategoryId}`, subcategory);
  // Return updated categories list
  return getCategories();
};

/**
 * Delete a subcategory
 */
const deleteSubcategory = async (_categoryId: string, subcategoryId: string): Promise<GroupedCategory[]> => {
  await api.delete(`${CATEGORIES_ENDPOINT}/${subcategoryId}`);
  // Return updated categories list
  return getCategories();
};

export const categoriesService = {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  createSubcategory,
  updateSubcategory,
  deleteSubcategory,
};