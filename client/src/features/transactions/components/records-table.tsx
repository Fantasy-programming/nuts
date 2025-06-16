import { useMemo, useState, useEffect, Fragment, useCallback } from "react"
import {
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"

import { ChevronDown, ChevronRight, Filter, Plus, Minus, Trash2 } from "lucide-react"
import { Button } from "@/core/components/ui/button"
import { Checkbox } from "@/core/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/core/components/ui/dropdown-menu"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/core/components/ui/context-menu";
import { Input } from "@/core/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/core/components/ui/table"
import { formatDate } from "@/lib/utils"
import { getRecordsTableColumns } from "./records-table.column"
import { useIsMobile } from "@/core/hooks/use-mobile"
import { Avatar, AvatarFallback } from "@/core/components/ui/avatar"
import { Card, CardContent } from "@/core/components/ui/card"
import { Badge } from "@/core/components/ui/badge"
import { TransactionsResponse, RecordSchema, GrouppedRecordsArraySchema } from "../services/transaction.types"
// import EditTransactionSheet from "./edt-records-sheet"
import { DeleteTransactionDialog } from "./del-records-dialog"
import { Switch } from "@/core/components/ui/switch"; // For toggling grouping
import { Label } from "@/core/components/ui/label";

interface RecordsTableProps {
  response?: TransactionsResponse; // Make optional to handle initial loading state
  isLoading: boolean;
  isDeleting?: boolean;
  isUpdating?: boolean;

  // State and setters from parent
  search: string;
  groupBy: "date" | "";
  setSearch: (value: string) => void;
  setPage: (page: number) => void;
  setGroupBy: (value: "date" | "") => void;

  // Mutation functions
  // onUpdateTransaction: (params: { id: string; data: any }) => void;
  onDeleteTransaction: (id: string | string[]) => void;
}


export const RecordsTable = ({
  response,
  isLoading,
  isDeleting,
  isUpdating,
  search,
  groupBy,
  setSearch,
  setPage,
  setGroupBy,
  onDeleteTransaction,
}: RecordsTableProps) => {
  // --- Local UI State Only ---


  const [sorting, setSorting] = useState<SortingState>([])
  const [rowSelection, setRowSelection] = useState({})
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set())


  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [showFilters, setShowFilters] = useState(false)
  const [deletingTransaction, setDeletingTransaction] = useState<RecordSchema | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const isMobile = useIsMobile()
  // const [editingTransaction, setEditingTransaction] = useState<RecordSchema | null>(null)
  // const [isEditSheetOpen, setIsEditSheetOpen] = useState(false)

  const isGrouped = groupBy === 'date';

  const groups = useMemo(() => {
    if (!response?.data) return [];

    if (isGrouped) {
      return response.data as GrouppedRecordsArraySchema;
    }

    return [{
      id: "all-transactions",
      date: new Date(), // Dummy date, won't be displayed
      total: 0, // Total is not relevant in flat view
      transactions: response.data,
    }];

  }, [response, isGrouped]);

  const allTransactions = useMemo(() => {
    return groups.flatMap((group) => group.transactions);
  }, [groups]);


  // const allTransactions = useMemo(() => {
  //   return transactions.flatMap((group) =>
  //     group.transactions.map((transaction) => ({
  //       ...transaction,
  //       groupId: group.id,
  //       groupDate: group.date,
  //       groupTotal: group.total,
  //     })),
  //   )
  // }, [transactions])


  // const handleOpenEditSheet = (transaction: RecordSchema) => {
  //   setEditingTransaction(transaction)
  //   setIsEditSheetOpen(true)
  // }

  const handleOpenDeleteDialog = useCallback((transaction: RecordSchema) => {
    setDeletingTransaction(transaction);
    setIsDeleteDialogOpen(true);
  }, []);

  const columns = useMemo(
    () => getRecordsTableColumns({
      onEdit: () => { /* handleOpenEditSheet */ },
      onDelete: handleOpenDeleteDialog,
    }),
    [handleOpenDeleteDialog]
  );

  const table = useReactTable({
    data: allTransactions,
    columns: columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    // getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    // onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    // onSortingChange: setSorting,
    //  onRowSelectionChange: setRowSelection,
    //  getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: response?.pagination.total_pages ?? -1,
    state: { sorting, rowSelection },
  })

  const toggleGroup = useCallback((groupId: string) => {
    setOpenGroups((prev) => {
      const next = new Set(prev)
      if (next.has(groupId)) {
        next.delete(groupId)
      } else {
        next.add(groupId)
      }
      return next
    })
  }, [])


  const toggleAllGroups = useCallback(() => {
    if (openGroups.size === groups.length) {
      setOpenGroups(new Set())
    } else {
      setOpenGroups(new Set(groups.map((g) => g.id)))
    }
  }, [groups, openGroups.size])

  //
  //
  // useEffect(() => {
  //   if (searchFilter || categoryFilters.length > 0 || accountFilters.length > 0 || dateRangeFilterValue) {
  //     setOpenGroups(new Set(filteredGroups.map((g) => g.id)))
  //   }
  // }, [filteredGroups, searchFilter, categoryFilters, accountFilters, dateRangeFilterValue])
  //
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD", // Consider making this dynamic or a prop
    }).format(amount)
  }


  // Called by EditTransactionSheet on submit
  // const handleConfirmUpdateTransaction = async (id: string, data: RecordSchema) => {
  //   try {
  //     await onUpdateTransaction({ id, data });
  //     setIsEditSheetOpen(false)
  //     setEditingTransaction(null)
  //     // Optionally: show success toast
  //   } catch (error) {
  //     // Optionally: show error toast from EditTransactionSheet or here
  //     console.error("Failed to update transaction:", error);
  //   }
  // }

  // Called by DeleteTransactionDialog on confirm
  const handleConfirmDeleteTransaction = async (id: string) => {
    try {
      await onDeleteTransaction(id);
      setIsDeleteDialogOpen(false)
      setDeletingTransaction(null)
      // Optionally: show success toast
    } catch (error) {
      // Optionally: show error toast
      console.error("Failed to delete transaction:", error);
    }
  }

  const handleDeleteSelectedRows = async () => {
    const selectedRowOriginals = table.getFilteredSelectedRowModel().rows.map(row => row.original as RecordSchema);
    const idsToDelete = selectedRowOriginals.map(t => t.id);
    if (idsToDelete.length > 0) {
      try {
        await onDeleteTransaction(idsToDelete);
        table.resetRowSelection(); // Clear selection
        // Optionally: show success toast
      } catch (error) {
        // Optionally: show error toast
        console.error("Failed to delete selected transactions:", error);
      }
    }
  }
  const page = response?.pagination.page ?? 1;
  const totalPages = response?.pagination.total_pages ?? 1;
  const canPreviousPage = page > 1;
  const canNextPage = page < totalPages;

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
        <div className="flex flex-1 items-center space-x-2">
          <Input
            placeholder="Search transactions..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="max-w-full md:max-w-sm"
          />
          <Button
            variant="outline"
            size="sm"
            className={showFilters ? "bg-secondary" : ""}
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Filters</span>
          </Button>
        </div>
        <div className="flex items-center gap-2">
          {table.getFilteredSelectedRowModel().rows.length > 0 && !isMobile && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDeleteSelectedRows}
              disabled={isDeleting || table.getFilteredSelectedRowModel().rows.length === 0}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete ({table.getFilteredSelectedRowModel().rows.length})
            </Button>
          )}
          {!isMobile && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="ml-auto">
                  Columns <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {table
                  .getAllColumns()
                  .filter((column) => column.getCanHide())
                  .map((column) => {
                    return (
                      <DropdownMenuCheckboxItem
                        key={column.id}
                        className="capitalize"
                        checked={column.getIsVisible()}
                        onCheckedChange={(value) => column.toggleVisibility(!!value)}
                      >
                        {column.id}
                      </DropdownMenuCheckboxItem>
                    )
                  })}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>




      {/* {showFilters && ( */}
      {/*   <RecordsFilters */}
      {/*     onCategoryChange={handleCategoryChange} */}
      {/*     onAccountChange={handleAccountChange} */}
      {/*     onDateRangeChange={handleDateRangeChange} */}
      {/*     onReset={handleResetFilters} */}
      {/*     categories={categories} */}
      {/*     accounts={accounts} */}
      {/*   /> */}
      {/* )} */}

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
                    checked={group.transactions.every((t) =>
                      table
                        .getRowModel()
                        .rows.find((r) => r.original.id === t.id)
                        ?.getIsSelected(),
                    )}
                    onCheckedChange={(value) => {
                      group.transactions.forEach((t) => {
                        const row = table.getRowModel().rows.find((r) => r.original.id === t.id)
                        if (row) {
                          row.toggleSelected(!!value)
                        }
                      })
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
                    const row = table.getRowModel().rows.find((r) => r.original.id === transaction.id)
                    if (!row) return null

                    return (
                      <Card key={transaction.id} className={row.getIsSelected() ? "border-primary" : ""}>
                        <CardContent className="p-3">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-2 pt-1">
                              <Checkbox
                                checked={row.getIsSelected()}
                                onCheckedChange={(value) => row.toggleSelected(!!value)}
                                aria-label={`Select transaction ${transaction.id}`}
                              />
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  {transaction?.details?.payment_status && (
                                    <Avatar className="h-6 w-6">
                                      <AvatarFallback>NW</AvatarFallback>
                                    </Avatar>
                                  )}
                                  <span className="font-medium">{transaction.description}</span>
                                </div>
                                <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                                  <Badge variant="outline">{transaction.category.name}</Badge>
                                  <Badge variant="outline">{transaction.account.name}</Badge>
                                </div>
                              </div>
                            </div>
                            <div className="font-medium">{formatCurrency(Number(transaction.amount))}</div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        /* Desktop View */
        <div className="rounded-md border">
          <Table>
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
                          <span>
                            {header.isPlaceholder
                              ? null
                              : flexRender(header.column.columnDef.header, header.getContext())}
                          </span>
                        </div>
                      </TableHead>
                    ) : (
                      <TableHead key={header.id} style={{ width: header.getSize() }}>
                        {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                      </TableHead>
                    )
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {groups.map((group) => (
                <Fragment key={group.id}>
                  <TableRow>
                    <TableCell colSpan={table.getVisibleLeafColumns().length} className="p-0">
                      <div className="bg-background mx-2 my-1 rounded-md border">
                        {/* Group header as custom div instead of table row */}
                        <div className="bg-muted/50 flex items-center p-2">
                          <div className="flex w-[50px] items-center space-x-1 pl-2">
                            <Checkbox
                              checked={group.transactions.every((t) =>
                                table
                                  .getRowModel()
                                  .rows.find((r) => r.original.id === t.id)
                                  ?.getIsSelected(),
                              )}
                              onCheckedChange={(value) =>
                                group.transactions.forEach((t) => {
                                  const row = table.getRowModel().rows.find((r) => r.original.id === t.id)
                                  if (row) {
                                    row.toggleSelected(!!value)
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

                        {/* Subtable for transactions */}
                        {openGroups.has(group.id) && (
                          <Table>
                            <TableBody>
                              {group.transactions.map((transaction) => {
                                const row = table.getRowModel().rows.find((r) => r.original.id === transaction.id)
                                if (!row) return null
                                const originalTransaction = row.original as RecordSchema;
                                return (
                                  <ContextMenu>
                                    <ContextMenuTrigger asChild>
                                      <TableRow key={transaction.id} data-state={row.getIsSelected() && "selected"}>
                                        {row.getVisibleCells().map((cell, cellIndex) => (
                                          <TableCell
                                            key={cell.id}
                                            style={{
                                              width: cell.column.getSize(),
                                            }}
                                            className={cellIndex === 0 ? "pl-4" : ""}
                                          >
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                          </TableCell>
                                        ))}
                                      </TableRow>
                                    </ContextMenuTrigger>
                                    <ContextMenuContent>
                                      <ContextMenuItem onSelect={() => handleOpenEditSheet(originalTransaction)} disabled={isUpdating}>
                                        Edit
                                      </ContextMenuItem>
                                      <ContextMenuItem onSelect={() => handleOpenDeleteDialog(originalTransaction)} disabled={isDeleting} className="text-destructive">
                                        Delete
                                      </ContextMenuItem>
                                    </ContextMenuContent>
                                  </ContextMenu>
                                )
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

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-2 py-4">
        <div className="text-muted-foreground text-sm order-2 sm:order-1 sm:flex-1">
          {table.getFilteredSelectedRowModel().rows.length} of {response?.pagination.total_items} row(s) selected.
        </div>
        <div className="flex justify-between sm:justify-end space-x-2 order-1 sm:order-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(page - 1)}
            disabled={!canPreviousPage || isLoading}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(page + 1)}
            disabled={!canNextPage || isLoading}
          >
            Next
          </Button>
        </div>
      </div>



      <DeleteTransactionDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => { setIsDeleteDialogOpen(false); setDeletingTransaction(null); }}
        transaction={deletingTransaction}
        onDeleteTransaction={handleConfirmDeleteTransaction} // This now calls the prop
        isDeleting={isDeleting}
      />
      {/* <EditTransactionSheet */}
      {/*   isOpen={isEditSheetOpen} */}
      {/*   onClose={() => { setIsEditSheetOpen(false); setEditingTransaction(null); }} */}
      {/*   transaction={editingTransaction} */}
      {/*   onUpdateTransaction={handleConfirmUpdateTransaction} // This now calls the prop */}
      {/*   // Pass accounts and categories if EditTransactionSheet needs them for dropdowns */}
      {/*   accounts={accounts} */}
      {/*   categories={categories} */}
      {/*   isSubmitting={isUpdating} */}
      {/* /> */}
    </div >
  )
}

export default RecordsTable
