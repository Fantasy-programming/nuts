import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard/accounts/$id')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/dashboard/accounts/$id"!</div>
}
