import { useRouter } from "expo-router";
import { ArrowRightIcon } from "lucide-react-native";
import React, { useRef, useState } from "react";
import { Dimensions, FlatList, type ListRenderItem } from "react-native";

import { Box } from "@/core/components/ui/box";
import { Button, ButtonText } from "@/core/components/ui/button";
import { Center } from "@/core/components/ui/center";
import { Icon } from "@/core/components/ui/icon";
import { Image } from "@/core/components/ui/image";
import { Pressable } from "@/core/components/ui/pressable";
import { SafeAreaView } from "@/core/components/ui/safe-area-view";
import { Text } from "@/core/components/ui/text";
import { VStack } from "@/core/components/ui/vstack";

const { width } = Dimensions.get("window");

const onboardingData = [
  {
    id: "1",
    title: "Welcome to Ship Mobile Fast",
    description: "The fastest way to ship your mobile app",
    image: require("@/assets/onboarding/1.png"),
  },
  {
    id: "2",
    title: "Build Faster",
    description: "Use our pre-built components to build your app faster",
    image: require("@/assets/onboarding/2.png"),
  },
  {
    id: "3",
    title: "Ship with Confidence",
    description: "Deploy your app to production with confidence",
    image: require("@/assets/onboarding/3.png"),
  },
];

const OnboardingScreen = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const router = useRouter();

  const renderItem: ListRenderItem<(typeof onboardingData)[0]> = ({ item }) => (
    <Box style={{ width }} className="px-4">
      <VStack space="2xl" className="h-full items-center justify-between py-8">
        <Image
          source={item.image}
          alt={item.title}
          resizeMode="contain"
          className="h-2/3 w-full"
        />
        <VStack space="md" className="items-center px-4">
          <Text className="text-center text-4xl font-bold text-primary-900">
            {item.title}
          </Text>
          <Text className="text-center text-xl text-primary-500">
            {item.description}
          </Text>
        </VStack>
      </VStack>
    </Box>
  );

  const renderDots = () => (
    <Center className="flex-row justify-center py-8">
      {onboardingData.map((_, index) => (
        <Box
          key={index}
          className={`mr-2 h-1 w-4 rounded-full ${currentSlide === index ? "bg-primary-900" : "bg-primary-900/20"
            }`}
        />
      ))}
    </Center>
  );

  return (
    <SafeAreaView className="bg-background flex-1 dark:bg-background-dark ">
      <Box className="flex-row justify-end px-4">
        <Pressable
          onPress={() => router.push("/sign-up")}
          className="flex-row items-center justify-center rounded-full px-2 py-1 "
        >
          <Text className="mr-1 font-medium text-primary-900">Skip</Text>
          <Icon as={ArrowRightIcon} size="md" className="text-primary-900" />
        </Pressable>
      </Box>
      <VStack className="flex-1 justify-between">
        <FlatList
          ref={flatListRef}
          data={onboardingData}
          renderItem={renderItem}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(event) => {
            const slideIndex = Math.round(
              event.nativeEvent.contentOffset.x / width,
            );
            setCurrentSlide(slideIndex);
          }}
        />

        <VStack space="md" className="px-4 pb-8">
          {renderDots()}
          <Button
            onPress={() => {
              if (currentSlide < onboardingData.length - 1) {
                const nextSlide = currentSlide + 1;
                flatListRef.current?.scrollToIndex({ index: nextSlide });
                setCurrentSlide(nextSlide);
              } else {
                router.push("/sign-up");
              }
            }}
            className="h-16 w-full rounded-2xl"
          >
            <ButtonText className="text-xl font-bold">
              {currentSlide === onboardingData.length - 1
                ? "Get Started"
                : "Next"}
            </ButtonText>
          </Button>
        </VStack>
      </VStack>
    </SafeAreaView>
  );
};

export default OnboardingScreen;
