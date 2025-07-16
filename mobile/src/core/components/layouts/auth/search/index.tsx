import React, { useState } from "react";
import { VStack } from "@/components/ui/vstack";
import { SearchBar } from "@/components/auth/search/search-bar";
import { CategoryTabs } from "@/components/auth/search/category-tabs";
import { ExploreGrid } from "@/components/auth/search/explore-grid";
import { SafeAreaView } from "@/components/ui/safe-area-view";

export default function SearchScreen() {
  const [selectedCategory, setSelectedCategory] = useState("For You");

  return (
    <SafeAreaView className="flex-1">
      <VStack className="flex-1 bg-background">
        <SearchBar />
        <CategoryTabs
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
        />
        <ExploreGrid onPostPress={() => {}} />
      </VStack>
    </SafeAreaView>
  );
}
