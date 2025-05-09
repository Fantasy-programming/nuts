"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

interface CategorySelectProps {
  categories: any[]
  value: string
  onValueChange: (value: string) => void
  placeholder?: string
}

export default function NestedCategorySelect({
  categories,
  value,
  onValueChange,
  placeholder = "Select a category",
}: CategorySelectProps) {
  const [open, setOpen] = useState(false)
  const [activeCategory, setActiveCategory] = useState<number | null>(null)
  const [activeSubcategory, setActiveSubcategory] = useState<number | null>(null)
  const [subMenuPosition, setSubMenuPosition] = useState({ top: 0, left: 0 })
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const popoverRef = useRef<HTMLDivElement>(null)

  // Find the selected category info
  const getCategoryInfo = (categoryId: string) => {
    if (!categoryId) return null

    const id = Number.parseInt(categoryId)

    // First check if it's a main category
    const mainCategory = categories.find((c) => c.id === id)
    if (mainCategory) {
      return { mainCategory, subcategory: null }
    }

    // If not, look for subcategory
    for (const category of categories) {
      if (category.subcategories) {
        const subcategory = category.subcategories.find((sc: any) => sc.id === id)
        if (subcategory) {
          return { mainCategory: category, subcategory }
        }
      }
    }

    return null
  }

  const selectedCategoryInfo = getCategoryInfo(value)

  const handleCategoryHover = (categoryId: number, event: React.MouseEvent) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    const target = event.currentTarget as HTMLElement
    const rect = target.getBoundingClientRect()
    const popoverRect = popoverRef.current?.getBoundingClientRect()

    if (popoverRect) {
      setSubMenuPosition({
        top: rect.top - popoverRect.top,
        left: rect.width,
      })
    }

    timeoutRef.current = setTimeout(() => {
      setActiveCategory(categoryId)
      setActiveSubcategory(null)
    }, 100)
  }

  const handleSubcategoryHover = (subcategoryId: number) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    timeoutRef.current = setTimeout(() => {
      setActiveSubcategory(subcategoryId)
    }, 100)
  }

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    timeoutRef.current = setTimeout(() => {
      setActiveSubcategory(null)
    }, 300)
  }

  const handleSelect = (categoryId: string) => {
    onValueChange(categoryId)
    setOpen(false)
  }

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between">
          {selectedCategoryInfo ? (
            <div className="flex items-center gap-2 truncate">
              {selectedCategoryInfo.mainCategory.icon && (
                <selectedCategoryInfo.mainCategory.icon
                  className={`h-4 w-4 ${selectedCategoryInfo.mainCategory.color}`}
                />
              )}
              <span className="truncate">
                {selectedCategoryInfo.subcategory
                  ? `${selectedCategoryInfo.mainCategory.name} - ${selectedCategoryInfo.subcategory.name}`
                  : selectedCategoryInfo.mainCategory.name}
              </span>
            </div>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronRight className={`ml-2 h-4 w-4 shrink-0 transition-transform ${open ? "rotate-90" : ""}`} />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0" align="start" ref={popoverRef}>
        <div className="flex relative">
          {/* Main categories column */}
          <div className="w-full">
            {categories.map((category) => (
              <div
                key={category.id}
                className={cn(
                  "flex items-center justify-between px-3 py-2 text-sm cursor-pointer hover:bg-muted relative",
                  activeCategory === category.id && "bg-muted",
                )}
                onMouseEnter={(e) => handleCategoryHover(category.id, e)}
                onClick={() => handleSelect(category.id.toString())}
              >
                <div className="flex items-center gap-2">
                  {category.icon && <category.icon className={`h-4 w-4 ${category.color}`} />}
                  <span>{category.name}</span>
                </div>
                {category.subcategories && category.subcategories.length > 0 && (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
            ))}
          </div>

          {/* Subcategories column - only shown when a category is active */}
          {activeCategory !== null && categories.find((c) => c.id === activeCategory)?.subcategories?.length > 0 && (
            <div
              className="w-[200px] absolute left-full bg-popover border rounded-r-md shadow-md z-50"
              style={{
                top: `${subMenuPosition.top}px`,
                maxHeight: "300px",
                overflowY: "auto",
              }}
              onMouseLeave={handleMouseLeave}
            >
              {categories
                .find((c) => c.id === activeCategory)
                ?.subcategories?.map((subcategory: any) => (
                  <div
                    key={subcategory.id}
                    className={cn(
                      "px-3 py-2 text-sm cursor-pointer hover:bg-muted",
                      activeSubcategory === subcategory.id && "bg-muted",
                    )}
                    onMouseEnter={() => handleSubcategoryHover(subcategory.id)}
                    onClick={() => handleSelect(subcategory.id.toString())}
                  >
                    {subcategory.name}
                  </div>
                ))}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}

