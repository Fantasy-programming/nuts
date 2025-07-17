import React from "react";
import { HStack } from "@/components/ui/hstack";
import { VStack } from "@/components/ui/vstack";
import { Text } from "@/components/ui/text";
import { Pressable } from "@/components/ui/pressable";
import { Box } from "@/components/ui/box";
import { Icon } from "@/components/ui/icon";
import { Heart, MessageCircle, Repeat2, Share } from "lucide-react-native";
import { FlatList } from "react-native";
import { useRouter } from "expo-router";
import {
  Avatar,
  AvatarFallbackText,
  AvatarImage,
} from "@/components/ui/avatar";

const SAMPLE_TWEETS = [
  {
    id: 1,
    avatar: "https://avatars.githubusercontent.com/u/1?v=4",
    username: "John Doe",
    handle: "johndoe",
    content: "Just shipped a new feature! 🚀 #coding #typescript",
    timestamp: "2h",
    likes: 42,
    retweets: 5,
    replies: 3,
  },
  {
    id: 2,
    avatar: "https://avatars.githubusercontent.com/u/2?v=4",
    username: "Jane Doe",
    handle: "janedoe",
    content: "Just finished a new project! 🎉 #design #ux",
    timestamp: "1h",
    likes: 28,
    retweets: 2,
    replies: 1,
  },
  {
    id: 3,
    avatar: "https://avatars.githubusercontent.com/u/3?v=4",
    username: "Alice Smith",
    handle: "alicesmith",
    content: "Just finished a new project! 🎉 #design #ux",
    timestamp: "1h",
    likes: 28,
    retweets: 2,
    replies: 1,
  },
  {
    id: 4,
    avatar: "https://avatars.githubusercontent.com/u/4?v=4",
    username: "Bob Johnson",
    handle: "bobjohnson",
    content: "Just finished a new project! 🎉 #design #ux",
    timestamp: "1h",
    likes: 28,
    retweets: 2,
    replies: 1,
  },
];

interface PostCardProps {
  avatar: string;
  username: string;
  handle: string;
  content: string;
  timestamp: string;
  likes?: number;
  retweets?: number;
  replies?: number;
}

export function PostCard({
  avatar,
  username,
  handle,
  content,
  timestamp,
  likes = 0,
  retweets = 0,
  replies = 0,
}: PostCardProps) {
  const router = useRouter();
  return (
    <Pressable onPress={() => router.push(`/paywall-double`)}>
      <Box className="p-4 border-b border-outline-50">
        <HStack className="space-x-3">
          <Avatar className="w-12 h-12 mr-2 border-none">
            <AvatarFallbackText>{username.charAt(0)}</AvatarFallbackText>
            <AvatarImage
              source={{ uri: avatar }}
              className="w-12 h-12 rounded-full"
              alt={username}
            />
          </Avatar>
          <VStack className="flex-1 space-y-1">
            {/* Header */}
            <HStack className="items-center space-x-2 flex-1">
              <Text className="font-bold text-typography-900">{username}</Text>
              <Text className="text-typography-600 ml-1">@{handle}</Text>

              <Text className="text-typography-600 ml-1">·</Text>
              <Text className="text-typography-600 ml-1">{timestamp}</Text>
            </HStack>
            {/* Content */}
            <Text className="text-typography-900">{content}</Text>

            {/* Actions */}
            <HStack className="justify-between mt-3 pr-8">
              <ActionButton icon={MessageCircle} count={replies} />
              <ActionButton icon={Repeat2} count={retweets} />
              <ActionButton icon={Heart} count={likes} />
              <ActionButton icon={Share} />
            </HStack>
          </VStack>
        </HStack>
      </Box>
    </Pressable>
  );
}

interface ActionButtonProps {
  icon: React.ElementType;
  count?: number;
}

function ActionButton({ icon: IconComponent, count }: ActionButtonProps) {
  return (
    <Pressable>
      <HStack className="items-center space-x-1">
        <Icon as={IconComponent} size="sm" className="text-typography-600" />
        {count !== undefined && (
          <Text className="text-sm text-typography-600 ml-1">{count}</Text>
        )}
      </HStack>
    </Pressable>
  );
}

export const PostsFeed = () => {
  return (
    <VStack className="flex-1 bg-background">
      <FlatList
        data={SAMPLE_TWEETS}
        renderItem={({ item }) => <PostCard {...item} />}
        keyExtractor={(item) => item.id.toString()}
        initialNumToRender={10}
        windowSize={5}
        className="bg-background m-2"
      />
    </VStack>
  );
};
