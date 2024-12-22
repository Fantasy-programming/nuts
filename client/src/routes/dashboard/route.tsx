import {
  createFileRoute,
  Outlet,
  type ParseRoute,
  redirect,
} from "@tanstack/react-router";
import type { routeTree } from "@/routeTree.gen";
import { useState } from "react";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { Breadcrumbs } from "@/core/components/breadcrumbs";
import {
  ChevronDown,
  CreditCard,
  Frame,
  Layout,
  LogOut,
  Moon,
  Nut,
  BarChart3,
  Settings,
  Sun,
  SunMedium,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/core/components/ui/avatar";
import { Separator } from "@/core/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/core/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from "@/core/components/ui/sidebar";
import { Link } from "@tanstack/react-router";

export type ValidRoutes = ParseRoute<typeof routeTree>["fullPath"];
type navStuff = {
  title: string;
  url: ValidRoutes;
  icon: LucideIcon;
};

export const Route = createFileRoute("/dashboard")({
  component: RouteComponent,
  beforeLoad: ({ context, location }) => {
    if (!context.auth.isLoggedIn) {
      throw redirect({
        to: "/login",
        search: { redirect: location.href },
      });
    }
  },
});

const navMain: navStuff[] = [
  {
    title: "Dashboard",
    url: "/dashboard/home",
    icon: Layout,
  },
  {
    title: "Accounts",
    url: "/dashboard/accounts",
    icon: Wallet,
  },
  {
    title: "Records",
    url: "/dashboard/records",
    icon: BarChart3,
  },
  {
    title: "Analytics",
    url: "/dashboard/analytics",
    icon: CreditCard,
  },
];

const plugins = [
  {
    name: "Design Engineering",
    url: "#",
    icon: Frame,
  },
];

function RouteComponent() {
  const [theme, setTheme] = useState("light");
  const { logout, user } = useAuth();

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" tooltip="Nuts Finance">
                <div className="flex items-center gap-2">
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                    <Nut className="size-4" />
                  </div>
                  <span className="font-semibold group-data-[collapsible=icon]:hidden">
                    Nuts Finance
                  </span>
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarMenu>
              {navMain.map((item) => (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    tooltip={item.title}
                    className="px-4"
                  >
                    <Link to={item.url} className="flex items-center">
                      {item.icon && <item.icon className="size-4" />}
                      <span className="ml-2">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>
          <Separator />
          <SidebarGroup>
            <SidebarMenu>
              {plugins.map((item) => (
                <SidebarMenuItem key={item.name}>
                  <SidebarMenuButton asChild className="px-4">
                    <Link href={item.url} className="flex items-center">
                      <item.icon className="size-4" />
                      <span className="ml-2">{item.name}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton
                    size="lg"
                    className="w-full justify-start group-data-[collapsible=icon]:justify-center"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src="/placeholder.svg" alt="@username" />
                      <AvatarFallback>KD</AvatarFallback>
                    </Avatar>
                    <div className="ml-3 flex flex-1 flex-col group-data-[collapsible=icon]:hidden">
                      <span className="text-sm font-semibold">
                        {user.user?.first_name ?? "Nameless"}
                        {user.user?.last_name ?? "User"}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {user.user?.email}
                      </span>
                    </div>
                    <ChevronDown className="ml-auto h-4 w-4 group-data-[collapsible=icon]:hidden" />
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-56"
                  align="start"
                  alignOffset={-8}
                  forceMount
                >
                  <DropdownMenuItem>
                    <Users className="mr-2 h-4 w-4" />
                    Workspace settings
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/dashboard/settings">
                      <Settings className="mr-2 h-4 w-4" />
                      Account settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                      <SunMedium className="mr-2 h-4 w-4" />
                      Theme
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent>
                      <DropdownMenuRadioGroup
                        value={theme}
                        onValueChange={setTheme}
                      >
                        <DropdownMenuRadioItem value="light">
                          <Sun className="mr-2 h-4 w-4" />
                          Light
                        </DropdownMenuRadioItem>
                        <DropdownMenuRadioItem value="dark">
                          <Moon className="mr-2 h-4 w-4" />
                          Dark
                        </DropdownMenuRadioItem>
                      </DropdownMenuRadioGroup>
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => logout()}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumbs />
          </div>
        </header>
        <main className="flex flex-1 overflow-y-auto">
          <div className="container mx-auto p-6 space-y-8">
            <Outlet />
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
