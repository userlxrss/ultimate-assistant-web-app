import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// 🚀 ULTRA FAST VITE CONFIG for maximum performance!
export default defineConfig({
  plugins: [
    react({
      // 🚀 Fast refresh enabled
      fastRefresh: true,
      // 🚀 JSX runtime optimization
      jsxRuntime: 'automatic'
    })
  ],
  server: {
    port: 5173,
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
    },
    // 🚀 Development optimizations
    hmr: {
      overlay: false // Disable error overlay for faster HMR
    }
  },
  build: {
    // 🚀 AGGRESSIVE build optimizations
    target: 'esnext', // Modern browsers for faster builds
    minify: 'terser', // Better minification
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.log in production
        drop_debugger: true, // Remove debugger statements
        pure_funcs: ['console.log', 'console.info', 'console.debug'] // Remove specific functions
      }
    },
    rollupOptions: {
      output: {
        // 🚀 SMART chunk splitting for optimal loading
        manualChunks: (id) => {
          // Separate vendor libraries
          if (id.includes('node_modules')) {
            // React core
            if (id.includes('react') || id.includes('react-dom')) {
              return 'react-vendor';
            }
            // Chart libraries - lazy load
            if (id.includes('recharts') || id.includes('chart.js')) {
              return 'charts';
            }
            // Google APIs - separate chunk
            if (id.includes('googleapis') || id.includes('google')) {
              return 'google';
            }
            // Utility libraries
            if (id.includes('axios') || id.includes('date-fns') || id.includes('lucide-react')) {
              return 'utils';
            }
            // Data validation
            if (id.includes('zod') || id.includes('joi')) {
              return 'validation';
            }
            // Other node modules
            return 'vendor';
          }
        },
        // 🚀 Optimize chunk naming
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId ? chunkInfo.facadeModuleId.split('/').pop() : 'chunk';
          return `js/[name]-[hash].js`;
        }
      }
    },
    // 🚀 Optimize chunks
    chunkSizeWarningLimit: 500, // Stricter limit for better performance
    // 🚀 Disable source maps in production for smaller bundles
    sourcemap: false,
    // 🚀 Enable CSS code splitting
    cssCodeSplit: true
  },
  // 🚀 Optimize dependencies for faster dev server
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'axios',
      'date-fns',
      'lucide-react'
    ],
    exclude: [
      'recharts',
      'chart.js',
      'googleapis' // Lazy load heavy libraries
    ]
  },
  // 🚀 Enable experimental features for better performance
  experimental: {
    renderBuiltUrl: (filename, { hostType }) => {
      if (hostType === 'js') {
        return { js: `/${filename}` };
      } else {
        return { relative: true };
      }
    }
  },
  // 🚀 Define global constants for tree shaking
  define: {
    __DEV__: JSON.stringify(process.env.NODE_ENV === 'development')
  }
})