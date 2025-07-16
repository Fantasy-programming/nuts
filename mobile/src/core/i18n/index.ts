import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import * as Localization from "expo-localization";
import AsyncStorage from "@react-native-async-storage/async-storage";
import translationTr from "@/i18n/locales/tr-TR/translation.json";
import translationEn from "@/i18n/locales/en-US/translation.json";
import translationEs from "@/i18n/locales/es-ES/translation.json";
import translationDe from "@/i18n/locales/de-DE/translation.json";
import { Platform } from "react-native";

const resources = {
  tr: { translation: translationTr },
  en: { translation: translationEn },
  de: { translation: translationDe },
  es: { translation: translationEs },
};

const LANGUAGE_KEY = "language";

const getStoredLanguage = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(LANGUAGE_KEY);
  } catch (error) {
    console.error("Error getting language from AsyncStorage", error);
    return null;
  }
};

const setStoredLanguage = async (language: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(LANGUAGE_KEY, language);
  } catch (error) {
    console.error("Error saving language to AsyncStorage", error);
  }
};

const getDeviceLanguage = (): string => {
  const locales = Localization.getLocales();
  return locales && locales.length > 0 ? locales[0].languageCode || "en" : "en";
};

const initI18n = async (): Promise<void> => {
  try {
    let language = await getStoredLanguage();
    if (!language) {
      language = getDeviceLanguage();
      await setStoredLanguage(language);
    }
    await i18n.use(initReactI18next).init({
      compatibilityJSON: "v4",
      resources,
      lng: language,
      fallbackLng: "en",
      interpolation: {
        escapeValue: false,
      },
    });
  } catch (error) {
    console.error("Error initializing i18n", error);
  }
};

initI18n();

export default i18n;
