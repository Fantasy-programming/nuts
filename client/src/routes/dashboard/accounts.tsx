import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/accounts")({
  component: RouteComponent,
});

function RouteComponent() {
  return "Hello /dashboard/accounts!";
}
