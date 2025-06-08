import { createFileRoute, Link, Outlet, redirect, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useCallback, Suspense, memo } from "react";
import { useHotkeys } from 'react-hotkeys-hook'
import { useAuthStore } from "@/features/auth/stores/auth.store";
import { usePluginStore } from "@/features/plugins/store";
import { renderIcon } from "@/core/components/icon-picker/index.helper";
import { cn } from "@/lib/utils"
import { userService } from "@/features/preferences/services/user";
import { useTheme } from "@/features/preferences/hooks/use-theme";
import { useShallow } from 'zustand/react/shallow'
import { useTranslation } from "react-i18next";
import {
  RiBarChartBoxLine,
  RiBarChartBoxFill,
  RiSettingsLine,
  RiBankCard2Line,
  RiBankCard2Fill,
  RiStackLine,
  RiStackFill,
  RiArrowDownSLine,
  RiSunLine,
  RiMoonLine,
  RiLogoutBoxLine,
  type RemixiconComponentType,
  RiDashboardLine,
  RiDashboardFill
} from "@remixicon/react";
import LogoWTXT from "@/core/assets/icons/ICWLG"
import { Nuts } from "@/core/assets/icons/Logo"
import { Avatar, AvatarFallback, AvatarImage } from "@/core/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
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
  SidebarGroupContent,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  useSidebar,
  SidebarMenuAction,
} from "@/core/components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/core/components/ui/collapsible";
import type { FileRoutesByTo } from "@/routeTree.gen";
import { ChevronRight } from "lucide-react";
import { Theme } from "@/features/preferences/contexts/theme.context";

export type ValidRoutes = keyof FileRoutesByTo;

type navStuff = {
  title: string;
  url: ValidRoutes;
  icon: RemixiconComponentType;
  activeIcon: RemixiconComponentType;
};

const navMain: navStuff[] = [
  {
    title: "navigation.dashboard",
    url: "/dashboard/home",
    icon: RiDashboardLine,
    activeIcon: RiDashboardFill,
  },
  {
    title: "navigation.accounts",
    url: "/dashboard/accounts",
    icon: RiStackLine,
    activeIcon: RiStackFill,
  },
  {
    title: "navigation.transactions",
    url: "/dashboard/records",
    icon: RiBankCard2Line,
    activeIcon: RiBankCard2Fill,
  },
  {
    title: "navigation.analytics",
    url: "/dashboard/analytics",
    icon: RiBarChartBoxLine,
    activeIcon: RiBarChartBoxFill,
  }
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
      navigate({ to: "/dashboard/settings/profile" });
    },
    []
  );

  // useHotkeys('c', () => {
  //   setIsOpen(!isOpen)
  // }, [isOpen])

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon" className="group-data-[side=left]:border-r-0">
        <SideBarHeader />
        <SidebarContent className="-mt-2">
          <SideBarMainLinks />
          <SideBarPluginsLinks />
        </SidebarContent>
        <SidebarFooter>
          <Suspense fallback={<div>fuck it</div>}>
            <SideBarFooterMenu />
          </Suspense>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset className="overflow-hidden px-4 md:px-6 py-4 ">
        <Outlet />
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
  const { isMobile } = useSidebar();
  const { t } = useTranslation();

  const onLogout = useCallback(async () => {
    await logout()
    navigate({ to: "/login", replace: true })
  }, [logout, navigate]);

  return (
    <SidebarMenu className="group-data-[collapsible=icon]:items-center">
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground">
              <Avatar className="in-data-[state=expanded]:size-6 transition-[width,height] duration-200 ease-in-out">
                <AvatarImage src={user.avatar_url} alt={user.first_name} />
                <AvatarFallback>
                  {user.first_name?.[0]}
                  {user.last_name?.[0]}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left items-center text-sm leading-tight ms-1">
                <span className="truncate font-medium">
                  {user?.first_name && user?.last_name && (
                    `${user.first_name} ${user.last_name}`
                  )}
                </span>
              </div>
              <div className="size-8 rounded-lg flex items-center justify-center bg-sidebar-accent/50 in-[[data-slot=dropdown-menu-trigger]:hover]:bg-transparent">
                <RiArrowDownSLine className="size-5 opacity-40" size={20} />
              </div>
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            align="end"
            sideOffset={4}
            side={isMobile ? "bottom" : "right"}
            forceMount>
            <DropdownMenuItem asChild>
              <Link to="/dashboard/settings" className="gap-3 px-1">
                <RiSettingsLine size={16} className="text-muted-foreground/70" aria-hidden="true" />
                Account settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger className="gap-3 px-1 ps-2">
                <RiSunLine size={16} className="text-muted-foreground/70" aria-hidden="true" />
                Theme
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuRadioGroup value={theme} onValueChange={(value) => setTheme(value as Theme)}>
                  <DropdownMenuRadioItem value="light">
                    <RiSunLine size={16} className="text-muted-foreground/70" aria-hidden="true" />
                    Light
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="dark">
                    <RiMoonLine size={16} className="text-muted-foreground/70" aria-hidden="true" />
                    Dark
                  </DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuItem className="gap-3 px-1 ps-2" onClick={() => onLogout()}>
              <RiLogoutBoxLine size={16} className="text-muted-foreground/70" aria-hidden="true" />
              {t("logout")}
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
    <SidebarHeader className="h-16 max-md:mt-2 mb-2 justify-center">
      <div className="flex w-full items-center px-2 group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:justify-center rounded-lg bg-sidebar text-sidebar-primary-foreground">
        {state === "collapsed" ? (
          <Nuts className="size-4 fill-sidebar-primary-foreground" />
        ) : (
          <LogoWTXT className="size-16 fill-sidebar-primary-foreground" />
        )}
      </div>
    </SidebarHeader>
  )
})

