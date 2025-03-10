import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/core/components/ui/card";


export const Route = createFileRoute("/dashboard/analytics")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Analytics</h2>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Financial Overview</CardTitle>
        </CardHeader>
        <CardContent>
        </CardContent>
      </Card>
    </div>
  );
}
