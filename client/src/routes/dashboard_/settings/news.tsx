import { createFileRoute } from '@tanstack/react-router'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export const Route = createFileRoute('/dashboard_/settings/news')({
  component: RouteComponent,
})

const updates = [
  {
    version: '1.2.0',
    date: '2024-03-20',
    type: 'feature',
    title: 'Draggable Dashboard Charts',
    description:
      'You can now rearrange charts on your dashboard by dragging them.',
  },
  {
    version: '1.1.5',
    date: '2024-03-15',
    type: 'improvement',
    title: 'Enhanced Category Management',
    description:
      'Added support for subcategories and improved category organization.',
  },
  {
    version: '1.1.0',
    date: '2024-03-10',
    type: 'feature',
    title: 'Dark Mode Support',
    description: 'Added dark mode support with system theme detection.',
  },
  {
    version: '1.0.5',
    date: '2024-03-05',
    type: 'fix',
    title: 'Bug Fixes',
    description: 'Fixed various UI issues and improved performance.',
  },
]

function RouteComponent() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>What's New</CardTitle>
          <CardDescription>
            Latest updates and improvements to the platform
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {updates.map((update, index) => (
            <div
              key={index}
              className="relative pl-4 pb-6 last:pb-0 before:absolute before:left-0 before:top-2 before:h-[calc(100%-12px)] before:w-[2px] before:bg-muted last:before:hidden"
            >
              <div className="absolute left-0 top-2 h-2 w-2 -translate-x-[3px] rounded-full bg-primary" />
              <div className="flex items-center gap-2 text-sm">
                <span className="font-semibold">v{update.version}</span>
                <span className="text-muted-foreground">{update.date}</span>
                <Badge
                  variant={
                    update.type === 'feature'
                      ? 'default'
                      : update.type === 'improvement'
                        ? 'secondary'
                        : 'destructive'
                  }
                >
                  {update.type}
                </Badge>
              </div>
              <h3 className="mt-2 font-medium">{update.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {update.description}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
