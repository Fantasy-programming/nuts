import React from "react";
import { Pressable } from "@/core/components/ui/pressable";
import { Icon } from "@/core/components/ui/icon";
import { XIcon } from "lucide-react-native";
import { router } from "expo-router";

const HeaderClose = () => {
  return (
    <Pressable onPress={() => router.back()} className="mx-1">
      <Icon as={XIcon} className="text-black dark:text-white" />
    </Pressable>
  );
};

export default HeaderClose;
