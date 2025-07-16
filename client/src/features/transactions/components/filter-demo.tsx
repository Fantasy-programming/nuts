import { useState } from "react"
import { TransactionFilters, type TransactionFilterState } from "./transaction-filters"

export function FilterDemo() {
  const [filters, setFilters] = useState<TransactionFilterState>({})

  const handleFiltersChange = (newFilters: TransactionFilterState) => {
    setFilters(newFilters)
  }

  const handleClearAll = () => {
    setFilters({})
  }

  return (
    <div className="p-6 max-w-md">
      <h2 className="text-lg font-semibold mb-4">Transaction Filters Demo</h2>
      <TransactionFilters
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onClearAll={handleClearAll}
      />
      
      <div className="mt-6 p-4 bg-gray-50 rounded-md">
        <h3 className="font-medium mb-2">Current Filters:</h3>
        <pre className="text-sm text-gray-600">
          {JSON.stringify(filters, null, 2)}
        </pre>
      </div>
    </div>
  )
}