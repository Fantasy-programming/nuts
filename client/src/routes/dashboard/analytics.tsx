import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/analytics")({
  component: RouteComponent,
});

function RouteComponent() {
  return "Hello /dashboard/analytics!";
}
