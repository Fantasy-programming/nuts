import { api } from "@/lib/axios";

export interface Category {
  id: string;
  name: string;
  icon: string;
  subcategories: Array<{
    id: string;
    name: string;
  }>;
}

export interface CreateCategoryRequest {
  name: string;
  icon: string;
}

export interface UpdateCategoryRequest {
  name?: string;
  icon?: string;
}

export interface CreateSubcategoryRequest {
  name: string;
}

const CATEGORIES_ENDPOINT = "/categories";

/**
 * Get all categories for the current user
 */
const getCategories = async (): Promise<Category[]> => {
  const response = await api.get(CATEGORIES_ENDPOINT);
  return response.data;
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
const createSubcategory = async (categoryId: string, subcategory: CreateSubcategoryRequest): Promise<Category> => {
  const response = await api.post(`${CATEGORIES_ENDPOINT}/${categoryId}/subcategories`, subcategory);
  return response.data;
};

/**
 * Update a subcategory
 */
const updateSubcategory = async (categoryId: string, subcategoryId: string, subcategory: CreateSubcategoryRequest): Promise<Category> => {
  const response = await api.put(`${CATEGORIES_ENDPOINT}/${categoryId}/subcategories/${subcategoryId}`, subcategory);
  return response.data;
};

/**
 * Delete a subcategory
 */
const deleteSubcategory = async (categoryId: string, subcategoryId: string): Promise<Category> => {
  const response = await api.delete(`${CATEGORIES_ENDPOINT}/${categoryId}/subcategories/${subcategoryId}`);
  return response.data;
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