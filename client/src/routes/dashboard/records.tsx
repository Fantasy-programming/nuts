import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/records")({
  component: RouteComponent,
});

function RouteComponent() {
  return "Hello /dashboard/records!";
}
