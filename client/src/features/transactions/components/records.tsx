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
} from "@tanstack/react-table";
import { ChevronDown, ChevronRight, Filter } from "lucide-react";
import { getTransactions } from "@/features/transactions/services/transaction";
import { useSuspenseQuery } from "@tanstack/react-query";

import { Button } from "@/core/components/ui/button";
import { Checkbox } from "@/core/components/ui/checkbox";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from "@/core/components/ui/dropdown-menu";
import { Input } from "@/core/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/core/components/ui/table";
import { RecordsFilters } from "./records.filters";
import { useMemo, useState, useEffect, Fragment, useCallback } from "react";
import { formatDate } from "@/lib/utils";
import { recordsTableColumns } from "./records.column";

export const RecordsTable = () => {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);

  const [categoryFilters, setCategoryFilters] = useState<string[]>([]);
  const [accountFilters, setAccountFilters] = useState<string[]>([]);
  const [, setDateRangeFilter] = useState<string>("");
  const [searchFilter, setSearchFilter] = useState("");

  const {
    data: transactions,
    error,
    isFetching,
  } = useSuspenseQuery({
    queryKey: ["transactions"],
    queryFn: getTransactions,
  });

  if (error && !isFetching) {
    throw error;
  }

  const allTransactions = useMemo(() => {
    return transactions.flatMap((group) =>
      group.transactions.map((transaction) => ({
        ...transaction,
        groupId: group.id,
        groupDate: group.date,
        groupTotal: group.total,
      }))
    );
  }, [transactions]);

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


  const filteredGroups = useMemo(() => {
    return transactions
      .map((group) => {
        const filteredTransactions = group.transactions.filter((transaction) => {
          const matchesSearch = searchFilter
            ? Object.values(transaction).some((value) => String(value).toLowerCase().includes(searchFilter.toLowerCase()))
            : true;
          const matchesCategory = categoryFilters.length === 0 || categoryFilters.includes(transaction.category.id);
          const matchesAccount = accountFilters.length === 0 || accountFilters.includes(transaction.account.id);
          return matchesSearch && matchesCategory && matchesAccount;
        });
        return {
          ...group,
          transactions: filteredTransactions,
        };
      })
      .filter((group) => group.transactions.length > 0);
  }, [transactions, searchFilter, categoryFilters, accountFilters]);

  const handleCategoryChange = useCallback((values: string[]) => {
    setCategoryFilters(values);
  }, []);

  const handleAccountChange = (values: string[]) => {
    setAccountFilters(values);
  };

  const handleDateRangeChange = (value: string) => {
    setDateRangeFilter(value);
  };

  const handleResetFilters = () => {
    setCategoryFilters([]);
    setAccountFilters([]);
    setDateRangeFilter("");
    setSearchFilter("");
    table.resetColumnFilters();
  };

  const toggleAllGroups = useCallback(() => {
    if (openGroups.size === filteredGroups.length) {
      setOpenGroups(new Set());
    } else {
      setOpenGroups(new Set(filteredGroups.map((g) => g.id)));
    }
  }, [filteredGroups, openGroups.size]);

  const categories = useMemo(() => Array.from(new Set(allTransactions.map((t) => t.category.id))), [allTransactions]);

  const accounts = useMemo(() => Array.from(new Set(allTransactions.map((t) => t.account.id))), [allTransactions]);

  useEffect(() => {
    if (searchFilter || categoryFilters.length > 0 || accountFilters.length > 0) {
      setOpenGroups(new Set(filteredGroups.map((g) => g.id)));
    }
  }, [filteredGroups, searchFilter, categoryFilters, accountFilters]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex flex-1 items-center space-x-2">
          <Input placeholder="Search transactions..." value={searchFilter} onChange={(event) => setSearchFilter(event.target.value)} className="max-w-sm" />
          <Button variant="outline" size="sm" className={showFilters ? "bg-secondary" : ""} onClick={() => setShowFilters(!showFilters)}>
            <Filter className="mr-2 h-4 w-4" />
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
                  );
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
              {table
                .getVisibleLeafColumns()
                .slice(1)
                .map((column) => {
                  return column.id === "description" ? (
                    <>
                      <TableHead key={column.id} style={{ width: column.getSize() + 30 }}>
                        <div className="flex w-[50px] items-center space-x-2 pl-4">
                          <div className="flex items-center space-x-1">
                            <Checkbox
                              checked={table.getIsAllPageRowsSelected()}
                              onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                              aria-label="Select all"
                              className="translate-y-[2px]"
                            />
                            <button onClick={toggleAllGroups} className="p-1">
                              {openGroups.size === filteredGroups.length ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                            </button>
                          </div>
                          <span>{flexRender(column.columnDef.header, {})} </span>
                        </div>
                      </TableHead>
                    </>
                  ) : (
                    <TableHead key={column.id} style={{ width: column.getSize() }}>
                      {flexRender(column.columnDef.header, {})}
                    </TableHead>
                  );
                })}
            </TableRow>
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
                                ?.getIsSelected()
                            )}
                            onCheckedChange={(value) =>
                              group.transactions.forEach((t) => {
                                const row = table.getRowModel().rows.find((r) => r.original.id === t.id);
                                if (row) {
                                  row.toggleSelected(!!value);
                                }
                              })
                            }
                            aria-label={`Select group ${group.id}`}
                            className="translate-y-[2px]"
                          />
                          <button onClick={() => toggleGroup(group.id)} className="p-1">
                            {openGroups.has(group.id) ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                          </button>
                        </div>
                        <div className="flex-1 font-medium">{formatDate(group.date)}</div>
                        <div className="mr-4 text-right font-medium">
                          {new Intl.NumberFormat("en-US", {
                            style: "currency",
                            currency: "USD",
                          }).format(group.total)}
                        </div>
                      </div>

                      {/* Subtable for transactions */}
                      {openGroups.has(group.id) && (
                        <Table>
                          <TableBody>
                            {group.transactions.map((transaction) => {
                              const row = table.getRowModel().rows.find((r) => r.original.id === transaction.id);
                              if (!row) return null;
                              return (
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
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="text-muted-foreground flex-1 text-sm">
          {table.getFilteredSelectedRowModel().rows.length} of {table.getFilteredRowModel().rows.length} row(s) selected.
        </div>
        <div className="space-x-2">
          <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
            Previous
          </Button>
          <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
            Next
          </Button>
        </div>
      </div>
    </div>
  );
};

export default RecordsTable;
