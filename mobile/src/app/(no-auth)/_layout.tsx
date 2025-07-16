import { Stack } from "expo-router";

import HeaderClose from "@/core/components/router/header-close";

const NoAuthLayout = () => {
  return (
    <Stack initialRouteName="onboarding" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="sign-in" />
      <Stack.Screen name="sign-up" />
      <Stack.Screen
        name="forgot-password"
        options={{
          headerShown: true,
          presentation: "modal",
          headerLeft: () => <HeaderClose />,
          headerTitle: "Forgot Password",
        }}
      />
      <Stack.Screen name="onboarding" />
    </Stack>
  );
};

export default NoAuthLayout;
