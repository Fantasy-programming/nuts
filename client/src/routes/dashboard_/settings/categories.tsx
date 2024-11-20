import * as React from 'react'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard_/settings/categories')({
  component: RouteComponent,
})

function RouteComponent() {
  return 'Hello /dashboard/settings/categories!'
}
