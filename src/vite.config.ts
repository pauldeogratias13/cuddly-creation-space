import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
      '@/components': path.resolve(__dirname, 'components'),
      '@/integrations': path.resolve(__dirname, 'integrations'),
      '@/hooks': path.resolve(__dirname, 'hooks'),
      '@/lib': path.resolve(__dirname, 'lib'),
    },
  },
  server: {
    port: 3000,
    host: true,
  },
  build: {
    outDir: '../dist',
    emptyOutDir: true,
  },
});
