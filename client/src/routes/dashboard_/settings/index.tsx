import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard_/settings/")({
  component: () => <Navigate to="/dashboard/settings/profile" params replace={true} />,
});
