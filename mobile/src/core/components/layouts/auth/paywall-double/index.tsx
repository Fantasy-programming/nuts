import React, { useState } from "react";
import { Box } from "@/components/ui/box";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Text } from "@/components/ui/text";
import { Button, ButtonText } from "@/components/ui/button";
import { ScrollView } from "@/components/ui/scroll-view";
import { Radio, RadioGroup } from "@/components/ui/radio";
import { Icon } from "@/components/ui/icon";
import { Check, Sparkles } from "lucide-react-native";
import { MotiView } from "moti";
import { Pressable } from "@/components/ui/pressable";
import * as WebBrowser from "expo-web-browser";

const features = [
  "Unlimited access to all features",
  "Priority customer support",
  "Early access to new features",
  "No ads",
  "Cross-platform sync",
  "Unlimited AI credits",
];

const plans = [
  {
    id: "monthly",
    title: "Monthly",
    price: "$9.99",
    period: "month",
    description: "Perfect to try out",
  },
  {
    id: "annual",
    title: "Annual",
    price: "$79.99",
    period: "year",
    description: "Save 33%",
    popular: true,
  },
];

const Paywall = () => {
  const [selectedPlan, setSelectedPlan] = useState("annual");

  const handleSubscribe = () => {
    // Handle subscription logic
    console.log("Subscribe");
  };

  return (
    <VStack className="p-4 h-full bg-background flex-1 justify-between">
      {/* Header */}
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <VStack space="lg" className="mb-8 flex-1">
          <Box className="p-4 rounded-full items-center justify-center">
            <Icon as={Sparkles} className="text-primary-900 w-12 h-12" />
            <Text className="text-4xl font-bold text-center text-primary-900 mt-4">
              Upgrade to Pro
            </Text>
            <Text className="text-lg text-center text-primary-100 mt-4">
              Get access to all features and unlock your full potential
            </Text>
          </Box>

          {/* Features */}
          <VStack
            space="xl"
            className="mb-8 border border-outline-50 py-4 px-4 rounded-2xl justify-center"
          >
            {features.map((feature, index) => (
              <MotiView
                key={index}
                from={{
                  opacity: 0,
                  transform: [{ translateX: -20 }],
                }}
                animate={{
                  opacity: 1,
                  transform: [{ translateX: 0 }],
                }}
                transition={{
                  delay: index * 100,
                  type: "timing",
                  duration: 350,
                }}
              >
                <HStack space="sm" className="items-center">
                  <Box className="p-1 rounded-full bg-background-50">
                    <Icon as={Check} size="sm" className="text-primary-900" />
                  </Box>
                  <Text className="text-typography-700 font-bold">
                    {feature}
                  </Text>
                </HStack>
              </MotiView>
            ))}
          </VStack>
        </VStack>
      </ScrollView>

      {/* Plans */}
      <RadioGroup
        value={selectedPlan}
        onChange={setSelectedPlan}
        className="w-full mb-6"
      >
        <VStack space="md">
          {plans.map((plan, index) => (
            <Radio
              key={index}
              value={plan.id}
              className={`p-4 rounded-xl border-2 ${
                selectedPlan === plan.id
                  ? "bg-background border-primary-900"
                  : "border-outline-100"
              }`}
            >
              <HStack className="flex-1 items-center justify-between">
                <VStack>
                  <HStack space="sm" className="items-center">
                    {selectedPlan === plan.id && (
                      <Box className="p-1 rounded-full bg-primary-900">
                        <Icon
                          as={Check}
                          size="sm"
                          className="text-typography-0"
                        />
                      </Box>
                    )}
                    <Text className="text-lg font-bold text-typography-900">
                      {plan.title}
                    </Text>
                    {plan.popular && (
                      <Box className="px-2 py-1 rounded-full bg-primary-900">
                        <Text className="text-xs font-medium text-typography-0">
                          Popular
                        </Text>
                      </Box>
                    )}
                  </HStack>
                  <Text className="text-sm text-typography-500">
                    {plan.description}
                  </Text>
                </VStack>
                <VStack className="items-end">
                  <Text className="text-xl font-bold text-typography-900">
                    {plan.price}
                  </Text>
                  <Text className="text-sm text-typography-500">
                    per {plan.period}
                  </Text>
                </VStack>
              </HStack>
            </Radio>
          ))}
        </VStack>
      </RadioGroup>

      {/* Subscribe Button */}
      <Box className="mt-auto mb-2">
        <Button
          className="rounded-xl w-full h-16"
          onPress={handleSubscribe}
          disabled={!selectedPlan}
        >
          <ButtonText className="text-lg">Upgrade to Pro</ButtonText>
        </Button>
        <Pressable
          onPress={() =>
            WebBrowser.openBrowserAsync(
              "https://shipmobilefast.com/terms-of-service"
            )
          }
        >
          <Text className="text-center mt-4 text-xs text-typography-500">
            Cancel anytime.{" "}
            <Text className="underline text-xs">Terms of Service</Text> apply.
          </Text>
        </Pressable>
      </Box>
    </VStack>
  );
};

export default Paywall;
