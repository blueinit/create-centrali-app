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
      {
        protocol: "https",
        hostname: "centrali.dev",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "api.centrali.dev",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
