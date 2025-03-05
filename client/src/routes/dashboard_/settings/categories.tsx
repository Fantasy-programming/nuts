import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/core/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/core/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/core/components/ui/dialog";
import { Input } from "@/core/components/ui/input";
import { Label } from "@/core/components/ui/label";
import IconPicker from "@/core/components/icon-picker";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/core/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/core/components/ui/dropdown-menu";
import { MoreHorizontal, Pencil, Trash } from "lucide-react";
import { useSettingsStore } from "@/features/preferences/stores/settings.store";

export const Route = createFileRoute("/dashboard_/settings/categories")({
  component: RouteComponent,
});

function RouteComponent() {
  const { categories, addCategory, updateCategory, deleteCategory, addSubcategory, deleteSubcategory } = useSettingsStore();
  const [isOpen, setIsOpen] = useState(false);
  const [newCategory, setNewCategory] = useState({ name: "", icon: "" });
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [newSubcategoryName, setNewSubcategoryName] = useState("");
  const [addingSubcategoryFor, setAddingSubcategoryFor] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newCategory.name && newCategory.icon) {
      addCategory(newCategory);
      setNewCategory({ name: "", icon: "" });
      setIsOpen(false);
    }
  };

  const handleAddSubcategory = (categoryId: string) => {
    if (newSubcategoryName.trim()) {
      addSubcategory(categoryId, newSubcategoryName);
      setNewSubcategoryName("");
      setAddingSubcategoryFor(null);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Categories</CardTitle>
              <CardDescription>Manage your expense and income categories</CardDescription>
            </div>
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
                    <Input id="name" value={newCategory.name} onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Icon</Label>
                    <IconPicker value={newCategory.icon} onChange={(icon) => setNewCategory({ ...newCategory, icon })} />
                  </div>
                  <Button type="submit" className="w-full">
                    Create Category
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Category</TableHead>
                <TableHead>Subcategories</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map((category) => (
                <TableRow key={category.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{category.icon}</span>
                      {category.name}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-2">
                      {category.subcategories.map((sub) => (
                        <div key={sub.id} className="bg-secondary flex items-center gap-1 rounded-md px-2 py-1">
                          <span>{sub.name}</span>
                          <Button variant="ghost" size="icon" className="h-4 w-4" onClick={() => deleteSubcategory(category.id, sub.id)}>
                            <Trash className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                      {addingSubcategoryFor === category.id ? (
                        <div className="flex items-center gap-2">
                          <Input
                            value={newSubcategoryName}
                            onChange={(e) => setNewSubcategoryName(e.target.value)}
                            className="h-8 w-40"
                            placeholder="New subcategory"
                          />
                          <Button size="sm" onClick={() => handleAddSubcategory(category.id)}>
                            Add
                          </Button>
                        </div>
                      ) : (
                        <Button variant="ghost" size="sm" onClick={() => setAddingSubcategoryFor(category.id)}>
                          <Plus className="mr-1 h-4 w-4" />
                          Add
                        </Button>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setEditingCategory(category.id)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600" onClick={() => deleteCategory(category.id)}>
                          <Trash className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
