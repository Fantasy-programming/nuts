import { api as axios } from "@/lib/axios";

export interface Category {
  id: string; // UUID is represented as string in TypeScript
  name: string;
  parent_id: string | null; // Optional UUID
  is_default: boolean | null;
  created_by: string; // UUID
  updated_by: string | null; // Optional UUID
  created_at: string; // ISO date string
  updated_at: string; // ISO date string
  deleted_at: string | null; // Optional timestamp
}

const getCategories = async (): Promise<Category[]> => {
  const { data } = await axios.get<Category[]>("/category/");
  return data;
};

const createCategory = async (
  account: Omit<
    Category,
    | "id"
    | "updated_by"
    | "created_at"
    | "deleted_at"
    | "created_by"
    | "updated_at"
  >,
): Promise<Category> => {
  const data = await axios.post<Category>("/category/", account);
  return data.data;
};

export const categoryService = { getCategories, createCategory };
