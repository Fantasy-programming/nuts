import React from "react";
import { Box } from "@/components/ui/box";
import { Button, ButtonText } from "@/components/ui/button";

interface DeleteButtonProps {
  onPress: () => void;
  disabled: boolean;
}

export function DeleteButton({ onPress, disabled }: DeleteButtonProps) {
  return (
    <Box className="mt-auto mb-4">
      <Button
        className="bg-red-500 rounded-xl w-full h-16 items-center justify-center active:bg-red-600"
        onPress={onPress}
        disabled={disabled}
        action="negative"
      >
        <ButtonText className="text-white font-bold">Delete Account</ButtonText>
      </Button>
    </Box>
  );
}
