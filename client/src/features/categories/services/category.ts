import { api as axios } from "@/lib/axios";
import { Category, CategoryCreate } from "./category.types";

const getCategories = async (): Promise<Category[]> => {
  const { data } = await axios.get<Category[]>("/category/");
  return data;
};

const createCategory = async (category: CategoryCreate): Promise<Category> => {
  const data = await axios.post<Category>("/category/", category);
  return data.data;
};

export const categoryService = { getCategories, createCategory };
