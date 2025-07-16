import { Stack } from "expo-router";
import React from "react";

import HeaderClose from "@/core/components/router/header-close";

const CallbackLayout = () => {
  return (
    <Stack screenOptions={{ presentation: "modal" }}>
      <Stack.Screen
        name="verify"
        options={{
          headerTitle: "Verify Email",
          headerLeft: () => null,
          headerBackVisible: false,
        }}
      />
      <Stack.Screen
        name="new-password"
        options={{
          headerTitle: "Reset Password",
          headerLeft: () => <HeaderClose />,
        }}
      />
    </Stack>
  );
};

export default CallbackLayout;
