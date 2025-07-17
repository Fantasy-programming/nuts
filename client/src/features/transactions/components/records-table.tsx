import { useMemo, useState, Fragment, useCallback, memo } from "react"
import {
  type ColumnFiltersState,
  Row,
  type SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { Link } from "@tanstack/react-router"

import { ChevronDown, ChevronRight, Plus, Minus, Search, Loader2 } from "lucide-react"
import { Button } from "@/core/components/ui/button"
import { Checkbox } from "@/core/components/ui/checkbox"
import { Input } from "@/core/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/core/components/ui/table"
import { formatCurrency, formatDate } from "@/lib/utils"
import { getRecordsTableColumns } from "./records-table.column"
import { useIsMobile } from "@/core/hooks/use-mobile"
import { Avatar, AvatarFallback } from "@/core/components/ui/avatar"
import { Card, CardContent } from "@/core/components/ui/card"
import { ExtendedRecordSchema, TableRecordsArraySchema, TableRecordSchema } from "../services/transaction.types"
import EditTransactionSheet from "./edt-records-sheet"
import { DeleteTransactionDialog } from "./del-records-dialog"
import { FloatingActionBar } from "./floating-records-bar"
import { BulkEditDialog } from "./bulk-edit-dialog"
import { useDebounce } from "@/core/hooks/use-debounce";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query"
import { getTransactions, bulkDeleteTransactions, type GetTransactionsParams } from "../services/transaction"
import { logger } from "@/lib/logger"
import { toast } from "sonner"
import { TransactionFilterDropdown, type TransactionFilterState } from "./transaction-filter-dropdown"

interface RecordsTableProps {
  initialPage: number;
  onPageChange: (newPage: number) => void;
}



const MemoizedTransactionCard = memo(({
  transaction,
  row,
  formatCurrency,
  onEdit
}: {
  transaction: TableRecordSchema;
  row: Row<TableRecordSchema>;
  formatCurrency: (amount: number) => string;
  onEdit: (transaction: TableRecordSchema) => void;
}) => (
  <Card key={transaction.id} className={row.getIsSelected() ? "border-primary" : ""}>
    <CardContent className="p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 pt-1">
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label={`Select transaction ${transaction.id}`}
          />
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Avatar className="h-12 w-12">
                <AvatarFallback>
                  {transaction.account.name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <button
                  onClick={() => onEdit(transaction)}
                  className="font-medium text-left hover:underline text-md"
                >
                  {transaction.description}
                </button>
                <Link
                  to="/dashboard/accounts/$id"
                  params={{ id: transaction.account.id }}
                  className="text-sm text-muted-foreground hover:underline"
                >
                  {transaction.account.name}
                </Link>
              </div>
            </div>
          </div>
        </div>
        <div className="font-medium">{formatCurrency(Number(transaction.amount))}</div>
      </div>
    </CardContent>
  </Card>
));


export const RecordsTable = ({
  initialPage,
  onPageChange
}: RecordsTableProps) => {
  const [sorting, setSorting] = useState<SortingState>([])
  const [rowSelection, setRowSelection] = useState({})
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set())
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [deletingTransactionId, setDeletingTransactionId] = useState<string | string[] | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [editingTransactionId, setEditingTransactionId] = useState<string | null>(null);
  const [isEditSheetOpen, setIsEditSheetOpen] = useState(false)
  const [isBulkEditDialogOpen, setIsBulkEditDialogOpen] = useState(false)

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);

  // Transaction filters state
  const [filters, setFilters] = useState<TransactionFilterState>({})
  const debouncedFilters = useDebounce(filters, 500);

  const isMobile = useIsMobile()
  const queryClient = useQueryClient();

  // Build query parameters
  const queryParams = useMemo((): GetTransactionsParams => {
    const params: GetTransactionsParams = {
      group_by: "date",
      page: initialPage,
    };

    if (debouncedSearch) {
      params.q = debouncedSearch;
    }

    if (debouncedFilters.account_id) {
      params.account_id = debouncedFilters.account_id;
    }

    if (debouncedFilters.category_id) {
      params.category_id = debouncedFilters.category_id;
    }

    if (debouncedFilters.type) {
      params.type = debouncedFilters.type;
    }

    if (debouncedFilters.currency) {
      params.currency = debouncedFilters.currency;
    }

    if (debouncedFilters.start_date) {
      params.start_date = debouncedFilters.start_date.toISOString().split('T')[0];
    }

    if (debouncedFilters.end_date) {
      params.end_date = debouncedFilters.end_date.toISOString().split('T')[0];
    }

    return params;
  }, [initialPage, debouncedSearch, debouncedFilters]);

  const { data: transactions, isFetching } = useSuspenseQuery({
    queryKey: ["transactions", queryParams],
    queryFn: () => getTransactions(queryParams),
  });


  const bulkDeleteMutation = useMutation({
    mutationFn: (ids: string[]) => bulkDeleteTransactions(ids),
    onSuccess: (_, ids) => {
      toast.success(`${ids.length} transaction${ids.length > 1 ? 's' : ''} deleted successfully!`);
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      table.resetRowSelection();
    },
    onError: (error: Error) => {
      logger.error(error.message);
      toast.error(error.message || "An error occurred.");
    },
  });


  const groups: TableRecordsArraySchema = useMemo(() => {
    if (!transactions?.data) return [];
    return transactions.data as TableRecordsArraySchema;

  }, [transactions?.data]);

  const allTransactions = useMemo(() => {
    if (!groups.length) return [];
    return groups.flatMap((group) => group.transactions);
  }, [groups]);


  // Create a transaction ID to row index map for O(1) lookups
  const transactionRowMap = useMemo(() => {
    const map = new Map<string, number>();
    allTransactions.forEach((transaction, index) => {
      map.set(transaction.id, index);
    });
    return map;
  }, [allTransactions]);



  // Stable callback handlers
  const handleOpenEditSheet = useCallback((txn: TableRecordSchema) => {
    queryClient.setQueryData(["transaction", txn.id], txn);

    setEditingTransactionId(txn.id);
    setIsEditSheetOpen(true);
  }, [queryClient]);

  // const handleOpenDeleteDialog = useCallback((transaction: RecordSchema) => {
  //   setDeletingTransaction(transaction);
  //   setIsDeleteDialogOpen(true);
  // }, []);

  // Memoized columns with stable callbacks
  const columns = useMemo(
    () => getRecordsTableColumns({
      onEdit: handleOpenEditSheet,
    }),
    [handleOpenEditSheet]
  );

  const table = useReactTable({
    data: allTransactions,
    columns: columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onRowSelectionChange: setRowSelection,
    manualPagination: true,
    pageCount: transactions?.pagination.total_pages ?? -1,
    state: {
      sorting,
      rowSelection,
      columnFilters,
    },
  });

  const toggleGroup = useCallback((groupId: string) => {
    setOpenGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  }, []);


  const toggleAllGroups = useCallback(() => {
    if (openGroups.size === groups.length) {
      setOpenGroups(new Set())
    } else {
      setOpenGroups(new Set(groups.map((g) => g.id)))
    }
  }, [groups, openGroups.size])



  const handleDeleteSelectedRows = useCallback(async () => {
    const selectedRowOriginals = table.getFilteredSelectedRowModel().rows.map(row => row.original as ExtendedRecordSchema);
    const idsToDelete = selectedRowOriginals.map(t => t.id);
    if (idsToDelete.length > 0) {
      try {
        await bulkDeleteMutation.mutateAsync(idsToDelete);
      } catch (error) {
        logger.error("Failed to delete selected transactions:", { origianlError: error })
      }
    }
  }, [table, bulkDeleteMutation]);

  const handleEditSelectedRows = useCallback(() => {
    setIsBulkEditDialogOpen(true);
  }, []);


  const handleClearSelection = useCallback(() => {
    table.resetRowSelection();
  }, [table]);

  // Filter handlers
  const handleFiltersChange = useCallback((newFilters: TransactionFilterState) => {
    setFilters(newFilters);
  }, []);

  const handleClearAllFilters = useCallback(() => {
    setFilters({});
  }, []);


  // Optimized row finding function
  const findRowByTransactionId = useCallback((transactionId: string) => {
    const index = transactionRowMap.get(transactionId);
    if (index !== undefined) {
      return table.getRowModel().rows[index];
    }
    return undefined;
  }, [transactionRowMap, table]);




  const page = transactions?.pagination.page ?? 1;
  const totalPages = transactions?.pagination.total_pages ?? 1;
  const canPreviousPage = page > 1;
  const canNextPage = page < totalPages;

  const selectedRows = table.getFilteredSelectedRowModel().rows;

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
        <div className="flex flex-1 items-center space-x-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search transactions..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="max-w-full bg-card md:max-w-full pl-10"
            />
            {isFetching && (
              <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
            )}
          </div>
          <TransactionFilterDropdown
            filters={filters}
            onFiltersChange={handleFiltersChange}
            onClearAll={handleClearAllFilters}
          />
        </div>
      </div>

      {/* Table Content */}
      <div>
        {/* Mobile View */}
        {isMobile ? (
        <div className="space-y-4">
          {groups.map((group) => (
            <div key={group.id} className="border rounded-md overflow-hidden">
              <div
                className="bg-muted/50 p-3 flex items-center justify-between cursor-pointer"
                onClick={() => toggleGroup(group.id)}
              >
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={group.transactions.every((t) => {
                      const row = findRowByTransactionId(t.id);
                      return row?.getIsSelected() ?? false;
                    })}
                    onCheckedChange={(value) => {
                      group.transactions.forEach((t) => {
                        const row = findRowByTransactionId(t.id);
                        if (row) {
                          row.toggleSelected(!!value);
                        }
                      });
                    }}
                    aria-label={`Select group ${group.id}`}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div className="font-medium">{formatDate(group.date)}</div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="font-medium">{formatCurrency(group.total)}</div>
                  {openGroups.has(group.id) ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                </div>
              </div>

              {openGroups.has(group.id) && (
                <div className="p-2 space-y-2">
                  {group.transactions.map((transaction) => {
                    const row = findRowByTransactionId(transaction.id);
                    if (!row) return null;

                    return (
                      <MemoizedTransactionCard
                        onEdit={handleOpenEditSheet}
                        key={transaction.id}
                        transaction={transaction}
                        row={row}
                        formatCurrency={formatCurrency}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        /* Desktop View */
        <div className="rounded-md border">
          <Table className="bg-white">
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.slice(1).map((header) => {
                    return header.id === "description" ? (
                      <TableHead key={header.id} style={{ width: header.getSize() + 30 }}>
                        <div className="flex w-[50px] items-center space-x-2 pl-4">
                          <div className="flex items-center space-x-1">
                            <Checkbox
                              checked={table.getIsAllPageRowsSelected()}
                              onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                              aria-label="Select all"
                              className="translate-y-[2px]"
                            />
                            <button onClick={toggleAllGroups} className="p-1">
                              {openGroups.size === groups.length ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                          <span className="text-muted-foreground">
                            {header.isPlaceholder
                              ? null
                              : flexRender(header.column.columnDef.header, header.getContext())}
                          </span>
                        </div>
                      </TableHead>
                    ) : (
                      <TableHead key={header.id} style={{ width: header.getSize() }} className="text-muted-foreground">
                        {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                      </TableHead>
                    )
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {groups.map((group) => (
                <Fragment key={`group-${group.id}`}>
                  <TableRow key={`group-header-${group.id}`}>
                    <TableCell colSpan={table.getVisibleLeafColumns().length} className="p-0">
                      <div className="bg-white mx-2 my-1 rounded-md border">
                        <div className="bg-muted flex items-center p-2">
                          <div className="flex  items-center space-x-1 pl-2">
                            <Checkbox
                              checked={group.transactions.every((t) => {
                                const row = findRowByTransactionId(t.id);
                                return row?.getIsSelected() ?? false;
                              })}
                              onCheckedChange={(value) =>
                                group.transactions.forEach((t) => {
                                  const row = findRowByTransactionId(t.id);
                                  if (row) {
                                    row.toggleSelected(!!value);
                                  }
                                })
                              }
                              aria-label={`Select group ${group.id}`}
                              className="translate-y-[2px]"
                            />
                            <button onClick={() => toggleGroup(group.id)} className="p-1">
                              {openGroups.has(group.id) ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                          <div className="flex-1 font-medium">{formatDate(group.date)}</div>
                          <div className="mr-4 text-right font-medium">{formatCurrency(group.total)}</div>
                        </div>

                        {openGroups.has(group.id) && (
                          <Table>
                            <TableBody>
                              {group.transactions.map((transaction) => {
                                const row = findRowByTransactionId(transaction.id);
                                if (!row) return null;

                                return (
                                  <TableRow
                                    key={`transaction-row-${transaction.id}`}
                                    data-state={row.getIsSelected() && "selected"}
                                  >
                                    {row.getVisibleCells().map((cell, cellIndex) => (
                                      <TableCell
                                        key={`cell-${cell.id}`}
                                        style={{
                                          width: cell.column.getSize(),
                                        }}
                                        className={cellIndex === 0 ? "pl-4" : ""}
                                      >
                                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                      </TableCell>
                                    ))}
                                  </TableRow>
                                );
                              })}
                            </TableBody>
                          </Table>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                </Fragment>
              ))}
              {groups.length === 0 && (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center">
                    No results.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-2 py-4">
        <div className="text-muted-foreground text-sm order-2 sm:order-1 sm:flex-1">
          {table.getFilteredSelectedRowModel().rows.length} of {transactions?.pagination.total_items} row(s) selected.
        </div>
        <div className="flex justify-between sm:justify-end space-x-2 order-1 sm:order-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(page - 1)}
            disabled={!canPreviousPage || isFetching}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(page + 1)}
            disabled={!canNextPage || isFetching}
          >
            Next
          </Button>
        </div>
      </div>

      <DeleteTransactionDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => {
          setIsDeleteDialogOpen(false);
          setDeletingTransactionId(null);
        }}
        transactionId={deletingTransactionId}
      />

      <FloatingActionBar
        selectedCount={selectedRows.length}
        onEdit={handleEditSelectedRows}
        onDelete={handleDeleteSelectedRows}
        onClear={handleClearSelection}
        isDeleting={bulkDeleteMutation.isPending}
      />

      <BulkEditDialog
        isOpen={isBulkEditDialogOpen}
        onClose={() => setIsBulkEditDialogOpen(false)}
        selectedTransactions={selectedRows.map(row => row.original)}
      />

      <EditTransactionSheet
        isOpen={isEditSheetOpen}
        onClose={() => {
          setIsEditSheetOpen(false);
          setEditingTransactionId(null);
        }}
        transactionId={editingTransactionId}
      />
    </div>
  );
}

export default RecordsTable
