import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, '.'),
      '@/components': resolve(__dirname, 'components'),
      '@/styles': resolve(__dirname, 'styles'),
    },
  },
  css: {
    preprocessorOptions: {
      css: {
        charset: false,
      },
    },
    modules: {
      localsConvention: 'camelCase',
    },
  },
  server: {
    port: 3000,
    open: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          theme: ['./ThemeContext', './ThemeToggle', './themes'],
        },
      },
    },
  },
});