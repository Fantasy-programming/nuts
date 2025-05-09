import { RecordSchema } from "@/features/transactions/services/transaction.types";
import { ColumnDef } from "@tanstack/react-table";
import { Checkbox } from "@/core/components/ui/checkbox";
import { Avatar, AvatarFallback } from "@/core/components/ui/avatar";
import { Button } from "@/core/components/ui/button"
import { MoreHorizontal } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/core/components/ui/dropdown-menu"

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
      <Checkbox checked={row.getIsSelected()} onCheckedChange={(value) => row.toggleSelected(!!value)} aria-label="Select row" className="translate-y-[2px]" />
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
        {row.original?.details?.payment_status &&
          <Avatar className="h-8 w-8">
            <AvatarFallback>
              NW
            </AvatarFallback>
          </Avatar>
        }
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
      const amount = Number.parseFloat(row.getValue("amount"));
      const formatted = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(amount);
      return <div className="font-medium">{formatted}</div>;
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

  {
    id: "actions",
    size: 80,
    cell: () => {
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem >Edit</DropdownMenuItem>
            <DropdownMenuItem className="text-red-600">
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
    enableSorting: false,
    enableHiding: false, // Usually you want actions always visible
  },
];
