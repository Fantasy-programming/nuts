import { createFileRoute, Outlet, redirect, useNavigate, useRouterState } from "@tanstack/react-router";
import { cn } from "@/lib/utils"
import type { FileRoutesByTo } from "@/routeTree.gen";
import { useState, useCallback } from "react";
import { useHotkeys } from 'react-hotkeys-hook'
import { useAuth } from "@/features/auth/hooks/use-auth";
import {
  ChevronDown,
  ChartColumn,
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
import { Avatar, AvatarFallback, AvatarImage } from "@/core/components/ui/avatar";
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
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from "@/core/components/ui/sidebar";
import { Link } from "@tanstack/react-router";
import { Button } from "@/core/components/ui/button";
import MobileBurger from "@/core/components/layouts/mobile-burger";
import { RecordsDialog } from "./-components/Records/records-dialog";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createTransaction } from "@/features/transactions/services/transaction";
import { RecordCreateSchema } from "@/features/transactions/services/transaction.types";
import { usePluginStore } from "@/lib/plugin-store";
import { renderIcon } from "@/core/components/icon-picker";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/core/components/ui/collapsible";

export type ValidRoutes = keyof FileRoutesByTo;

type navStuff = {
  title: string;
  url: ValidRoutes;
  icon: LucideIcon;
};

