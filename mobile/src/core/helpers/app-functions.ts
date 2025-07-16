import { requestTrackingPermissionsAsync } from "expo-tracking-transparency";
import * as Linking from "expo-linking";
import { router } from "expo-router";
import Toast from "react-native-root-toast";
// Get user tracking permission
// This function is important for compliance with privacy regulations
// Dont remove it , because Apple will reject the app if this is not implemented

export const getUserTrackingPermission = async () => {
  const { status } = await requestTrackingPermissionsAsync();
  if (status === "granted") {
    return true;
  } else {
    return false;
  }
};

// Parse the supabase url for Authentication flow
export const parseSupabaseUrl = (url: string) => {
  let parsedUrl = url;
  if (url.includes("#")) {
    parsedUrl = url.replace("#", "?");
  }
  return Linking.parse(parsedUrl);
};

export const showToast = (
  message: string,
  isError = false,
  color: string
): number => {
  return Toast.show(message, {
    position: Toast.positions.CENTER,
    backgroundColor: isError ? color : undefined,
    duration: isError ? Toast.durations.LONG : Toast.durations.SHORT,
  });
};

export const handleBack = () => {
  router.back();
};
