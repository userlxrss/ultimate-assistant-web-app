import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// 🚀 STABLE VITE CONFIG for production reliability
export default defineConfig({
  plugins: [
    react({
      // Use stable JSX runtime
      jsxRuntime: 'automatic'
    })
  ],
  server: {
    port: 5175,
    host: true,
    proxy: {
      '/calendar-proxy': {
        target: 'https://calendar.google.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/calendar-proxy/, ''),
        secure: true
      },
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
      },
      '/auth': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
      }
    }
  },
  build: {
    // 🛡️ STABLE build configuration
    target: 'es2020', // Stable target for compatibility
    minify: 'terser',
    rollupOptions: {
      output: {
        // Simple chunk splitting for stability
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom')) {
              return 'react-vendor';
            }
            if (id.includes('recharts') || id.includes('chart.js')) {
              return 'charts';
            }
            return 'vendor';
          }
        }
      }
    },
    // Relaxed chunk size limit to prevent build issues
    chunkSizeWarningLimit: 1000,
    // Enable source maps for debugging
    sourcemap: true,
    // CSS code splitting
    cssCodeSplit: true
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom/client',
      'react-dom',
      'axios',
      'date-fns',
      'lucide-react'
    ]
  },
  define: {
    __DEV__: JSON.stringify(process.env.NODE_ENV === 'development')
  }
})