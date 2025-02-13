import {
  createFileRoute,
  Outlet,
  type ParseRoute,
  redirect,
} from "@tanstack/react-router";
import type { routeTree } from "@/routeTree.gen";
import { useState } from "react";
import { useAuth } from "@/features/auth/hooks/use-auth";
import {
  ChevronDown,
  ChartColumn,
  Frame,
  LayoutGrid,
  LogOut,
  Moon,
  Nut,
  ArrowRightLeft,
  Settings,
  Sun,
  SunMedium,
  Users,
  Plus,
  Wallet,
  type LucideIcon,
  Bell,
} from "lucide-react";


import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/core/components/ui/avatar";
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
  SidebarGroupLabel,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
} from "@/core/components/ui/sidebar";
import { Link } from "@tanstack/react-router";
import { Button } from "@/core/components/ui/button";
import MobileBurger from "@/core/components/layouts/mobile-burger";

export type ValidRoutes = ParseRoute<typeof routeTree>["fullPath"];

type navStuff = {
  title: string;
  url: ValidRoutes;
  icon: LucideIcon;
};

export const Route = createFileRoute("/dashboard")({
  component: DashboardWrapper,
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
    icon: LayoutGrid,
  },
  {
    title: "Accounts",
    url: "/dashboard/accounts",
    icon: Wallet,
  },
  {
    title: "Transactions",
    url: "/dashboard/records",
    icon: ArrowRightLeft,
  },
  {
    title: "Analytics",
    url: "/dashboard/analytics",
    icon: ChartColumn,
  },
];

const plugins = [
  {
    name: "Properties",
    url: "#",
    icon: Frame,
  },
];

function DashboardWrapper() {
  const [theme, setTheme] = useState("light");
  const { logout } = useAuth();

  return (
    <SidebarProvider className="bg-gray-100">
      <Sidebar collapsible="icon" className="group-data-[side=left]:border-r-0" >
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" tooltip="Nuts Finance">
                <div className="flex items-center gap-2">
                  <div className="flex aspect-square items-center justify-center rounded-lg bg-sidebar text-sidebar-primary-foreground">
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
            <SidebarGroupLabel>General</SidebarGroupLabel>
            <SidebarMenu>
              {navMain.map((item) => (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    tooltip={item.title}
                    className="px-6"
                  >
                    <Link to={item.url} className="flex text-sm font-medium items-center w-full justify-start hover:bg-white gap-3 hover:shadow-sm transition-all">
                      {item.icon && <item.icon className="size-4 font-medium stroke-2" />}
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>
          <SidebarGroup>
            <SidebarGroupLabel>Plugins</SidebarGroupLabel>
            <SidebarMenu>
              {plugins.map((item) => (
                <SidebarMenuItem key={item.name}>
                  <SidebarMenuButton asChild className="px-4">
                    <Link to={item.url} className="flex items-center">
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
                        Nameless User
                      </span>
                      <span className="text-xs text-muted-foreground">
                        rickrichard80@gmail.com
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
      <SidebarInset className="overflow-hidden p-2 bg-gray-100">
        <div className="h-full rounded-xl bg-white shadow-sm border border-gray-200">
          <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
            <div className="flex items-center gap-2 px-4 justify-between w-full">
              <div className="hidden sm:block" />
              <MobileBurger />
              <div className="flex items-center gap-6">
                <Bell className="size-5" />
                <Button className="sm:flex items-center  gap-2  hidden">
                  <Plus className="size-4" />
                  <span >Add transactions</span>
                </Button>
              </div>
            </div>
          </header>
          <main className="flex flex-1 overflow-hidden">
            <div className="p-6 space-y-8 h-full w-full overflow-y-auto">
              <Outlet />
            </div>
          </main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
