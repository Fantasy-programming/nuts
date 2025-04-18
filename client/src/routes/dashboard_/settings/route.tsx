import { createFileRoute, Link, Outlet, redirect } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { Settings as SettingsIcon, User, Palette, Tags, List, Store, Bell, Webhook, MessageSquare, type LucideIcon } from "lucide-react";
import type { ValidRoutes } from "@/routes/dashboard/route";
import { useNavigate } from "@tanstack/react-router";
import { useHotkeys } from "react-hotkeys-hook";

export const Route = createFileRoute("/dashboard_/settings")({
  component: RouteComponent,
  beforeLoad: ({ context }) => {
    if (!context.auth.isAuthenticated && !context.auth.isLoading) {
      throw redirect({
        to: "/login",
      });
    }
  },
});

type navStuff = {
  to: ValidRoutes;
  label: string;
  icon: LucideIcon;
};

const settingsLinks: navStuff[] = [
  { to: "/dashboard/settings/account", label: "Account", icon: User },
  {
    to: "/dashboard/settings/preferences",
    label: "Preferences",
    icon: Palette,
  },
  { to: "/dashboard/settings/tags", label: "Tags", icon: Tags },
  { to: "/dashboard/settings/categories", label: "Categories", icon: List },
  { to: "/dashboard/settings/merchants", label: "Merchants", icon: Store },
  { to: "/dashboard/settings/news", label: "What's New", icon: Bell },
  { to: "/dashboard/settings/webhook", label: "Webhooks", icon: Webhook },
  {
    to: "/dashboard/settings/feedback",
    label: "Feedback",
    icon: MessageSquare,
  },
];

function RouteComponent() {
  const navigate = useNavigate();

  useHotkeys(
    "ctrl+esc",
    () => {
      navigate({ to: "/dashboard/home" });
    },
    []
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex items-center gap-2">
        <SettingsIcon className="h-6 w-6" />
        <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
      </div>
      <div className="flex flex-col gap-8 lg:flex-row">
        <aside className="space-y-2 lg:w-64">
          {settingsLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              activeProps={{
                className: "bg-primary text-primary-foreground",
              }}
              inactiveProps={{
                className: "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
              }}
              className={cn("flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors")}
            >
              <link.icon className="h-4 w-4" />
              {link.label}
            </Link>
          ))}
        </aside>
        <div className="flex-1">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
