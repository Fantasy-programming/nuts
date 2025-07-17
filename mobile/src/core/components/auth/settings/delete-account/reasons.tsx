import React from "react";
import { VStack } from "@/components/ui/vstack";
import { Text } from "@/components/ui/text";
import {
  Radio,
  RadioGroup,
  RadioIcon,
  RadioIndicator,
  RadioLabel,
} from "@/components/ui/radio";
import { CircleIcon } from "lucide-react-native";

const deleteReasons = [
  "I don't use the app anymore",
  "I found a better alternative",
  "The app is too expensive",
  "I'm having technical issues",
  "Privacy concerns",
  "Other",
];

interface DeleteReasonsProps {
  selectedReason: string | null;
  setSelectedReason: (reason: string | null) => void;
}

export function DeleteReasons({
  selectedReason,
  setSelectedReason,
}: DeleteReasonsProps) {
  return (
    <RadioGroup
      value={selectedReason || undefined}
      onChange={setSelectedReason}
      className="w-full mb-6"
    >
      <VStack space="md">
        {deleteReasons.map((reason) => (
          <Radio
            key={reason}
            value={reason}
            size="lg"
            className={`p-4 rounded-xl border-2 ${
              selectedReason === reason
                ? "border-red-500 bg-primary"
                : "border-outline-200"
            }`}
          >
            <RadioIndicator className="mr-2 text-red-500">
              <RadioIcon as={CircleIcon} />
            </RadioIndicator>
            <RadioLabel>
              <Text className="text-lg text-typography-900">{reason}</Text>
            </RadioLabel>
          </Radio>
        ))}
      </VStack>
    </RadioGroup>
  );
}
