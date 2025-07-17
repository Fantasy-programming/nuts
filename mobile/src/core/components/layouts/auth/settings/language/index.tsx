import React from "react";
import { FlatList } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTranslation } from "react-i18next";
import { Box } from "@/components/ui/box";
import { Text } from "@/components/ui/text";
import { SafeAreaView } from "@/components/ui/safe-area-view";
import { HStack } from "@/components/ui/hstack";
import {
  Radio,
  RadioGroup,
  RadioIcon,
  RadioIndicator,
  RadioLabel,
} from "@/components/ui/radio";
import { CircleIcon } from "lucide-react-native";

const languages = [
  {
    name: "Türkçe",
    code: "tr",
    flag: "🇹🇷",
  },
  {
    name: "English",
    code: "en",
    flag: "🇺🇸",
  },
  {
    name: "Deutsch",
    code: "de",
    flag: "🇩🇪",
  },
  {
    name: "Español",
    code: "es",
    flag: "🇪🇸",
  },
];

const LanguageSettings = () => {
  const { i18n } = useTranslation();
  const currentLanguage = i18n.language;

  const changeLanguage = async (lang: string) => {
    await AsyncStorage.setItem("language", lang);
    i18n.changeLanguage(lang);
  };

  const renderItem = ({ item }: { item: (typeof languages)[0] }) => {
    return (
      <Box className="p-4 border border-outline-100 mx-2 rounded-xl mt-2">
        <Radio value={item.code} size="md" className="justify-between">
          <HStack space="md" className="items-center">
            <Text className="text-2xl mr-2">{item.flag}</Text>
            <RadioLabel>
              <Text className="text-lg text-typography-900">{item.name}</Text>
            </RadioLabel>
          </HStack>
          <RadioIndicator>
            <RadioIcon as={CircleIcon} />
          </RadioIndicator>
        </Radio>
      </Box>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <Box className="flex-1">
        <RadioGroup
          value={currentLanguage}
          onChange={changeLanguage}
          className="rounded-xl"
        >
          <FlatList
            data={languages}
            renderItem={renderItem}
            keyExtractor={(item) => item.code}
            showsVerticalScrollIndicator={false}
            contentContainerClassName="pt-1"
          />
        </RadioGroup>
      </Box>
    </SafeAreaView>
  );
};

export default LanguageSettings;
