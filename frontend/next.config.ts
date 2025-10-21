import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  distDir: '.next',
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    serverComponentsExternalPackages: [],
  },
  // Ensure compatibility with Vercel
  trailingSlash: false,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
