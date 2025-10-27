import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5177,
    host: true,
    cors: true,
    proxy: {
      // Proxy API requests to the API adapter
      '/api/tasks': {
        target: 'http://localhost:3015',
        changeOrigin: true,
        secure: false
      },
      '/api/contacts': {
        target: 'http://localhost:3015',
        changeOrigin: true,
        secure: false
      },
      // Direct proxy for Gmail (existing)
      '/api/gmail': {
        target: 'http://localhost:3012',
        changeOrigin: true,
        secure: false
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  }
})