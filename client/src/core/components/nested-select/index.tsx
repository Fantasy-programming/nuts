import { useState, useMemo } from "react"
import { ChevronDown } from "lucide-react"
import { Button } from "@/core/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuPortal,
} from "@/core/components/ui/dropdown-menu";
import type { Category } from "@/features/categories/services/category.types";
import { GroupedCategory } from "./utils";

interface CategorySelectProps {
  categories: GroupedCategory[]
  value: string
  onValueChange: (value: string) => void
  placeholder?: string
}

export function NestedCategorySelect({
  categories,
  value,
  onValueChange,
  placeholder = "Select a category",
}: CategorySelectProps) {
  const [open, setOpen] = useState(false)


  const allCategoriesMap = useMemo(() => {
    const map = new Map<string, Category>();
    categories.forEach(cat => map.set(cat.id, cat));
    return map;
  }, [categories]);

  const getSelectedCategoryDisplayInfo = (selectedId: string | null) => {
    if (!selectedId) return null;

    const selected = allCategoriesMap.get(selectedId);
    if (!selected) return null;

    if (selected.parent_id) {
      const parent = allCategoriesMap.get(selected.parent_id);
      return {
        mainCategoryName: parent ? parent.name : "Unknown Parent",
        subcategoryName: selected.name,
      };
    }
    return {
      mainCategoryName: selected.name,
      subcategoryName: null,
    };
  };

  const selectedInfo = getSelectedCategoryDisplayInfo(value);

  const handleSelect = (categoryId: string) => {
    onValueChange(categoryId);
    setOpen(false); // Close dropdown on select
  };

  const renderCategoryItems = (items: GroupedCategory[]) => {
    return items.map((category) => {
      const hasSubcategories = category.subcategories && category.subcategories.length > 0;

      if (hasSubcategories) {
        return (
          <DropdownMenuSub key={category.id}>
            <DropdownMenuSubTrigger>
              <div className="flex items-center gap-2">
                {/* {category.icon && <category.icon className={`h-4 w-4 ${category.color || ""}`} />} */}
                <span>{category.name}</span>
              </div>
              {/* Chevron is usually handled by DropdownMenuSubTrigger by default */}
            </DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent className="w-[200px]">
                {/* Option to select the parent category itself from the sub-menu trigger */}
                <DropdownMenuItem onClick={() => handleSelect(category.id)}>
                  <div className="flex items-center gap-2">
                    {/* {category.icon && <category.icon className={`h-4 w-4 ${category.color || ""}`} />} */}
                    <span>Select {category.name}</span>
                  </div>
                </DropdownMenuItem>
                {renderCategoryItems(category.subcategories)}
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>
        );
      }

      return (
        <DropdownMenuItem key={category.id} onClick={() => handleSelect(category.id)}>
          <div className="flex items-center gap-2">
            {/* {category.icon && <category.icon className={`h-4 w-4 ${category.color || ""}`} />} */}
            <span>{category.name}</span>
          </div>
        </DropdownMenuItem>
      );
    });
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between">
          {selectedInfo ? (
            <div className="flex items-center gap-2 truncate">
              {/* {selectedInfo.mainCategoryIcon && ( */}
              {/*   <selectedInfo.mainCategoryIcon */}
              {/*     className={`h-4 w-4 ${selectedInfo.mainCategoryColor || ""}`} */}
              {/*   /> */}
              {/* )} */}
              <span className="truncate">
                {selectedInfo.subcategoryName
                  ? `${selectedInfo.mainCategoryName} / ${selectedInfo.subcategoryName}`
                  : selectedInfo.mainCategoryName}
              </span>
            </div>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronDown className={`ml-2 h-4 w-4 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-[200px] p-0" align="start"> {/* Adjust width as needed */}
        {renderCategoryItems(categories)}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
