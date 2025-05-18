/** @type {import('next').NextConfig} */
const nextConfig = {
  images: { unoptimized: true },
  webpack: (config) => {
    // Handle node:events protocol specifically
    config.resolve.alias = {
      ...config.resolve.alias,
      'node:events': require.resolve('events/')
    };

    // Basic Node.js polyfills/mocks
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
      os: false,
      child_process: false,
      crypto: false,
      stream: false,
      http: false,
      https: false,
      zlib: false,
      util: false,
      url: false,
      querystring: false,
      net: false,
      tls: false,
      events: require.resolve('events/')
    };

    return config;
  },
};

module.exports = nextConfig;