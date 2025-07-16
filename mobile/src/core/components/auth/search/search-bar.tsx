import React, { useState } from "react";
import { Input, InputField, InputIcon, InputSlot } from "@/components/ui/input";
import { HStack } from "@/components/ui/hstack";
import { Search, X } from "lucide-react-native";
import { Pressable } from "@/components/ui/pressable";

interface SearchBarProps {
  onSearch?: (text: string) => void;
}

export function SearchBar({ onSearch }: SearchBarProps) {
  const [searchText, setSearchText] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  const handleClear = () => {
    setSearchText("");
    onSearch?.("");
  };

  const handleChangeText = (text: string) => {
    setSearchText(text);
    onSearch?.(text);
  };

  return (
    <HStack className="bg-background mx-2 mt-2">
      <Input className="flex-1 bg-background rounded-xl px-3 ios:py-2 android:h-12">
        <InputIcon as={Search} size={20} className="text-typography-500" />
        <InputField
          value={searchText}
          placeholder="Search"
          className="text-typography-900"
          placeholderClassName="text-typography-500"
          onChangeText={handleChangeText}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        />

        {isFocused && searchText.length > 0 && (
          <InputSlot>
            <Pressable onPress={handleClear}>
              <InputIcon as={X} size={18} className="text-typography-500" />
            </Pressable>
          </InputSlot>
        )}
      </Input>
    </HStack>
  );
}
