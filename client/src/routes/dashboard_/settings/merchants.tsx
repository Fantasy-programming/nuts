import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/core/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/core/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/core/components/ui/dialog";
import { Input } from "@/core/components/ui/input";
import { Label } from "@/core/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/core/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/core/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/core/components/ui/dropdown-menu";
import { MoreHorizontal, Pencil, Trash } from "lucide-react";
import { createFileRoute } from "@tanstack/react-router";
import { useSettingsStore } from "@/features/preferences/stores/settings.store";

export const Route = createFileRoute("/dashboard_/settings/merchants")({
  component: RouteComponent,
});

function RouteComponent() {
  const { merchants, categories, addMerchant, deleteMerchant } = useSettingsStore();
  const [isOpen, setIsOpen] = useState(false);
  const [newMerchant, setNewMerchant] = useState({ name: "", website: "", category: "" });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMerchant.name) {
      addMerchant(newMerchant);
      setNewMerchant({ name: "", website: "", category: "" });
      setIsOpen(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Merchants</CardTitle>
              <CardDescription>Manage your frequently used merchants and vendors</CardDescription>
            </div>
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Merchant
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Merchant</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input id="name" value={newMerchant.name} onChange={(e) => setNewMerchant({ ...newMerchant, name: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="website">Website (Optional)</Label>
                    <Input id="website" type="url" value={newMerchant.website} onChange={(e) => setNewMerchant({ ...newMerchant, website: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select value={newMerchant.category} onValueChange={(value) => setNewMerchant({ ...newMerchant, category: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button type="submit" className="w-full">
                    Add Merchant
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
                <TableHead>Name</TableHead>
                <TableHead>Website</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {merchants.map((merchant) => (
                <TableRow key={merchant.id}>
                  <TableCell className="font-medium">{merchant.name}</TableCell>
                  <TableCell>
                    {merchant.website && (
                      <a href={merchant.website} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                        {merchant.website}
                      </a>
                    )}
                  </TableCell>
                  <TableCell>{categories.find((c) => c.id === merchant.category)?.name}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => {
                            // Edit functionality would go here
                          }}
                        >
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600" onClick={() => deleteMerchant(merchant.id)}>
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
