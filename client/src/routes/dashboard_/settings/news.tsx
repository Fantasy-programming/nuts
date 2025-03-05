import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/core/components/ui/card";
import { Badge } from "@/core/components/ui/badge";

export const Route = createFileRoute("/dashboard_/settings/news")({
  component: RouteComponent,
});

const updates = [
  {
    version: "1.2.0",
    date: "2024-03-20",
    type: "feature",
    title: "Draggable Dashboard Charts",
    description: "You can now rearrange charts on your dashboard by dragging them.",
  },
  {
    version: "1.1.5",
    date: "2024-03-15",
    type: "improvement",
    title: "Enhanced Category Management",
    description: "Added support for subcategories and improved category organization.",
  },
  {
    version: "1.1.0",
    date: "2024-03-10",
    type: "feature",
    title: "Dark Mode Support",
    description: "Added dark mode support with system theme detection.",
  },
  {
    version: "1.0.5",
    date: "2024-03-05",
    type: "fix",
    title: "Bug Fixes",
    description: "Fixed various UI issues and improved performance.",
  },
];

function RouteComponent() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>What's New</CardTitle>
          <CardDescription>Latest updates and improvements to the platform</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {updates.map((update, index) => (
            <div
              key={index}
              className="before:bg-muted relative pb-6 pl-4 before:absolute before:top-2 before:left-0 before:h-[calc(100%-12px)] before:w-[2px] last:pb-0 last:before:hidden"
            >
              <div className="bg-primary absolute top-2 left-0 h-2 w-2 -translate-x-[3px] rounded-full" />
              <div className="flex items-center gap-2 text-sm">
                <span className="font-semibold">v{update.version}</span>
                <span className="text-muted-foreground">{update.date}</span>
                <Badge variant={update.type === "feature" ? "default" : update.type === "improvement" ? "secondary" : "destructive"}>{update.type}</Badge>
              </div>
              <h3 className="mt-2 font-medium">{update.title}</h3>
              <p className="text-muted-foreground mt-1 text-sm">{update.description}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
