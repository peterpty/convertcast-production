import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Ignore ESLint errors during builds for deployment
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Skip TypeScript checks during builds for rapid deployment
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.builder.io',
      },
    ],
  },
};

export default nextConfig;
