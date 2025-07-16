import React from "react";
import { VStack } from "@/core/components/ui/vstack";
import { Box } from "@/core/components/ui/box";
import { Text } from "@/core/components/ui/text";
import { Button, ButtonText } from "@/core/components/ui/button";
import { useRouter } from "expo-router";

const NotFoundScreen = () => {
  const router = useRouter();
  return (
    <VStack className="flex-1 items-center justify-center">
      <Box className="p-4">
        <Text className="text-2xl font-bold text-typography-900 text-center">
          Not Found
        </Text>
        <Button onPress={() => router.replace("/")} className="mt-2">
          <ButtonText>Go to home</ButtonText>
        </Button>
      </Box>
    </VStack>
  );
};

export default NotFoundScreen;
