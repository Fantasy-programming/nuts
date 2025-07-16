import React from "react";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { Pressable } from "@/components/ui/pressable";
import { Switch } from "@/components/ui/switch";
import { Box } from "@/components/ui/box";
import {
  Moon,
  ChevronRight,
  Bell,
  MessageCircle,
  BadgeX,
  Settings,
  LifeBuoy,
  LogOutIcon,
  LanguagesIcon,
  LucideIcon,
} from "lucide-react-native";
import { useRouter } from "expo-router";
import { useTheme } from "@/provider/ThemeProvider";
import * as WebBrowser from "expo-web-browser";
import {
  Button,
  ButtonIcon,
  ButtonSpinner,
  ButtonText,
} from "@/components/ui/button";
import { useAuth } from "@/provider/SupabaseProvider";

type AppRoute =
  | "/settings/notifications"
  | "/settings/language"
  | "/settings/delete-account";

interface MenuItem {
  title: string;
  description: string;
  icon: LucideIcon;
  type: "switch" | "link";
  href?: AppRoute;
  url?: string;
  route?: AppRoute;
  danger?: boolean;
}

const settingsItems: MenuItem[] = [
  {
    title: "Dark Mode",
    description: "Toggle dark theme",
    icon: Moon,
    type: "switch",
  },
  {
    title: "Notifications",
    description: "Manage your notifications",
    icon: Bell,
    type: "link",
    href: "/settings/notifications",
  },
  {
    title: "Language",
    description: "Change your language",
    icon: LanguagesIcon,
    type: "link",
    href: "/settings/language",
  },
];

const supportItems: MenuItem[] = [
  {
    title: "Get Help",
    description: "FAQ and support center",
    icon: LifeBuoy,
    url: "https://shipmobilefast.com/contact",
    type: "link",
  },
  {
    title: "Privacy Policy",
    description: "Read our privacy policy",
    icon: MessageCircle,
    url: "https://shipmobilefast.com/privacy-policy",
    type: "link",
  },
  {
    title: "Delete Account",
    description: "Permanently delete your account",
    icon: BadgeX,
    route: "/settings/delete-account",
    type: "link",
    danger: true,
  },
];

export function ProfileMenu() {
  const router = useRouter();
  const { isDark, toggleTheme } = useTheme();
  const { signOut, isLoading } = useAuth();

  const renderMenuItem = (item: MenuItem) => {
    const isLast = (items: MenuItem[], currentItem: MenuItem): boolean =>
      items.indexOf(currentItem) === items.length - 1;

    const getItemStyle = (items: MenuItem[], item: MenuItem): string => {
      const baseStyle = "px-5 py-4";
      const itemArray =
        item.type === "link"
          ? item.href
            ? settingsItems
            : supportItems
          : settingsItems;

      const borderStyle = isLast(itemArray, item)
        ? ""
        : "border-b border-outline-100";
      return `${baseStyle} ${borderStyle}`;
    };

    return (
      <Pressable
        key={item.title}
        onPress={() => {
          if (item.type === "link") {
            if (item.url) {
              WebBrowser.openBrowserAsync(item.url);
            } else {
              const path = item.href || item.route;
              if (path) {
                router.navigate(path);
              }
            }
          }
        }}
        className={getItemStyle(
          item.type === "link"
            ? item.href
              ? settingsItems
              : supportItems
            : settingsItems,
          item
        )}
      >
        <HStack space="lg" className="items-center justify-between">
          <HStack space="md" className="items-center flex-1">
            <Box
              className={`p-2 rounded-full bg-background-50 
              ${item.danger ? "bg-red-500" : ""}`}
            >
              <Icon
                as={item.icon}
                size="sm"
                className={`${item.danger ? "text-white" : "text-primary-500"}`}
              />
            </Box>
            <VStack>
              <Text
                className={`text-base font-semibold ${
                  item.danger ? "text-red-500" : "text-typography-900"
                }`}
              >
                {item.title}
              </Text>
              {item.description && (
                <Text className="text-sm text-typography-500">
                  {item.description}
                </Text>
              )}
            </VStack>
          </HStack>

          {item.type === "switch" && (
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              size="sm"
              className="ml-2"
            />
          )}
          {item.type === "link" && (
            <Icon
              as={ChevronRight}
              size="sm"
              className={`${
                item.danger ? "text-red-400" : "text-typography-400"
              }`}
            />
          )}
        </HStack>
      </Pressable>
    );
  };

  return (
    <VStack space="xl" className="px-4">
      {/* Settings Section */}
      <HStack space="sm" className="px-5 items-center">
        <Icon as={Settings} size="sm" className="text-primary-500" />
        <Text className="text-sm font-medium text-typography-900">
          Settings
        </Text>
      </HStack>
      <Box className="bg-background rounded-2xl border border-outline-100 overflow-hidden">
        {settingsItems.map(renderMenuItem)}
      </Box>

      {/* Support Section */}
      <HStack space="sm" className="px-5 items-center">
        <Icon as={LifeBuoy} size="sm" className="text-primary-500" />
        <Text className="text-sm font-medium text-typography-900">Support</Text>
      </HStack>
      <Box className="bg-background rounded-2xl border border-outline-100 overflow-hidden">
        {supportItems.map(renderMenuItem)}
      </Box>

      {/* Sign Out Button */}
      <Button
        className="mx-4 mb-4 rounded-xl"
        onPress={signOut}
        variant="outline"
        size="lg"
        action="negative"
      >
        <ButtonIcon as={LogOutIcon} size="sm" className="text-red-600" />
        {isLoading ? (
          <ButtonSpinner size={"small"} />
        ) : (
          <ButtonText>Sign Out</ButtonText>
        )}
      </Button>
    </VStack>
  );
}
