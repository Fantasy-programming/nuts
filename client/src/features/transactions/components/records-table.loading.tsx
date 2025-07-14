import { Skeleton } from "@/core/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/core/components/ui/table"

export default function TransactionsLoading() {
  return (
    <div className="space-y-4">
      {/* Search and filters skeleton */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
        <div className="flex flex-1 items-center space-x-2">
          <Skeleton className="h-9 w-full md:max-w-sm" />
          <Skeleton className="h-9 w-20" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-24" />
        </div>
      </div>

      {/* Table skeleton */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Skeleton className="h-4 w-4" />
              </TableHead>
              <TableHead className="w-80">
                <Skeleton className="h-4 w-24" />
              </TableHead>
              <TableHead className="w-40">
                <Skeleton className="h-4 w-16" />
              </TableHead>
              <TableHead className="w-32 text-right">
                <Skeleton className="h-4 w-16 ml-auto" />
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array(8).fill(0).map((_, i) => (
              <TableRow key={i}>
                <TableCell>
                  <Skeleton className="h-4 w-4" />
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-3">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="flex flex-col space-y-1">
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Skeleton className="h-6 w-20 rounded-full" />
                </TableCell>
                <TableCell className="text-right">
                  <Skeleton className="h-4 w-16 ml-auto" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-2 py-4">
        <div className="text-sm order-2 sm:order-1 sm:flex-1">
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="flex justify-between sm:justify-end space-x-2 order-1 sm:order-2">
          <Skeleton className="h-9 w-20" />
          <Skeleton className="h-9 w-16" />
        </div>
      </div>
    </div>
  )
}

