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
  build: {
    target: 'esnext',
    minify: 'esbuild',
    cssMinify: true,
    rollupOptions: {
      output: {
        // Improved chunk splitting for better caching and loading
        manualChunks: {
          // Core framework chunks
          'react-vendor': ['react', 'react-dom'],
          'query-vendor': ['@tanstack/react-query'],
          'router-vendor': ['@tanstack/react-router'],

          // UI vendor chunks (split by category)
          'ui-radix': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-select',
            '@radix-ui/react-tabs',
            '@radix-ui/react-alert-dialog',
            '@radix-ui/react-popover',
            '@radix-ui/react-tooltip'
          ],
          'ui-components': ['lucide-react', '@remixicon/react'],

          // Chart and data visualization
          'chart-vendor': ['recharts'],

          // Form handling
          'form-vendor': ['react-hook-form', '@hookform/resolvers', 'zod'],

          // Utilities (keep these separate for better caching)
          'date-utils': ['date-fns'],
          'style-utils': ['clsx', 'tailwind-merge', 'class-variance-authority'],

          // Financial/business logic
          'finance-vendor': ['currency-symbol-map', 'papaparse'],

          // Animation and interactions
          'motion-vendor': ['motion', '@dnd-kit/core', '@dnd-kit/sortable', '@dnd-kit/utilities'],

          // Internationalization
          'i18n-vendor': ['i18next', 'i18next-http-backend', 'react-i18next'],

          // Third-party integrations (these can be lazy loaded)
          'integrations': ['react-plaid-link', 'teller-connect-react', '@mono.co/connect.js'],
        },

        // Optimize chunk file names for better caching
        chunkFileNames: (chunkInfo) => {
          if (chunkInfo.name === 'vendor') {
            return 'assets/vendor-[hash].js';
          }
          return 'assets/[name]-[hash].js';
        },
        assetFileNames: 'assets/[name]-[hash].[ext]',
        entryFileNames: 'assets/[name]-[hash].js',
      },
    },

    // Increase chunk size warning limit since we're optimizing
    chunkSizeWarningLimit: 800,

    // Enable source maps for production debugging (optional)
    sourcemap: false,
  },

  // Optimize dev server
  server: {
    hmr: {
      overlay: false, // Reduce dev noise
    },
  },

  // Optimize dependencies
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      '@tanstack/react-query',
      '@tanstack/react-router',
      'zustand',
      'axios',
      'date-fns',
      'clsx',
      'tailwind-merge',
      'react-plaid-link',
      'teller-connect-react',
      '@mono.co/connect.js'
    ],
    // exclude: [
    //   // These will be lazy loaded
    // ]
  },
});
