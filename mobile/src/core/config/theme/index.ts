import { type Theme } from "@react-navigation/native";
import { fonts } from "@react-navigation/native/src/theming/fonts";

//! You need to change colors on gluestack-ui-provider/config.ts file too. 🚨

// Light theme colors
export const customLightTheme: Theme = {
  dark: false,
  colors: {
    // TODO: Change primary color to your brand color 🔥
    primary: "#000000",
    background: "#ffffff",
    card: "#ffffff",
    text: "#000000",
    border: "#e0e0e0",
    notification: "#ff0000",
  },
  fonts: fonts,
};

// Dark theme colors
export const customDarkTheme: Theme = {
  dark: true,
  colors: {
    // TODO: Change primary color to your brand color 🔥
    primary: "#ffffff",
    background: "#111111",
    card: "#181818",
    text: "#ffffff",
    border: "#333",
    notification: "#ff0000",
  },
  fonts: fonts,
};
