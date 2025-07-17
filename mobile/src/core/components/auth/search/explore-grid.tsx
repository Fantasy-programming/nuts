import React from "react";
import { FlatList } from "@/components/ui/flat-list";
import { Pressable } from "@/components/ui/pressable";
import { Image } from "@/components/ui/image";
import { useWindowDimensions } from "react-native";

// Dummy data for explore grid
const EXPLORE_DATA = [
  {
    id: "1",
    imageUrl: "https://picsum.photos/500/500?random=1",
    likes: 1234,
    comments: 56,
  },
  {
    id: "2",
    imageUrl: "https://picsum.photos/500/500?random=2",
    likes: 4321,
    comments: 89,
  },
  ...Array.from({ length: 28 }, (_, i) => ({
    id: `${i + 3}`,
    imageUrl: `https://picsum.photos/500/500?random=${i + 3}`,
    likes: Math.floor(Math.random() * 10000),
    comments: Math.floor(Math.random() * 1000),
  })),
];

interface ExploreGridProps {
  onPostPress?: (postId: string) => void;
}

export function ExploreGrid({ onPostPress }: ExploreGridProps) {
  const { width } = useWindowDimensions();
  const itemSize = width / 3;

  const renderItem = ({ item }: { item: (typeof EXPLORE_DATA)[0] }) => (
    <Pressable
      onPress={() => onPostPress?.(item.id)}
      className="relative"
      style={{ width: itemSize, height: itemSize }}
    >
      <Image
        source={{ uri: item.imageUrl }}
        className="w-full h-full"
        alt="Explore post"
      />
    </Pressable>
  );

  return (
    <FlatList
      data={EXPLORE_DATA}
      renderItem={renderItem}
      numColumns={3}
      keyExtractor={(item) => item.id}
      className="bg-background"
      showsVerticalScrollIndicator={false}
    />
  );
}

export default ExploreGrid;
