import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/core/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/core/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/core/components/ui/dialog";
import { Input } from "@/core/components/ui/input";
import { Label } from "@/core/components/ui/label";
import { Skeleton } from "@/core/components/ui/skeleton";
import { ColorPicker } from "@/core/components/ui/color-picker";
import IconPicker from "@/core/components/icon-picker";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/core/components/ui/dropdown-menu";
import { MoreHorizontal, Trash, AlertCircle } from "lucide-react";
import { renderIcon } from "@/core/components/icon-picker/index.helper";
import { useCategoriesQuery, useCreateCategoryMutation, useDeleteCategoryMutation, useCreateSubcategoryMutation, useDeleteSubcategoryMutation } from "@/features/preferences/services/settings.queries";
import { logger } from "@/lib/logger";

export const Route = createFileRoute("/dashboard_/settings/categories")({
  component: RouteComponent,
});

function RouteComponent() {
  const { data: categories, isLoading, error } = useCategoriesQuery();
  const createCategoryMutation = useCreateCategoryMutation();
  const deleteCategoryMutation = useDeleteCategoryMutation();
  const createSubcategoryMutation = useCreateSubcategoryMutation();
  const deleteSubcategoryMutation = useDeleteSubcategoryMutation();

  const [isOpen, setIsOpen] = useState(false);
  const [newCategory, setNewCategory] = useState({ name: "", icon: "", color: "" });
  const [newSubcategoryName, setNewSubcategoryName] = useState("");
  const [addingSubcategoryFor, setAddingSubcategoryFor] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newCategory.name && newCategory.icon) {
      try {
        await createCategoryMutation.mutateAsync(newCategory);
        setNewCategory({ name: "", icon: "", color: "" });
        setIsOpen(false);
      } catch (error) {
        logger.error(error)
        // Error handled by mutation
      }
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    try {
      await deleteCategoryMutation.mutateAsync(categoryId);
    } catch (error) {
      logger.error(error)
    }
  };

  const handleAddSubcategory = async (categoryId: string) => {
    if (newSubcategoryName.trim()) {
      try {
        await createSubcategoryMutation.mutateAsync({
          categoryId,
          data: { name: newSubcategoryName.trim() }
        });
        setNewSubcategoryName("");
        setAddingSubcategoryFor(null);
      } catch (error) {
        logger.error(error)
      }
    }
  };

  const handleDeleteSubcategory = async (categoryId: string, subcategoryId: string) => {
    try {
      await deleteSubcategoryMutation.mutateAsync({ categoryId, subcategoryId });
    } catch (error) {
      logger.error(error)
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">Categories</h3>
          <Skeleton className="h-10 w-32" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-96" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-4" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <Skeleton className="h-8 w-full" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">Categories</h3>
        </div>
        <div className="flex items-center gap-2 p-4 text-orange-600 bg-orange-50 rounded-md">
          <AlertCircle className="h-4 w-4" />
          <span className="text-sm">Failed to load categories. Please try again later.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Categories</h3>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Category
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Category</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={newCategory.name}
                  onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Icon</Label>
                <IconPicker value={newCategory.icon} onChange={(icon) => setNewCategory({ ...newCategory, icon })} />
              </div>
              <div className="space-y-2">
                <Label>Color</Label>
                <ColorPicker
                  value={newCategory.color}
                  onChange={(color) => setNewCategory({ ...newCategory, color })}
                />
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={!newCategory.name || !newCategory.icon || createCategoryMutation.isPending}
              >
                {createCategoryMutation.isPending ? "Creating..." : "Create Category"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Categories</CardTitle>
          <CardDescription>Organize your transactions into categories and subcategories</CardDescription>
        </CardHeader>
        <CardContent>
          {categories && categories.length > 0 ? (
            <div className="space-y-4">
              {categories.map((category) => (
                <div key={category.id} className="space-y-3">
                  {/* Main Category */}
                  <div className="flex items-center justify-between p-3 rounded-lg border bg-card">
                    <div className="flex items-center gap-3">
                      <div
                        className="h-3 w-3 rounded-full border"
                        style={{ backgroundColor: category.color || "#6b7280" }}
                      />
                      {renderIcon(category.icon, { className: "h-5 w-5" })}
                      <span className="font-medium">{category.name}</span>
                      <span className="text-sm text-muted-foreground">
                        ({category.subcategories?.length || 0} subcategories)
                      </span>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setAddingSubcategoryFor(category.id)}>
                          <Plus className="mr-2 h-4 w-4" />
                          Add Subcategory
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={() => handleDeleteCategory(category.id)}
                          disabled={deleteCategoryMutation.isPending}
                        >
                          <Trash className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Subcategories - Tree style with indentation */}
                  {category.subcategories && category.subcategories.length > 0 && (
                    <div className="ml-6 space-y-2">
                      {category.subcategories.map((subcategory) => (
                        <div key={subcategory.id} className="flex items-center justify-between p-2 rounded-md bg-muted/30 border-l-2 border-muted">
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
                            <span className="text-sm">{subcategory.name}</span>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => handleDeleteSubcategory(category.id, subcategory.id)}
                            disabled={deleteSubcategoryMutation.isPending}
                          >
                            <Trash className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add subcategory form */}
                  {addingSubcategoryFor === category.id && (
                    <div className="ml-6 flex gap-2">
                      <Input
                        placeholder="Subcategory name"
                        value={newSubcategoryName}
                        onChange={(e) => setNewSubcategoryName(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleAddSubcategory(category.id)}
                        className="flex-1"
                      />
                      <Button
                        size="sm"
                        onClick={() => handleAddSubcategory(category.id)}
                        disabled={!newSubcategoryName.trim() || createSubcategoryMutation.isPending}
                      >
                        Add
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setAddingSubcategoryFor(null)}>
                        Cancel
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No categories found. Create your first category to get started.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
