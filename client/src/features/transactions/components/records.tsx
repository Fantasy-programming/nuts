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
import { ChevronDown, ChevronRight, Filter, Plus, Minus } from "lucide-react"

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
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "@/core/components/ui/context-menu";
import { Input } from "@/core/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/core/components/ui/table"
import { RecordsFilters } from "./records.filters"
import { formatDate } from "@/lib/utils"
import { recordsTableColumns } from "./records.column"
import { useIsMobile } from "@/core/hooks/use-mobile"
import { Avatar, AvatarFallback } from "@/core/components/ui/avatar"
import { Card, CardContent } from "@/core/components/ui/card"
import { Badge } from "@/core/components/ui/badge"
import { GrouppedRecordsArraySchema, RecordSchema } from "../services/transaction.types"
import EditTransactionSheet from "./edit-records-sheet"
import DeleteTransactionDialog from "./delete-records-dialog"

export const RecordsTable = ({ transactions }: { transactions: GrouppedRecordsArraySchema }) => {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = useState({})
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set())
  const [showFilters, setShowFilters] = useState(false)

  const [categoryFilters, setCategoryFilters] = useState<string[]>([])
  const [accountFilters, setAccountFilters] = useState<string[]>([])
  const [, setDateRangeFilter] = useState<string>("")
  const [searchFilter, setSearchFilter] = useState("")


  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedTransaction, setSelectedTransaction] = useState<RecordSchema | null>(null)

  const isMobile = useIsMobile()

  const allTransactions = useMemo(() => {
    return transactions.flatMap((group) =>
      group.transactions.map((transaction) => ({
        ...transaction,
        groupId: group.id,
        groupDate: group.date,
        groupTotal: group.total,
      })),
    )
  }, [transactions])

  const table = useReactTable({
    data: allTransactions,
    columns: recordsTableColumns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
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

  const filteredGroups = useMemo(() => {
    return transactions
      .map((group) => {
        const filteredTransactions = group.transactions.filter((transaction) => {
          const matchesSearch = searchFilter
            ? Object.values(transaction).some((value) =>
              String(value).toLowerCase().includes(searchFilter.toLowerCase()),
            )
            : true
          const matchesCategory = categoryFilters.length === 0 || categoryFilters.includes(transaction.category.id)
          const matchesAccount = accountFilters.length === 0 || accountFilters.includes(transaction.account.id)
          return matchesSearch && matchesCategory && matchesAccount
        })
        return {
          ...group,
          transactions: filteredTransactions,
        }
      })
      .filter((group) => group.transactions.length > 0)
  }, [transactions, searchFilter, categoryFilters, accountFilters])

  const handleCategoryChange = useCallback((values: string[]) => {
    setCategoryFilters(values)
  }, [])

  const handleAccountChange = (values: string[]) => {
    setAccountFilters(values)
  }

  const handleDateRangeChange = (value: string) => {
    setDateRangeFilter(value)
  }

  const handleResetFilters = () => {
    setCategoryFilters([])
    setAccountFilters([])
    setDateRangeFilter("")
    setSearchFilter("")
    table.resetColumnFilters()
  }

  const toggleAllGroups = useCallback(() => {
    if (openGroups.size === filteredGroups.length) {
      setOpenGroups(new Set())
    } else {
      setOpenGroups(new Set(filteredGroups.map((g) => g.id)))
    }
  }, [filteredGroups, openGroups.size])

  const categories = useMemo(() => Array.from(new Set(allTransactions.map((t) => t.category.id))), [allTransactions])

  const accounts = useMemo(() => Array.from(new Set(allTransactions.map((t) => t.account.id))), [allTransactions])

  useEffect(() => {
    if (searchFilter || categoryFilters.length > 0 || accountFilters.length > 0) {
      setOpenGroups(new Set(filteredGroups.map((g) => g.id)))
    }
  }, [filteredGroups, searchFilter, categoryFilters, accountFilters])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount)
  }


  //  Update the handleEditTransaction function to use Sheet instead of Modal
  const handleEditTransaction = (id: number) => {

    setIsEditModalOpen(true)
    // if (transaction) {
    //   setSelectedTransaction(transaction)
    //   setIsEditModalOpen(true)
    // }
  }

  const handleUpdateTransaction = (id: string, updatedTransaction: RecordSchema) => {
    // setTransactions(transactions.map((t) => (t.id === id ? { ...t, ...updatedTransaction } : t)))
  }

  const openDeleteDialog = (id: string) => {
    setIsDeleteDialogOpen(true)
    // const transaction = transactions.find((t) => t.id === id)
    // if (transaction) {
    //   setSelectedTransaction(transaction)
    //   setIsDeleteDialogOpen(true)
    // }
  }

  const handleDeleteTransaction = (id: number) => {
    setTransactions(transactions.filter((t) => t.id !== id))
    setSelectedTransactions(selectedTransactions.filter((t) => t !== id))
  }

  const handleDeleteSelected = () => {
    setTransactions(transactions.filter((t) => !selectedTransactions.includes(t.id)))
    setSelectedTransactions([])
  }



  const menuContent = (
    <ContextMenuContent >
      <ContextMenuItem >
        Edit
      </ContextMenuItem>
      <ContextMenuItem >
        Delete
      </ContextMenuItem>
    </ContextMenuContent>
  );


  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
        <div className="flex flex-1 items-center space-x-2">
          <Input
            placeholder="Search transactions..."
            value={searchFilter}
            onChange={(event) => setSearchFilter(event.target.value)}
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

      {showFilters && (
        <RecordsFilters
          onCategoryChange={handleCategoryChange}
          onAccountChange={handleAccountChange}
          onDateRangeChange={handleDateRangeChange}
          onReset={handleResetFilters}
          categories={categories}
          accounts={accounts}
        />
      )}

      {/* Mobile View */}
      {isMobile ? (
        <div className="space-y-4">
          {filteredGroups.map((group) => (
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
                              {openGroups.size === filteredGroups.length ? (
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
              {filteredGroups.map((group) => (
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
                                    {menuContent}
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
            </TableBody>
          </Table>


          {/* Modals */}
          {/* <AddTransactionModal */}
          {/*   isOpen={isAddModalOpen} */}
          {/*   onClose={() => setIsAddModalOpen(false)} */}
          {/*   onAddTransaction={handleAddTransaction} */}
          {/*   categories={categories} */}
          {/*   accounts={accounts} */}
          {/* /> */}

          <EditTransactionSheet
            isOpen={isEditModalOpen}
            onClose={() => setIsEditModalOpen(false)}
            transaction={selectedTransaction}
            onUpdateTransaction={handleUpdateTransaction}
            categories={categories}
            accounts={accounts}
          />

          <DeleteTransactionDialog
            isOpen={isDeleteDialogOpen}
            onClose={() => setIsDeleteDialogOpen(false)}
            transaction={selectedTransaction}
            onDeleteTransaction={handleDeleteTransaction}
          />
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-2 py-4">
        <div className="text-muted-foreground text-sm order-2 sm:order-1 sm:flex-1">
          {table.getFilteredSelectedRowModel().rows.length} of {table.getFilteredRowModel().rows.length} row(s)
          selected.
        </div>
        <div className="flex justify-between sm:justify-end space-x-2 order-1 sm:order-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}

export default RecordsTable

