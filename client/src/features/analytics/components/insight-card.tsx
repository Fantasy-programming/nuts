import type React from "react"

import { Star } from "lucide-react"
import { Card, CardContent } from "@/core/components/ui/card"
import { Badge } from "@/core/components/ui/badge"
import { Button } from "@/core/components/ui/button"

interface InsightCardProps {
  insight: {
    id: string
    title: string
    description: string
    icon: React.ElementType
    color: string
    badge: string
    badgeColor: string
  }
  isFavorite: boolean
  onToggleFavorite: () => void
}

export default function InsightCard({ insight, isFavorite, onToggleFavorite }: InsightCardProps) {
  const Icon = insight.icon

  return (
    <Card className="overflow-hidden transition-all hover:shadow-md">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div
              className={`rounded-full p-2 ${insight.color.replace("text-", "bg-").replace("500", "100")} dark:bg-opacity-20`}
            >
              <Icon className={`h-4 w-4 ${insight.color}`} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-medium">{insight.title}</h3>
                <Badge className={insight.badgeColor}>{insight.badge}</Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-1">{insight.description}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-primary"
            onClick={onToggleFavorite}
          >
            <Star className={`h-4 w-4 ${isFavorite ? "fill-yellow-400 text-yellow-400" : ""}`} />
            <span className="sr-only">{isFavorite ? "Remove from favorites" : "Add to favorites"}</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

