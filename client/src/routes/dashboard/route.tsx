import { createFileRoute, Link, Outlet, redirect, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useCallback, Suspense, memo } from "react";
import { useHotkeys } from 'react-hotkeys-hook'
import { useAuthStore } from "@/features/auth/stores/auth.store";
import { usePluginStore } from "@/features/plugins/store";
import { renderIcon } from "@/core/components/icon-picker";
import { cn } from "@/lib/utils"
import { userService } from "@/features/preferences/services/user";
import { useTheme } from "@/features/preferences/hooks/use-theme";
import { useShallow } from 'zustand/react/shallow'

import {
  ChevronDown,
  ChartColumn,
  LayoutGrid,
  LogOut,
  Moon,
  ArrowRightLeft,
  Settings,
  Sun,
  SunMedium,
  PlugZap,
  Wallet,
  type LucideIcon
} from "lucide-react";

import LogoWTXT from "@/core/assets/icons/ICWLG"
import { Nuts } from "@/core/assets/icons/Logo"
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
  useSidebar,
} from "@/core/components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/core/components/ui/collapsible";
import type { FileRoutesByTo } from "@/routeTree.gen";

type ValidRoutes = keyof FileRoutesByTo;

type navStuff = {
  title: string;
  url: ValidRoutes;
  icon: LucideIcon;
};

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
    icon: PlugZap,
  },
];


export const Route = createFileRoute("/dashboard")({
  loader: ({ context }) => {
    const queryClient = context.queryClient
    queryClient.prefetchQuery({
      queryKey: ["user"],
      queryFn: userService.getMe,
    })
  },
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


function DashboardWrapper() {
  const navigate = useNavigate();


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

  // useHotkeys('c', () => {
  //   setIsOpen(!isOpen)
  // }, [isOpen])

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon" className="group-data-[side=left]:border-r-0" >
        <SideBarHeader />
        <SidebarContent>
          <SideBarMainLinks />
          <SideBarPluginsLinks />
        </SidebarContent>
        <SidebarFooter>
          <Suspense fallback={<div>fuck it</div>}>
            <SideBarFooterMenu />
          </Suspense>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>
      <SidebarInset className="overflow-hidden">
        <div className="bg-card smooth-corners-sm border-background m-2 h-full rounded-xl border-2 shadow-sm">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}


const SideBarFooterMenu = memo(() => {
  const navigate = useNavigate();

  const {
    data: user
  } = useSuspenseQuery({
    queryKey: ["user"],
    queryFn: userService.getMe,
  });

  const logout = useAuthStore((state) => state.logout);
  const { theme, setTheme } = useTheme();
  const onLogout = useCallback(async () => {
    await logout()
    navigate({ to: "/login", replace: true })
  }, [logout, navigate]);

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton size="lg" className="w-full justify-start group-data-[collapsible=icon]:justify-center">
              <Suspense fallback="loading..." >
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user.avatar_url} />
                  <AvatarFallback>
                    {user.first_name?.[0]}
                    {user.last_name?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="ml-3 flex flex-1 flex-col group-data-[collapsible=icon]:hidden">
                  <span className="text-sm font-semibold text-ellipsis text-nowrap">
                    {user?.first_name && user?.last_name && (
                      `${user.first_name} ${user.last_name}`
                    )}
                  </span>
                  <span className="text-muted-foreground text-xs">{user.email}</span>
                </div></Suspense>
              <ChevronDown className="ml-auto h-4 w-4 group-data-[collapsible=icon]:hidden" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="start" alignOffset={-8} forceMount>
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
  )
})



const SideBarHeader = memo(() => {
  const { state } = useSidebar();
  console.log("Rendering SideBarHeader");

  return (
    <SidebarHeader>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size="lg" tooltip="Nuts Finance">
            <div className="flex w-full items-center justify-center rounded-lg bg-sidebar text-sidebar-primary-foreground">
              {state === "collapsed" ? (
                <Nuts className="size-4" fill="#000" />
              ) : (
                <LogoWTXT className="size-16" fill="#000" />
              )}
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarHeader>
  )
})

const SideBarMainLinks = memo(() => {
  console.log("Rendering SideBMainLinks"); // Add console.log for debugging renders
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
              )}
                activeProps={{ className: "bg-sidebar-accent shadow-sm" }}
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
})

const SideBarPluginsLinks = memo(() => {
  const plugins = usePluginStore(useShallow((state) => state.pluginConfigs.filter(config => config.enabled)));

  if (plugins.length === 0) {
    return null;
  }

  return (
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
                        <Link to={'/dashboard/$'}
                          params={{
                            _splat: route.path
                          }}
                          className={cn(
                            "flex text-sm  items-center w-full text-gray-950/60 justify-start  gap-3 hover:shadow-sm transition-all",
                          )}

                          activeProps={{ className: "bg-sidebar-accent shadow-sm" }}
                        >
                          {renderIcon(route.iconName)}
                          <span className="ml-2">{route.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    {
                      route?.subroutes ? (
                        <CollapsibleContent >
                          <SidebarMenuSub>
                            {route.subroutes.map((item) => (
                              <SidebarMenuSubItem key={item.label}>
                                <SidebarMenuSubButton asChild>
                                  <Link to={'/dashboard/$'} params={{
                                    _splat: item.path
                                  }} className={cn(
                                    "flex text-sm  items-center w-full text-gray-950/60 justify-start  gap-3 hover:shadow-sm transition-all",

                                  )}
                                    activeProps={{ className: "bg-sidebar-accent shadow-sm" }}
                                  >
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
    </SidebarGroup>
  )
})
