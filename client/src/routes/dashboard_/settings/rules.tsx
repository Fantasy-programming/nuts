import { createFileRoute } from '@tanstack/react-router'
import { RulesManagement } from '@/features/rules/components/rules-management'

export const Route = createFileRoute('/dashboard_/settings/rules')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <div className="container mx-auto py-6 px-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Transaction Rules</h1>
        <p className="text-gray-600 mt-1">
          Automatically categorize and organize your transactions based on custom rules
        </p>
      </div>
      <RulesManagement />
    </div>
  )
}
