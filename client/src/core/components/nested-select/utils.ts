import { Category } from "@/features/categories/services/category.types";

export interface GroupedCategory extends Category {
  subcategories: GroupedCategory[];
};


export function groupCategories(categories: Category[]): GroupedCategory[] {
  const categoryMap = new Map<string, GroupedCategory>();
  const rootCategories: GroupedCategory[] = [];

  // Fill the maps
  for (const cat of categories) {
    const mappedCat: GroupedCategory = {
      ...cat,
      subcategories: [],
    };

    categoryMap.set(cat.id, mappedCat);
  }

  categoryMap.forEach(catNode => {
    if (catNode.parent_id && categoryMap.has(catNode.parent_id)) {
      const parentNode = categoryMap.get(catNode.parent_id)!;
      parentNode.subcategories.push(catNode);
    } else if (!catNode.parent_id) {
      rootCategories.push(catNode);
    }
  });

  return rootCategories;
}


