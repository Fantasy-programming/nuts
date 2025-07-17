//! Development BUILD REQUIRED

// If you want to use Admob, you need to add your app ID to app.json and go to services/admob/admobConfig.ts
// and put your id's there.

// This doesn't work on web and EXPO GO.

import React from "react";
import { Box } from "@/components/ui/box";
import { VStack } from "@/components/ui/vstack";
import { Text } from "@/components/ui/text";
import { Button, ButtonText } from "@/components/ui/button";
// import { useAdmob } from "@/hooks/useAdmob";
// import {
//   BannerAd,
//   BannerAdSize,
//   TestIds,
// } from "react-native-google-mobile-ads";
// import { admobConfig } from "@/services/admob/admobConfig";

const AdmobDemo = () => {
  //   const { showInterstitial, showRewarded, showAppOpen, admobState } =
  //     useAdmob();

  //   const bannerAdUnitId = __DEV__ ? TestIds.BANNER : admobConfig.bannerAdUnitId;

  return (
    <VStack className="flex-1 bg-background p-6" space="xl">
      {/* Header */}
      <Text className="text-2xl font-bold text-center">Admob Demo</Text>

      {/* Ad Type Buttons */}
      <VStack space="md">
        {/* Banner Ad */}
        <VStack space="sm">
          <Text className="font-semibold mb-2">Banner Ad</Text>
          <Box className="items-center">
            {/* <BannerAd
              unitId={bannerAdUnitId}
              size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
            /> */}
            <Text>Development Build Required</Text>
          </Box>
        </VStack>

        {/* Interstitial Ad */}
        <VStack space="sm">
          <Text className="font-semibold">Interstitial Ad</Text>
          <Button
          // onPress={showInterstitial}
          // disabled={admobState.interstitial.isLoading}
          >
            <ButtonText>
              {/* {admobState.interstitial.isLoading
                ? "Loading Interstitial..."
                : "Show Interstitial Ad"} */}
              Development Build Required
            </ButtonText>
          </Button>
        </VStack>

        {/* Rewarded Ad */}
        <VStack space="sm">
          <Text className="font-semibold">Rewarded Ad</Text>
          <Button
          // onPress={showRewarded}
          // disabled={admobState.rewarded.isLoading}
          >
            <ButtonText>
              {/* {admobState.rewarded.isLoading
                ? "Loading Rewarded..."
                : "Show Rewarded Ad"} */}
              Development Build Required
            </ButtonText>
          </Button>
        </VStack>

        {/* App Open Ad */}
        <VStack space="sm">
          <Text className="font-semibold">App Open Ad</Text>
          <Button
          // onPress={showAppOpen}
          // disabled={admobState.appOpen.isLoading}
          >
            <ButtonText>
              {/* {admobState.appOpen.isLoading
                ? "Loading App Open..."
                : "Show App Open Ad"} */}
              Development Build Required
            </ButtonText>
          </Button>
        </VStack>
      </VStack>

      {/* Status Messages */}
      <VStack space="sm" className="mt-4">
        <Text className="text-sm text-typography-500">
          Interstitial Status:{" "}
          {/* {admobState.interstitial.isLoaded ? "Ready" : "Not Ready"} */}
          Not Ready
        </Text>
        <Text className="text-sm text-typography-500">
          Rewarded Status:{" "}
          {/* {admobState.rewarded.isLoaded ? "Ready" : "Not Ready"} */}
          Not Ready
        </Text>
        <Text className="text-sm text-typography-500">
          App Open Status:{" "}
          {/* {admobState.appOpen.isLoaded ? "Ready" : "Not Ready"} */}
          Not Ready
        </Text>
      </VStack>
    </VStack>
  );
};

export default AdmobDemo;
