import { TableRecordSchema } from "@/features/transactions/services/transaction.types";
import { ColumnDef } from "@tanstack/react-table";
import { Checkbox } from "@/core/components/ui/checkbox";
import { Avatar, AvatarFallback } from "@/core/components/ui/avatar";
import { Badge } from "@/core/components/ui/badge";
import { renderIcon } from "@/core/components/icon-picker/index.helper";
import { memo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Popover, PopoverContent, PopoverTrigger } from "@/core/components/ui/popover";
import { SearchableSelect, SearchableSelectOption } from "@/core/components/ui/search-select";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adaptiveCategoryService, adaptiveTransactionService } from "@/core/offline-first";
import { toast } from "sonner";
import { useMemo } from "react";

type TransactionRowData = TableRecordSchema & {
  groupId?: string;
  groupDate?: Date;
  groupTotal?: number;
};

interface ActionColumnHandlers {
  onEdit: (transactionId: TableRecordSchema) => void;
}

// Memoized components to prevent unnecessary re-renders
const TransactionCell = memo(({
  transaction,
  onEdit
}: {
  transaction: TableRecordSchema;
  onEdit: (transaction: TableRecordSchema) => void;
}) => (
  <div className="flex items-center space-x-3">
    <Avatar className="h-8 w-8">
      <AvatarFallback className="bg-[#595959] text-background">
        {transaction.account.name.slice(0, 2).toUpperCase()}
      </AvatarFallback>
    </Avatar>
    <div className="flex flex-col gap-0.5">
      <button
        onClick={() => { onEdit(transaction) }}
        className="text-left hover:underline font-medium"
      >
        {transaction.description}
      </button>
      <Link
        to="/dashboard/accounts/$id"
        params={{ id: transaction.account.id }}
        className="text-xs text-muted-foreground hover:underline"
      >
        {transaction.account.name}
      </Link>
    </div>
  </div>
));

const CategoryCell = memo(({ transaction }: { transaction: TableRecordSchema }) => {
  const [isOpen, setIsOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: adaptiveCategoryService.getCategories,
    gcTime: 1000 * 60 * 5,
    staleTime: 1000 * 60 * 2,
    refetchOnMount: false,
    retry: 1,
  });

  const updateCategoryMutation = useMutation({
    mutationFn: async (categoryId: string) => {
      await adaptiveTransactionService.bulkUpdateCategories([transaction.id], categoryId);
    },
    onSuccess: () => {
      toast.success("Category updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      setIsOpen(false);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update category.");
    },
  });

  const categoriesOptions: SearchableSelectOption[] = useMemo(() => {
    if (!categories) return [];
    return categories.map(category => ({
      value: category.id,
      label: category.name,
      keywords: [category.name],
      icon: renderIcon(category.icon || "")
    }));
  }, [categories]);

  const handleCategoryChange = (categoryId: string) => {
    if (categoryId && categoryId !== transaction.category?.id) {
      updateCategoryMutation.mutate(categoryId);
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Badge 
          variant="outline" 
          className="rounded-full text-md px-2 py-1 [&>svg]:size-4 cursor-pointer hover:bg-accent hover:text-accent-foreground transition-colors"
        >
          {renderIcon(transaction.category?.icon || "")} {transaction.category?.name || "No category"}
        </Badge>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="start">
        <div className="space-y-2">
          <p className="text-sm font-medium">Change category</p>
          <SearchableSelect
            options={categoriesOptions}
            value={transaction.category?.id || ""}
            onChange={handleCategoryChange}
            placeholder="Select category..."
            searchPlaceholder="Search categories..."
            isLoading={updateCategoryMutation.isPending}
            disabled={updateCategoryMutation.isPending}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
});

const AmountCell = memo(({ amount }: { amount: number }) => {
  const formatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
  return <div className="font-medium text-right pr-4">{formatted}</div>;
});

export const getRecordsTableColumns = ({
  onEdit,
}: ActionColumnHandlers): ColumnDef<TransactionRowData>[] => [
    {
      id: "select",
      size: 10,
      maxSize: 10,
      minSize: 10,
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
          className="translate-y-[2px]"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
          className="translate-y-[2px]"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "description",
      header: "Transaction",
      size: 300,
      cell: ({ row }) => (
        <TransactionCell
          transaction={row.original}
          onEdit={onEdit}
        />
      ),
    },
    {
      accessorFn: row => row.category?.name,
      id: "category.name",
      header: "Category",
      size: 150,
      cell: ({ row }) => {
        return (
          <CategoryCell transaction={row.original} />
        )
      }
    },
    {
      accessorKey: "amount",
      header: () => <div className="text-right">Amount</div>,
      size: 120,
      cell: ({ row }) => (
        <AmountCell amount={Number.parseFloat(row.getValue("amount"))} />
      ),
    },
  ];
