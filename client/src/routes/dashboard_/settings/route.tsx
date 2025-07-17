import { createFileRoute, Link, Outlet, redirect, useLocation } from "@tanstack/react-router"
import { cn } from "@/lib/utils"
import {
  User,
  Palette,
  Tags,
  List,
  Store,
  Bell,
  MessageSquare,
  ChevronLeft,
  ShieldCheck,
  Globe,
  Coins,
  Wrench,
  type LucideIcon,
} from "lucide-react"

import type { ValidRoutes } from "@/routes/dashboard/route"
import { useNavigate } from "@tanstack/react-router"
import { useHotkeys } from "react-hotkeys-hook"
import { Button } from "@/core/components/ui/button"
import type { AuthNullable } from '@/features/auth/services/auth.types';
import { useTranslation } from "react-i18next";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/core/components/ui/select"


type NavItem = {
  to: ValidRoutes
  labelKey: string
  icon: LucideIcon
}

type NavCategory = {
  titleKey: string
  items: NavItem[]
  condition?: (context: AuthNullable) => boolean
}


const settingsNavigation = (): NavCategory[] => [
  {
    titleKey: "settings.account",
    items: [
      { to: "/dashboard/settings/profile", labelKey: "settings.profile", icon: User },
      { to: "/dashboard/settings/security", labelKey: "settings.security", icon: ShieldCheck },
    ],
  },
  {
    titleKey: "settings.preferences",
    items: [
      { to: "/dashboard/settings/appearance", labelKey: "settings.appearance", icon: Palette },
      { to: "/dashboard/settings/localization", labelKey: "settings.localization", icon: Globe },
      { to: "/dashboard/settings/features", labelKey: "settings.features", icon: Wrench },
    ],
  },
  {
    titleKey: "settings.transactionSetup",
    items: [
      { to: "/dashboard/settings/tags", labelKey: "settings.tags", icon: Tags },
      { to: "/dashboard/settings/categories", labelKey: "settings.categories", icon: List },
      { to: "/dashboard/settings/merchants", labelKey: "settings.merchants", icon: Store },
      { to: "/dashboard/settings/currencies", labelKey: "settings.currencies", icon: Coins },
    ],
  },
  {
    titleKey: "settings.about",
    items: [
      { to: "/dashboard/settings/news", labelKey: "settings.news", icon: Bell },
      { to: "/dashboard/settings/feedback", labelKey: "settings.feedback", icon: MessageSquare },
    ],
  },
]


export const Route = createFileRoute("/dashboard_/settings")({
  component: RouteComponent,
  beforeLoad: ({ context }) => {
    if (!context.auth.isAuthenticated) {
      throw redirect({
        to: "/login",
      })
    }
  },
})


function RouteComponent() {
  const navigate = useNavigate()
  const { t } = useTranslation();
  // const user = useAuthStore((state) => state.user); // Get auth context
  const currentPath = useLocation({
    select: (location) => location.pathname,
  })

  const navigation = settingsNavigation()
  // .filter(category => !category.condition || category.condition(context)); // Filter based on condition

  // Handle ESC key to go back to dashboard
  useHotkeys(
    "esc",
    () => {
      navigate({ to: "/dashboard/home" });
    },
    [navigate],
    { enableOnFormTags: false }
  )

  const handleBack = () => {
    navigate({ to: "/dashboard/home" });
  }

  const handleMobileNavigate = (value: string) => {
    if (value) {
      navigate({ to: value as ValidRoutes });
    }
  }



  // Find the closest matching navigation item for the mobile select default
  const currentMobileOption = navigation
    .flatMap(cat => cat.items)
    .find(item => currentPath.startsWith(item.to))?.to ?? navigation[0]?.items[0]?.to; // Default to first item if no match

  // Find the label for the currentMobileOption to display in SelectValue placeholder
  const currentLabel = navigation
    .flatMap(cat => cat.items)
    .find(item => item.to === currentMobileOption)?.labelKey ?? 'Select Setting...'


  return (
    <div className="container mx-auto px-4 py-4 md:py-8 flex flex-col flex-1 h-full ">
      <div className="mb-6 flex items-center gap-2 flex-shrink-0">
        <Button variant="ghost" size="sm" onClick={handleBack} className="flex items-center gap-1">
          <ChevronLeft className="h-4 w-4" />
          <span>{t('common.back')}</span>
          <kbd className="ml-2 px-1.5 py-0.5 text-xs bg-muted rounded">ESC</kbd>
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-6 md:gap-10 flex-1 md:overflow-hidden">
        {/* Mobile navigation dropdown */}
        <div className="md:hidden w-full mb-4 flex-shrink-0">
          <Select value={currentMobileOption} onValueChange={handleMobileNavigate}>
            <SelectTrigger className="w-full">
              {/* Display the current selection label */}
              <SelectValue placeholder="Select a setting..."> {t(currentLabel)} </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {navigation.map((category) => (
                <SelectGroup key={category.titleKey}>
                  {/* Optional: Add a label for the group in the dropdown */}
                  <SelectLabel className="px-2 py-1.5 text-xs font-semibold">{t(category.titleKey).toUpperCase()}</SelectLabel>
                  {category.items.map((item) => (
                    <SelectItem key={item.to} value={item.to}>
                      {/* Optional: Add icon in dropdown */}
                      {/* <item.icon className="h-4 w-4 mr-2 inline-block" /> */}
                      {t(item.labelKey)}
                    </SelectItem>
                  ))}
                </SelectGroup>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Desktop sidebar */}
        <aside className="hidden md:block space-y-6 md:w-60 lg:w-64 shrink-0 md:overflow-y-auto md:pb-10">
          {navigation.map((category) => (
            <div key={category.titleKey} className="space-y-1">
              <div className="px-3 text-xs font-semibold text-muted-foreground tracking-wider uppercase pb-1 mb-1 border-b">
                {t(category.titleKey).toUpperCase()}
              </div>
              {category.items.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  activeProps={{
                    className: "bg-primary text-primary-foreground",
                  }}
                  inactiveProps={{
                    className: "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                  }}
                  // Add resetScroll false if you don't want the page to jump when clicking sidebar links
                  // resetScroll={false}
                  className={cn("flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors")}
                >
                  <link.icon className="h-4 w-4" />
                  {t(link.labelKey)}
                </Link>
              ))}
            </div>
          ))}
        </aside>

        {/* Main content */}
        <div className="flex-1 min-w-0 md:overflow-y-auto md:pb-10"> {/* Added min-w-0 to prevent overflow issues */}
          <Outlet />
        </div>
      </div>
    </div>
  )
}
