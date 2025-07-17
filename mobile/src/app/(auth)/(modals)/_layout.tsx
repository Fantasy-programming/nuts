import { Stack } from "expo-router";
import HeaderClose from "@/core/components/router/header-close";

const ModalLayout = () => {
  return (
    <Stack
      screenOptions={{
        presentation: "modal",
        headerBackVisible: false,
        headerTransparent: true,
        headerRight: () => <HeaderClose />,
      }}
    >
      <Stack.Screen
        name="paywall-single"
        options={{
          title: "",
        }}
      />
      <Stack.Screen
        name="paywall-double"
        options={{
          title: "",
        }}
      />
      <Stack.Screen
        name="admob"
        options={{
          title: "Admob",
          headerTransparent: false,
        }}
      />
    </Stack>
  );
};

export default ModalLayout;
