import { ThemeProviderContext } from "@/features/preferences/contexts/theme.context";
import * as React from "react";

export const useTheme = () => {
  const context = React.useContext(ThemeProviderContext);

  if (context === undefined) throw new Error("useTheme must be used within a ThemeProvider");

  return context;
};
