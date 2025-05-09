import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard_/settings/features')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/dashboard_/settings/features"!</div>
}
