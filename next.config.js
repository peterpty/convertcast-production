/** @type {import('next').NextConfig} */
const nextConfig = {
  // Fix workspace root warning
  outputFileTracingRoot: __dirname,

  // Optimize images
  images: {
    domains: ['localhost', 'convertcast.app', 'cdn.builder.io', 'fast.wistia.net', 'wistia.com', 'embedwistia-a.akamaihd.net'],
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  // Enable compression
  compress: true,

  // Optimize headers for performance
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
        ],
      },
      // Cache static assets aggressively
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=300, stale-while-revalidate=60',
          },
        ],
      },
      // Cache WebSocket connections
      {
        source: '/ws/(.*)',
        headers: [
          {
            key: 'Connection',
            value: 'upgrade',
          },
          {
            key: 'Upgrade',
            value: 'websocket',
          },
        ],
      },
    ];
  },

  // Minimal webpack configuration to prevent worker process conflicts
  webpack: (config, { dev, isServer }) => {
    // Only add client-side fallbacks to prevent Node.js module conflicts
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
      };
    }

    return config;
  },

  // Disable experimental features that cause worker issues
  experimental: {
    optimizeCss: false,
    workerThreads: false,
    cpus: 1,
  },

  // Move external packages to correct location
  serverExternalPackages: [],

  // Output configuration for production
  output: 'standalone',

  // Environment variables
  env: {
    CUSTOM_KEY: 'convertcast-production',
    MAX_CONCURRENT_USERS: '50000',
    WEBSOCKET_MAX_CONNECTIONS: '50000',
    REDIS_MAX_CONNECTIONS: '1000',
    DB_POOL_SIZE: '100',
  },

  // Disable source maps in production for performance
  productionBrowserSourceMaps: false,

  // Enable React strict mode
  reactStrictMode: true,
};

module.exports = nextConfig;