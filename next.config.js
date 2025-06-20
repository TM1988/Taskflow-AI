/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable experimental features for faster navigation
  experimental: {
    optimisticClientCache: true,
  },
  // Optimize for faster client-side routing
  swcMinify: true,
  compress: true,
  poweredByHeader: false,
  
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        dns: false,
        net: false,
        tls: false,
        fs: false,
        request: false,
        mongodb: false,
        child_process: false,
        stream: false,
        crypto: false,
      };
    }
    return config;
  },
};

module.exports = nextConfig;