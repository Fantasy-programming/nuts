import "@/core/i18n";
import "../../global.css";

import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { useFonts } from "expo-font";
import { Slot, Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { StatusBar, StyleSheet } from "react-native";
import FlashMessage from "react-native-flash-message";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { RootSiblingParent } from "react-native-root-siblings";

import { GluestackUIProvider } from "@/core/components/ui/gluestack-ui-provider";
import { getUserTrackingPermission } from "@/core/helpers/app-functions";
import { useThemeConfig } from "@/core/hook/use-theme-config";
import { usePushNotification } from "@/core/hooks/use-push-notification";
import { ThemeProvider, useTheme } from "@/core/provider/ThemeProvider";
import { APIProvider } from "@/lib/api";
import { AuthProvider, useAuth } from "@/provider/SupabaseProvider";

export { ErrorBoundary } from "expo-router";

SplashScreen.preventAutoHideAsync();

function GluestackUIProviderWrapper() {
  usePushNotification();

  const [loaded] = useFonts({
    SpaceMono: require("@/assets/fonts/SpaceMono-Regular.ttf"),
  });

  const router = useRouter();
  const segments = useSegments();

  const { session, initialized } = useAuth();
  const { isDark, theme } = useTheme();

  useEffect(() => {
    // Get user tracking permission
    // This function is important for compliance with privacy regulations
    // Dont remove it , because Apple will reject the app if this is not implemented
    // You should configure this function according to your needs.
    getUserTrackingPermission();
  }, []);

  useEffect(() => {
    if (loaded && initialized) {
      SplashScreen.hideAsync();
    }
  }, [loaded, initialized]);

  useEffect(() => {
    if (session && segments[0] === "(no-auth)") {
      router.replace("/");
    } else if (
      !session &&
      segments[0] !== "(no-auth)" &&
      segments[0] !== "callback"
    ) {
      router.replace("/onboarding");
    }
  }, [session, segments, router]);

  if (!loaded || !initialized) {
    return <Slot />;
  }

  return (
    <GluestackUIProvider mode={theme}>
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor={isDark ? "#000" : "#fff"}
      />
      <Stack
        screenOptions={{
          headerShown: false,
        }}
        initialRouteName="(no-auth)"
      >
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(no-auth)" />
        <Stack.Screen name="callback" options={{ presentation: "modal" }} />
        <Stack.Screen name="+not-found" />
      </Stack>
    </GluestackUIProvider>
  );
}

function Layout() {
  const theme = useThemeConfig();
  return (
    <GestureHandlerRootView
      style={styles.container}
      className={theme.dark ? `dark` : undefined}
    >
      <KeyboardProvider>
        <ThemeProvider>
          <APIProvider>
            <BottomSheetModalProvider>
              <AuthProvider>
                <RootSiblingParent>
                  <GluestackUIProviderWrapper />
                  <FlashMessage position="top" />
                </RootSiblingParent>
              </AuthProvider>
            </BottomSheetModalProvider>
          </APIProvider>
        </ThemeProvider>
      </KeyboardProvider>
    </GestureHandlerRootView>
  );
}

export default Layout;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
