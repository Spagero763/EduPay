import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  // @ts-expect-error — eslint key is valid at runtime but typing moved in Next 16
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