const SideBarMainLinks = memo(() => {
  console.log("Rendering SideBMainLinks"); // Add console.log for debugging renders 
  const { t } = useTranslation();

  return (
    <SidebarGroup>
      <SidebarGroupLabel className="uppercase text-muted-foreground/60">General</SidebarGroupLabel>
      <SidebarGroupContent className="px-1 group-data-[collapsible=icon]:px-0">
        <SidebarMenu className="group-data-[collapsible=icon]:items-center">
          {navMain.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                asChild
                tooltip={item.title}
                className="group/menu-button  font-medium gap-3 h-9 rounded-md text-muted-foreground/95   [&>svg]:size-auto"
              >
                <Link to={item.url} activeProps={{ className: "bg-sidebar-accent shadow-sm" }}
                >{({ isActive }) => (
                  <>
                    {isActive ? (
                      <item.activeIcon size={16} aria-hidden="true" className="text-sidebar-primary-foreground/80" />
                    ) : (
                      <item.icon size={16} aria-hidden="true" className="text-muted-foreground/60" />
                    )
                    }

                    <span className={isActive ? `text-sidebar-accent-foreground` : ""}>{t(item.title)}</span>
                  </>
                )
                  }
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
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
      <SidebarGroupLabel className="uppercase text-muted-foreground/60">Plugins</SidebarGroupLabel>
      <SidebarGroupContent className="px-1 group-data-[collapsible=icon]:px-0">
        <SidebarMenu className="group-data-[collapsible=icon]:items-center">
          {
            plugins.map((item) => {
              return item.routeConfigs.map((route) => {
                return (
                  <Collapsible className="group/collapsible" key={route.label}>
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild
                        className="group/menu-button text-gray-950/60 font-medium gap-3 h-9 rounded-md bg-gradient-to-r hover:bg-transparent hover:from-sidebar-accent hover:to-sidebar-accent/40 data-[active=true]:from-primary/20 data-[active=true]:to-primary/5 [&>svg]:size-auto"
                        tooltip={route.label} >
                        <Link to={'/dashboard/$'}
                          params={{
                            _splat: route.path
                          }}

                          activeProps={{ className: "bg-sidebar-accent shadow-sm" }}
                        >
                          {renderIcon(route.iconName, { size: 16, "aria-hidden": true, className: "text-muted-foreground/60 group-data-[active=true]/menu-button:text-primary" })}
                          <span >{route.label}</span>
                        </Link>
                      </SidebarMenuButton>
                      {
                        route?.subroutes ? (
                          <>
                            <CollapsibleTrigger asChild>
                              <SidebarMenuAction
                                className="left-2 bg-sidebar-accent text-sidebar-accent-foreground data-[state=open]:rotate-90"
                                showOnHover
                              >
                                <ChevronRight />
                              </SidebarMenuAction>
                            </CollapsibleTrigger>
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
                          </>
                        ) : null
                      }

                    </SidebarMenuItem>
                  </Collapsible>
                );
              });
            })
          }
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
})
