import {
  type ColumnDef,
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
import { ChevronDown, ChevronRight, Filter } from "lucide-react"
import { getTransactions } from "@/features/transactions/services/transaction";
import { useSuspenseQuery } from "@tanstack/react-query";

import { Button } from "@/core/components/ui/button"
import { Checkbox } from "@/core/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/core/components/ui/dropdown-menu"
import { Input } from "@/core/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/core/components/ui/table"
import { RecordsFilters } from "./records-filters"
import type { RecordSchema } from "@/features/transactions/services/transaction.types";
import { useMemo, useState, useEffect, Fragment } from "react";


export const RecordsTable = () => {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = useState({})
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set())
  const [showFilters, setShowFilters] = useState(false)

  const [categoryFilters, setCategoryFilters] = useState<string[]>([])
  const [accountFilters, setAccountFilters] = useState<string[]>([])
  const [dateRangeFilter, setDateRangeFilter] = useState<string>("")
  const [searchFilter, setSearchFilter] = useState("")


  const { data: transactions, error, isFetching } = useSuspenseQuery({
    queryKey: ["transactions"],
    queryFn: getTransactions,
  });

  if (error && !isFetching) {
    throw error
  }


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

  const columns: ColumnDef<RecordSchema & { groupId: string; groupDate: Date; groupTotal: number }>[] = [
    {
      id: "select",
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
      header: () => <div className="text-right">Amount</div>,
      cell: ({ row }) => {
        const amount = Number.parseFloat(row.getValue("amount"))
        const formatted = new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
        }).format(amount)
        return <div className="text-right font-medium">{formatted}</div>
      },
    },
    {
      accessorKey: "date",
      header: "Date",
    },
    {
      accessorKey: "category",
      header: "Category",
    },
    {
      accessorKey: "account",
      header: "Account",
    },
  ]

  const table = useReactTable({
    data: allTransactions,
    columns,
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

  const toggleGroup = (groupId: string) => {
    setOpenGroups((prev) => {
      const next = new Set(prev)
      if (next.has(groupId)) {
        next.delete(groupId)
      } else {
        next.add(groupId)
      }
      return next
    })
  }

  const toggleAllGroups = () => {
    if (openGroups.size === filteredGroups.length) {
      setOpenGroups(new Set())
    } else {
      setOpenGroups(new Set(filteredGroups.map((g) => g.id)))
    }
  }

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

  const handleCategoryChange = (values: string[]) => {
    setCategoryFilters(values)
  }

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

  const categories = useMemo(() => Array.from(new Set(allTransactions.map((t) => t.category.id))), [allTransactions])

  const accounts = useMemo(() => Array.from(new Set(allTransactions.map((t) => t.account.id))), [allTransactions])

  useEffect(() => {
    if (searchFilter || categoryFilters.length > 0 || accountFilters.length > 0) {
      setOpenGroups(new Set(filteredGroups.map((g) => g.id)))
    }
  }, [filteredGroups, searchFilter, categoryFilters, accountFilters])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex flex-1 items-center space-x-2">
          <Input
            placeholder="Search transactions..."
            value={searchFilter}
            onChange={(event) => setSearchFilter(event.target.value)}
            className="max-w-sm"
          />
          <Button
            variant="outline"
            size="sm"
            className={showFilters ? "bg-secondary" : ""}
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
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
        </div>
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

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow> 
               <TableHead className="w-[50px]"> 
                 <div className="flex items-center space-x-2"> 
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
               </TableHead> 
               {table 
                 .getVisibleLeafColumns() 
                 .slice(1) 
                 .map((column) => ( 
                   <TableHead key={column.id} className={column.id === "amount" ? "text-right" : ""}> 
                     {flexRender(column.columnDef.header, {})} 
                   </TableHead> 
                 ))} 
             </TableRow>
             {/* {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}  */}
          </TableHeader>
          <TableBody>
            {filteredGroups.map((group) => (
              <Fragment key={group.id}>
                <TableRow>
                  <TableCell colSpan={table.getVisibleLeafColumns().length} className="p-0">
                    <div className="bg-background rounded-md mx-2 my-1 border">
                      <Table>
                        <TableBody>
                          <TableRow className="bg-muted/50">
                            <TableCell className="w-[50px]">
                              <div className="flex items-center space-x-2">
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
                            </TableCell>
                            <TableCell>
                              <span className="font-medium">{group.date.getDate()}</span>
                            </TableCell>
                            {table
                              .getVisibleLeafColumns()
                              .slice(2)
                              .map((column) => (
                                <TableCell key={column.id} className={column.id === "account" ? "text-right" : ""}>
                                  {column.id === "account" && <span className="font-medium">{group.total}</span>}
                                </TableCell>
                              ))}
                          </TableRow>
                          {openGroups.has(group.id) &&
                            group.transactions.map((transaction) => {
                              const row = table.getRowModel().rows.find((r) => r.original.id === transaction.id)
                              if (!row) return null
                              return (
                                <TableRow key={transaction.id} data-state={row.getIsSelected() && "selected"}>
                                  {row.getVisibleCells().map((cell) => (
                                    <TableCell
                                      key={cell.id}
                                      className={cell.column.id === "amount" ? "text-right" : ""}
                                    >
                                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                    </TableCell>
                                  ))}
                                </TableRow>
                              )
                            })}
                        </TableBody>
                      </Table>
                    </div>
                  </TableCell>
                </TableRow>
              </Fragment>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length} of {table.getFilteredRowModel().rows.length} row(s)
          selected.
        </div>
        <div className="space-x-2">
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
