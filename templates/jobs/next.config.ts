import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "centrali.io",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "api.centrali.io",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
