import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  async redirects() {
    return [
      {
        source: "/resort/:id*",
        destination: "/resorts/:id*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;