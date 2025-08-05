import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    optimizePackageImports: ['@next/font']
  },
  // Handle font loading issues
  images: {
    domains: ['fonts.googleapis.com', 'fonts.gstatic.com']
  }
};

export default nextConfig;
