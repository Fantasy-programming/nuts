import * as React from 'react'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard_/settings/webhook')({
  component: RouteComponent,
})

function RouteComponent() {
  return 'Hello /dashboard/settings/webhook!'
}
