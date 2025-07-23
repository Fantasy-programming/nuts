import { defineConfig } from '@react-email/cli';

export default defineConfig({
  // The directory where your email templates are located
  dir: './src/templates',
  // The port to run the development server on
  port: 3002,
  // Whether to open the browser automatically
  open: false,
});