import * as React from 'react'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard_/settings/preferences')({
  component: RouteComponent,
})

function RouteComponent() {
  return 'Hello /dashboard/settings/preferences!'
}
