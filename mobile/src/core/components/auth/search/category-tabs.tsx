import React from "react";
import { ScrollView } from "react-native";
import { HStack } from "@/components/ui/hstack";
import { Button, ButtonText } from "@/components/ui/button";

const CATEGORIES = [
  "For You",
  "Travel",
  "Architecture",
  "Food",
  "Nature",
  "Art",
  "Fashion",
  "Technology",
  "Sports",
];

interface CategoryTabsProps {
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
}

export function CategoryTabs({
  selectedCategory,
  onSelectCategory,
}: CategoryTabsProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      className="mb-1"
      contentContainerClassName="mx-2 my-4"
    >
      <HStack space="sm">
        {CATEGORIES.map((category) => (
          <Button
            key={category}
            variant="solid"
            onPress={() => onSelectCategory(category)}
            className={`py-2 ${
              selectedCategory === category
                ? "bg-primary-900 rounded-xl"
                : "bg-transparent rounded-xl"
            }`}
          >
            <ButtonText
              className={`${
                selectedCategory === category
                  ? "font-bold"
                  : "text-typography-500"
              }`}
            >
              {category}
            </ButtonText>
          </Button>
        ))}
      </HStack>
    </ScrollView>
  );
}

export default CategoryTabs;
