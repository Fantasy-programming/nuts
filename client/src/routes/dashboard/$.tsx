import { createFileRoute } from '@tanstack/react-router'
import PluginComponent from '@/core/components/PluginComponent';

export const Route = createFileRoute('/dashboard/$')({
  component: PluginComponent,
})
