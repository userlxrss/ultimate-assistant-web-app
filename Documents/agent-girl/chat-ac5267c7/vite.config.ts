import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/calendar-proxy': {
        target: 'https://calendar.google.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/calendar-proxy/, ''),
        secure: true
      }
    }
  }
})