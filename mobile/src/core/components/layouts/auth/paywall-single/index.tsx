import React from "react";
import { Box } from "@/components/ui/box";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Text } from "@/components/ui/text";
import { Button, ButtonText } from "@/components/ui/button";
import { ScrollView } from "@/components/ui/scroll-view";
import { Icon } from "@/components/ui/icon";
import { Check, Sparkles } from "lucide-react-native";
import { MotiView } from "moti";

const features = [
  {
    title: "Up to 5x more messages on GPT-4o and access to GPT-4",
    description: "Get more out of our advanced AI models",
  },
  {
    title: "Higher limits for photo and file uploads",
    description: "Process more data with increased capabilities",
  },
  {
    title: "Generate images with DALL·E",
    description: "Create unique images with AI",
  },
  {
    title: "Use, create, and share custom GPTs",
    description: "Customize your AI experience",
  },
  {
    title: "Early access to new features",
    description: "Be the first to try new capabilities",
  },
];

const Paywall = () => {
  const handlePurchase = () => {
    // Handle purchase logic
    console.log("Purchase");
  };

  return (
    <VStack className="h-full bg-background flex-1">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <VStack space="xl" className="p-6">
          {/* Header */}
          <VStack space="md" className="items-center mb-4">
            <Box className="w-16 h-16 items-center justify-center">
              <Icon as={Sparkles} className="w-14 h-14" />
            </Box>
            <Text className="text-4xl font-bold text-center text-typography-900">
              Get Premium Plus
            </Text>
            <Text className="text-lg text-center text-typography-500 max-w-[280px]">
              More messages on our most powerful model with premium features
            </Text>
          </VStack>

          {/* Features */}
          <VStack
            space="lg"
            className="p-6 border-outline-50 border-2 rounded-3xl"
          >
            {features.map((feature, index) => (
              <MotiView
                key={index}
                from={{
                  opacity: 0,
                  transform: [{ translateY: 10 }],
                }}
                animate={{
                  opacity: 1,
                  transform: [{ translateY: 0 }],
                }}
                transition={{
                  delay: index * 100,
                }}
              >
                <HStack space="md" className="items-start">
                  <Box className="mt-1">
                    <Icon as={Check} size={"lg"} />
                  </Box>
                  <VStack space="xs" className="flex-1">
                    <Text className="text-base font-semibold text-typography-900">
                      {feature.title}
                    </Text>
                    <Text className="text-sm text-typography-500">
                      {feature.description}
                    </Text>
                  </VStack>
                </HStack>
              </MotiView>
            ))}
          </VStack>
        </VStack>
      </ScrollView>

      {/* Purchase Button */}
      <VStack className="p-6 bg-background">
        <Button
          size="xl"
          variant="solid"
          action="primary"
          className="w-full rounded-xl"
          onPress={handlePurchase}
        >
          <ButtonText>Upgrade to Plus</ButtonText>
        </Button>
        <Text className="text-center text-sm my-4 text-typography-500">
          Auto-renews for $19.99/month until canceled
        </Text>
      </VStack>
    </VStack>
  );
};

export default Paywall;
