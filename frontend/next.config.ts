import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/history",
        destination: "/weight",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
