import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard_/settings/tags")({
  component: RouteComponent,
});

function RouteComponent() {
  return "Hello /dashboard/settings/tags!";
}
