import { api as axios } from "@/lib/axios";
import { Category, CategoryCreate } from "./category.types";

const BASEURI = "/categories";

const getCategories = async (): Promise<Category[]> => {
  const { data } = await axios.get<Category[]>(`${BASEURI}/`);
  return data;
};

const createCategory = async (category: CategoryCreate): Promise<Category> => {
  const data = await axios.post<Category>(`${BASEURI}/`, category);
  return data.data;
};

export const categoryService = { getCategories, createCategory };
