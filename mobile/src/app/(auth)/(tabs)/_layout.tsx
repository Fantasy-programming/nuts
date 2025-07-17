import { Tabs } from "expo-router";
import { HomeIcon, Search, UserIcon } from "lucide-react-native";

import TabBarIcon from "@/core/components/router/tab-bar-icon";

const TabsLayout = () => {
  return (
    <Tabs screenOptions={{ tabBarHideOnKeyboard: true }}>
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => (
            <TabBarIcon icon={HomeIcon} size={"md"} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          headerShown: false,
          title: "Search",
          tabBarIcon: ({ color }) => (
            <TabBarIcon icon={Search} size={"md"} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color }) => (
            <TabBarIcon icon={UserIcon} size={"md"} color={color} />
          ),
        }}
      />
    </Tabs>
  );
};

export default TabsLayout;
