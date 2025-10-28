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
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Separate vendor libraries
          vendor: ['react', 'react-dom'],
          // Chart libraries - lazy load
          charts: ['recharts', 'react-chartjs-2', 'chart.js'],
          // Utility libraries
          utils: ['axios', 'date-fns', 'lucide-react'],
          // Google APIs - separate chunk
          google: ['googleapis'],
          // Data validation
          validation: ['zod', 'joi']
        }
      }
    },
    // Optimize chunks
    chunkSizeWarningLimit: 1000,
    // Enable source maps for debugging
    sourcemap: true
  },
  // Optimize dependencies
  optimizeDeps: {
    include: ['react', 'react-dom', 'axios', 'date-fns'],
    exclude: ['recharts', 'chart.js'] // Lazy load chart libraries
  }
})