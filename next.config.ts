import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  ignoreHydrationWarning: true,
  experimental: {
    serverActions: true,
  },
};

export default nextConfig;
