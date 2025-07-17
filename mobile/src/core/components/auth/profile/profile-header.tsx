import React from "react";
import { Box } from "@/components/ui/box";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Text } from "@/components/ui/text";
import { Badge, BadgeIcon, BadgeText } from "@/components/ui/badge";
import { Verified, Camera, Pen } from "lucide-react-native";
import { Pressable } from "@/components/ui/pressable";
import { Icon } from "@/components/ui/icon";
import {
  Avatar,
  AvatarFallbackText,
  AvatarImage,
} from "@/components/ui/avatar";
import { useAuth } from "@/provider/SupabaseProvider";

interface ProfileHeaderProps {
  onEditPress: () => void;
}

export function ProfileHeader({ onEditPress }: ProfileHeaderProps) {
  const { user } = useAuth();
  return (
    <VStack className="py-6 px-6">
      {/* Profile Image & Basic Info */}
      <Box className="flex-row items-center justify-between">
        <Box className="relative">
          <Avatar className="bg-background">
            <AvatarFallbackText>
              <Text>JD</Text>
            </AvatarFallbackText>
            <AvatarImage
              source={{ uri: "https://via.placeholder.com/100" }}
              className="w-16 h-16 rounded-full"
              alt="Profile"
            />
            <Pressable
              onPress={onEditPress}
              className="bg-black p-2 rounded-full absolute -bottom-2 -right-2"
            >
              <Camera size={12} color="white" />
            </Pressable>
          </Avatar>
        </Box>

        <VStack className="flex-1 ml-4 justify-center">
          <HStack className="items-center">
            <Text className="text-base font-bold text-typography-900">
              FULL NAME
            </Text>
            <Badge size="sm" className="ml-2">
              <BadgeText>Pro</BadgeText>
              <BadgeIcon as={Verified} className="ml-1" />
            </Badge>
          </HStack>
          <Text className="text-sm">{user?.email}</Text>
          <Text className="text-sm text-typography-500">
            Full Stack Developer
          </Text>
        </VStack>
        <Pressable
          onPress={onEditPress}
          className="bg-background-50 p-2 rounded-full"
        >
          <Icon as={Pen} size="sm" className="text-primary-900" />
        </Pressable>
      </Box>
    </VStack>
  );
}
