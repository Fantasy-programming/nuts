import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ColumnDef, useReactTable, getCoreRowModel, flexRender } from "@tanstack/react-table";
import { format } from "date-fns";
import { Badge } from "@/core/components/ui/badge";
import { Button } from "@/core/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/core/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/core/components/ui/dropdown-menu";
import { Switch } from "@/core/components/ui/switch";
import { recurringTransactionService, recurringTransactionQueryKeys } from "../services/recurring-transaction.service";
import { RecurringTransaction, RecurringTransactionFilters, getFrequencyDescription } from "../services/recurring-transaction.types";
import { AddRecurringTransactionDialog } from "./add-recurring-transaction-dialog";
import { MoreHorizontal, Edit, Trash2, Calendar, TrendingUp } from "lucide-react";
import { toast } from "sonner";

interface RecurringTransactionsTableProps {
  filters?: RecurringTransactionFilters;
}

export function RecurringTransactionsTable({ filters }: RecurringTransactionsTableProps) {
  const queryClient = useQueryClient();

  const { data: recurringTransactions = [], isLoading } = useQuery({
    queryKey: recurringTransactionQueryKeys.list(filters),
    queryFn: () => recurringTransactionService.getAll(filters),
  });

  const pauseMutation = useMutation({
    mutationFn: ({ id, isPaused }: { id: string; isPaused: boolean }) =>
      recurringTransactionService.pause(id, isPaused),
    onSuccess: () => {
      toast.success("Recurring transaction updated successfully");
      queryClient.invalidateQueries({ queryKey: recurringTransactionQueryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: recurringTransactionQueryKeys.stats() });
    },
    onError: () => {
      toast.error("Failed to update recurring transaction");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: recurringTransactionService.delete,
    onSuccess: () => {
      toast.success("Recurring transaction deleted successfully");
      queryClient.invalidateQueries({ queryKey: recurringTransactionQueryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: recurringTransactionQueryKeys.stats() });
    },
    onError: () => {
      toast.error("Failed to delete recurring transaction");
    },
  });

  const getStatusBadge = (transaction: RecurringTransaction) => {
    if (transaction.is_paused) {
      return <Badge variant="secondary">Paused</Badge>;
    }
    
    const now = new Date();
    const nextDue = new Date(transaction.next_due_date);
    
    if (nextDue <= now) {
      return <Badge variant="destructive">Due</Badge>;
    }
    
    if (transaction.max_occurrences && transaction.occurrences_count >= transaction.max_occurrences) {
      return <Badge variant="outline">Completed</Badge>;
    }
    
    return <Badge variant="default">Active</Badge>;
  };

  const handlePauseToggle = (id: string, currentState: boolean) => {
    pauseMutation.mutate({ id, isPaused: !currentState });
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this recurring transaction?")) {
      deleteMutation.mutate(id);
    }
  };

  const columns: ColumnDef<RecurringTransaction>[] = [
    {
      accessorKey: "template_name",
      header: "Name",
      cell: ({ row }) => {
        const transaction = row.original;
        return (
          <div className="flex flex-col">
            <span className="font-medium">
              {transaction.template_name || transaction.description || "Unnamed"}
            </span>
            <span className="text-sm text-muted-foreground">
              {transaction.description && transaction.template_name !== transaction.description 
                ? transaction.description 
                : ""}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: "amount",
      header: "Amount",
      cell: ({ row }) => {
        const amount = row.original.amount;
        const type = row.original.type;
        const formattedAmount = new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
        }).format(amount);
        
        return (
          <div className="flex items-center gap-2">
            {type === "income" ? (
              <TrendingUp className="h-4 w-4 text-green-500" />
            ) : (
              <TrendingUp className="h-4 w-4 text-red-500 rotate-180" />
            )}
            <span className={type === "income" ? "text-green-600" : "text-red-600"}>
              {formattedAmount}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: "frequency",
      header: "Frequency",
      cell: ({ row }) => {
        const { frequency, frequency_interval, frequency_data } = row.original;
        return (
          <span className="text-sm">
            {getFrequencyDescription(frequency, frequency_interval, frequency_data)}
          </span>
        );
      },
    },
    {
      accessorKey: "next_due_date",
      header: "Next Due",
      cell: ({ row }) => {
        const nextDue = new Date(row.original.next_due_date);
        const now = new Date();
        const isOverdue = nextDue <= now;
        
        return (
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className={isOverdue ? "text-red-600 font-medium" : "text-muted-foreground"}>
              {format(nextDue, "MMM d, yyyy")}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => getStatusBadge(row.original),
    },
    {
      accessorKey: "auto_post",
      header: "Auto-post",
      cell: ({ row }) => {
        return (
          <Badge variant={row.original.auto_post ? "default" : "secondary"}>
            {row.original.auto_post ? "Yes" : "No"}
          </Badge>
        );
      },
    },
    {
      accessorKey: "occurrences_count",
      header: "Progress",
      cell: ({ row }) => {
        const { occurrences_count, max_occurrences } = row.original;
        return (
          <span className="text-sm">
            {occurrences_count}{max_occurrences ? `/${max_occurrences}` : ""}
          </span>
        );
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const transaction = row.original;
        
        return (
          <div className="flex items-center gap-2">
            <Switch
              checked={!transaction.is_paused}
              onCheckedChange={() => handlePauseToggle(transaction.id, transaction.is_paused)}
              disabled={pauseMutation.isPending}
            />
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Calendar className="h-4 w-4 mr-2" />
                  View Instances
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => handleDelete(transaction.id)}
                  className="text-red-600"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];

  const table = useReactTable({
    data: recurringTransactions,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Recurring Transactions</h2>
        <AddRecurringTransactionDialog>
          <Button>
            <TrendingUp className="h-4 w-4 mr-2" />
            Add Recurring Transaction
          </Button>
        </AddRecurringTransactionDialog>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  {isLoading ? "Loading..." : "No recurring transactions found."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}