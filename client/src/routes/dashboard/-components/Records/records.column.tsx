import { RecordSchema } from "@/features/transactions/services/transaction.types";
import { ColumnDef } from "@tanstack/react-table";
import { Checkbox } from "@/core/components/ui/checkbox"

export const recordsTableColumns: ColumnDef<RecordSchema & { groupId: string; groupDate: Date; groupTotal: number }>[] = [
    {
      id: "select",
      size: 15,
      maxSize: 15,
      minSize: 15,
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
      header: "Description",
      size: 150,
      maxSize: 150,
      minSize: 150,
      cell: ({ row }) => (
        <div className="flex items-center space-x-2">
          {row.original?.details?.payment_status && (
            <img src={"/placeholder.svg"} alt="" className="h-8 w-8 rounded-full" />
          )}
          <span>{row.getValue("description")}</span>
        </div>
      ),
    },
    {
      accessorKey: "amount",
      header: () => <>Amount</>,
      size: 150,
      maxSize: 150,
      minSize: 150,
      cell: ({ row }) => {
        const amount = Number.parseFloat(row.getValue("amount"))
        const formatted = new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
        }).format(amount)
        return <div className="font-medium">{formatted}</div>
      },
    },
    {
      accessorKey: "category.name",
      header: "Category",
      size: 150,
      maxSize: 150,
      minSize: 150,
    },
    {
      accessorKey: "account.name",
      header: "Account",
      size: 150,
      maxSize: 150,
      minSize: 150,
    },
  ]
