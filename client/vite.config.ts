import { defineConfig } from "vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";

import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from 'vite-tsconfig-paths'

const ReactCompilerConfig = {};

export default defineConfig({
  plugins: [
    tanstackRouter({
      autoCodeSplitting: true,
    }),
    react({
      babel: {
        plugins: [["babel-plugin-react-compiler", ReactCompilerConfig]],
      },
    }),
    tailwindcss(),
    tsConfigPaths(),
  ],
});
