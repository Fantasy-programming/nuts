import { Stack } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";

import HeaderLeft from "@/core/components/router/header-left";

const SettingsLayout = () => {
  const { t } = useTranslation();
  return (
    <Stack>
      <Stack.Screen
        name="notifications"
        options={{
          title: "Notifications",
          headerLeft: () => <HeaderLeft />,
        }}
      />
      <Stack.Screen
        name="delete-account"
        options={{
          title: "Delete Account",
          headerLeft: () => <HeaderLeft />,
        }}
      />
      <Stack.Screen
        name="language"
        options={{
          title: t("language"),
          headerLeft: () => <HeaderLeft />,
        }}
      />
    </Stack>
  );
};

export default SettingsLayout;
