// components/ui/ThemeProvider/ThemeProvider.tsx
"use client";

import React, { createContext, useState, useEffect, useContext } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useColorScheme } from "nativewind";
import { customDarkTheme, customLightTheme } from "@/config/theme";
import { ThemeProvider as NVThemeProvider } from "@react-navigation/native";

type Theme = "light" | "dark" | "system";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const { setColorScheme } = useColorScheme();
  const [theme, setTheme] = useState<Theme>("system");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSavedTheme();
  }, []);

  const loadSavedTheme = async () => {
    try {
      const savedTheme = (await AsyncStorage.getItem("theme")) as Theme;
      if (savedTheme) {
        setTheme(savedTheme);
        setColorScheme(savedTheme);
      }
    } catch (error) {
      console.error("Error loading theme:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTheme = async () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    setColorScheme(newTheme);

    try {
      await AsyncStorage.setItem("theme", newTheme);
    } catch (error) {
      console.error("Error saving theme:", error);
    }
  };

  if (isLoading) {
    return null;
  }

  const isDark = theme === "dark";
  const themeConfig = isDark ? customDarkTheme : customLightTheme;

  return (
    <ThemeContext.Provider
      value={{
        theme,
        toggleTheme,
        isDark,
      }}
    >
      <NVThemeProvider value={themeConfig}>{children}</NVThemeProvider>
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
