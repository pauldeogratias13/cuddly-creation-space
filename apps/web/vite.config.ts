import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { tanstackRouterPlugin } from '@tanstack/router-plugin';
import { viteTsconfigPaths } from 'vite-tsconfig-paths';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [
    react(),
    tanstackRouterPlugin(),
    viteTsconfigPaths(),
    tailwindcss(),
  ],
  server: {
    port: 3000,
    host: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
  resolve: {
    alias: {
      '@': './src',
    },
  },
});
