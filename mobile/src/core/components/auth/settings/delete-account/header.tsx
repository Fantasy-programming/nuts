import React from "react";
import { VStack } from "@/components/ui/vstack";
import { Text } from "@/components/ui/text";

export function DeleteHeader() {
  return (
    <VStack space="lg" className="mb-4">
      <Text className="text-base text-typography-900 font-bold items-center text-center">
        We're sorry to see you go. {"\n"} Please let us know why you're leaving:
      </Text>
    </VStack>
  );
}
