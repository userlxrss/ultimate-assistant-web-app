/** @type {import('next').NextConfig} */
const nextConfig = {
  // Handle images properly for Vercel deployment
  images: {
    domains: ['localhost'], // Add your Supabase storage domain if needed
  },
  // Enable React strict mode for better development experience
  reactStrictMode: true,
  // Experimental features for better build performance
  experimental: {
    serverComponentsExternalPackages: ['@supabase/supabase-js'],
  },
  // Ensure proper module resolution
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      }
    }
    return config
  },
}

module.exports = nextConfig