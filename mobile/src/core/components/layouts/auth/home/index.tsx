import React from "react";
import { VStack } from "@/components/ui/vstack";
import { PostsFeed } from "@/components/auth/home/post";
import { Button, ButtonGroup, ButtonText } from "@/components/ui/button";
import { router } from "expo-router";

export default function HomeScreen() {
  return (
    <VStack className="flex flex-col flex-1 bg-background">
      <ButtonGroup space="md" className="p-4 justify-center items-center">
        <Button
          variant="solid"
          className="w-full"
          onPress={() => {
            router.push("/paywall-single");
          }}
        >
          <ButtonText>Paywall 1</ButtonText>
        </Button>
        <Button
          variant="solid"
          className="w-full"
          onPress={() => {
            router.push("/paywall-double");
          }}
        >
          <ButtonText>Paywall 2</ButtonText>
        </Button>
        <Button
          variant="solid"
          className="w-full"
          onPress={() => router.push("/admob")}
        >
          <ButtonText>Admob</ButtonText>
        </Button>
      </ButtonGroup>
      <PostsFeed />
    </VStack>
  );
}