export const Route = createFileRoute("/dashboard")({
  component: DashboardWrapper,
  beforeLoad: ({ context, location }) => {
    if (!context.auth.isAuthenticated && !context.auth.isLoading) {
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
  {
    title: "Plugins",
    url: "/dashboard/plugins",
    icon: ChartColumn,
  },
];

function DashboardWrapper() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { logout } = useAuth();

  const [theme, setTheme] = useState("light");
  const [isOpen, setIsOpen] = useState(false);


  const createMutation = useMutation({
    mutationFn: createTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
    },
  });

  const onSubmit = useCallback((values: RecordCreateSchema) => {
    createMutation.mutate(values);
  }, [createMutation]);


  const onLogout = useCallback(async () => {
    await logout()
    navigate({ to: "/login" })
  }, [logout, navigate]);

  useHotkeys(
    "g+d",
    () => {
      navigate({ to: "/dashboard/home" });
    },
    []
  );

  useHotkeys(
    "g+c",
    () => {
      navigate({ to: "/dashboard/accounts" });
    },
    []
  );

  useHotkeys(
    "g+t",
    () => {
      navigate({ to: "/dashboard/records" });
    },
    []
  );

  useHotkeys('g+a', () => {
    navigate({ to: "/dashboard/analytics" })
  }, [])

  useHotkeys(
    "g+s",
    () => {
      navigate({ to: "/dashboard/settings/account" });
    },
    []
  );

  useHotkeys('c', () => {
    setIsOpen(!isOpen)
  }, [isOpen])

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon" className="group-data-[side=left]:border-r-0" >
        <SideBHeader/>
        <SidebarContent>
          <SideBMainLinks/>
          <SideBPluginsLinks/>
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton size="lg" className="w-full justify-start group-data-[collapsible=icon]:justify-center">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src="/placeholder.svg" alt="@username" />
                      <AvatarFallback>KD</AvatarFallback>
                    </Avatar>
                    <div className="ml-3 flex flex-1 flex-col group-data-[collapsible=icon]:hidden">
                      <span className="text-sm font-semibold">Nameless User</span>
                      <span className="text-muted-foreground text-xs">rickrichard80@gmail.com</span>
                    </div>
                    <ChevronDown className="ml-auto h-4 w-4 group-data-[collapsible=icon]:hidden" />
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="start" alignOffset={-8} forceMount>
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
                      <DropdownMenuRadioGroup value={theme} onValueChange={setTheme}>
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
                  <DropdownMenuItem onClick={() => onLogout()}>
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
      <SidebarInset className="overflow-hidden">
        <div className="bg-card smooth-corners-sm border-background m-2 h-full rounded-xl border-2 shadow-sm">
          <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
            <div className="flex w-full items-center justify-between gap-2 px-4">
              <div className="hidden sm:block" />
              <MobileBurger />
              <div className="flex items-center gap-6">
                <Bell className="size-5" />
                <RecordsDialog onSubmit={onSubmit} open={isOpen} onOpenChange={setIsOpen}>
                  <Button className="hidden items-center gap-2 sm:flex">
                    <Plus className="size-4" />
                    <span>Add transactions</span>
                  </Button>
                </RecordsDialog>
              </div>
            </div>
          </header>
          <main className="flex flex-1 overflow-hidden">
            <div className="h-full w-full space-y-8 overflow-y-auto px-6 py-2">
              <Outlet />
            </div>
          </main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

const SideBHeader = () => {
  return (
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
  )
}

const SideBMainLinks = () => {
    const router = useRouterState();
  return (
        <SidebarGroup>
            <SidebarGroupLabel>General</SidebarGroupLabel>
    <SidebarMenu>
        {navMain.map((item) => (
            <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                    asChild
                    tooltip={item.title}
                    className="px-6"
                  >
                    <Link to={item.url} className={cn(
                      "flex text-sm  items-center w-full text-gray-950/60 justify-start  gap-3 hover:shadow-sm transition-all",
                      router.location.pathname === item.url ? "bg-sidebar-accent shadow-sm" : ""
                    )}
                    >
                      {item.icon && <item.icon className="size-4 font-medium stroke-2" />}
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
              </SidebarGroup>
  )
}

const SideBPluginsLinks = () => {
  const getEnabledPluginConfigs  = usePluginStore(state => state.getEnabledPluginConfigs); // plugin routes
  const plugins = getEnabledPluginConfigs()
  const router = useRouterState();

  return (

    plugins.length > 0 && (
    <SidebarGroup>
            <SidebarGroupLabel>Plugins</SidebarGroupLabel>
            <SidebarMenu>
                <Collapsible defaultOpen={false} className="group/collapsible">
              {
                plugins.map((item) => {
                  return item.routeConfigs.map((route) => {
                    return (
                      <SidebarMenuItem key={route.label}>
                        <CollapsibleTrigger asChild>
                          <SidebarMenuButton asChild className="px-6" tooltip={route.label} >
                            <Link to={`/dashboard${route.path}`} className={cn(
                          "flex text-sm  items-center w-full text-gray-950/60 justify-start  gap-3 hover:shadow-sm transition-all",
                          router.location.pathname === `/dashboard${route.path}` ? "bg-sidebar-accent shadow-sm" : ""
                        )}>
                              {renderIcon(route.iconName)}
                              <span className="ml-2">{route.label}</span>
                            </Link>
                          </SidebarMenuButton>
                        </CollapsibleTrigger>
                        {
                          route?.subroutes  ? (
                        <CollapsibleContent>
                          <SidebarMenuSub>
                            {route.subroutes.map((item) => (
                                <SidebarMenuSubItem>
                                  <SidebarMenuSubButton asChild>
                                          <Link to={`/dashboard${item.path}`} className={cn(
                          "flex text-sm  items-center w-full text-gray-950/60 justify-start  gap-3 hover:shadow-sm transition-all",
                          router.location.pathname === `/dashboard${item.path}` ? "bg-sidebar-accent shadow-sm" : ""
                        )}>
                              <span className="ml-2">{item.label}</span>
                            </Link>
                                  </SidebarMenuSubButton>
                                  </SidebarMenuSubItem>
                  ))}

                          </SidebarMenuSub>
                        </CollapsibleContent>
                          ) : null
                        }

                      </SidebarMenuItem>
                    );
                  });
                })
              }
              </Collapsible>
            </SidebarMenu>
          </SidebarGroup>)
  )
}
