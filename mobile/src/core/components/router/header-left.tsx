import { router } from "expo-router";
import { ArrowLeftIcon } from "lucide-react-native";
import React from "react";

import { Icon } from "@/core/components/ui/icon";
import { Pressable } from "@/core/components/ui/pressable";

const HeaderLeft = () => {
  return (
    <Pressable onPress={() => router.back()}>
      <Icon as={ArrowLeftIcon} className="text-black dark:text-white" />
    </Pressable>
  );
};

export default HeaderLeft;
