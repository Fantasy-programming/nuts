import { TableRecordSchema } from "@/features/transactions/services/transaction.types";
import { ColumnDef } from "@tanstack/react-table";
import { Checkbox } from "@/core/components/ui/checkbox";
import { Avatar, AvatarFallback } from "@/core/components/ui/avatar";
import { Badge } from "@/core/components/ui/badge";
import { renderIcon } from "@/core/components/icon-picker/index.helper";
import { memo } from "react";
import { Link } from "@tanstack/react-router";

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

const CategoryCell = memo(({ transaction }: { transaction: TableRecordSchema }) => (
  <Badge variant="outline" className="rounded-full text-md px-2 py-1 [&>svg]:size-4">
    {renderIcon(transaction.category?.icon || "")} {transaction.category?.name}
  </Badge>
));

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
      accessorKey: "is_recurring",
      header: "Recurring",
      size: 100,
      cell: ({ row }) => {
        const isRecurring = row.getValue("is_recurring") as boolean;
        return (
          <div className="flex items-center justify-center">
            {isRecurring ? (
              <Badge variant="secondary" className="text-xs">
                Recurring
              </Badge>
            ) : null}
          </div>
        );
      },
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
