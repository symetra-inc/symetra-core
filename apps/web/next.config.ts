import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  serverExternalPackages: ["@prisma/client", "prisma"],
  // A home é o HTML estático aprovado em public/home.html; o resto do app segue no App Router.
  async rewrites() {
    return {
      beforeFiles: [{ source: "/", destination: "/home.html" }],
      afterFiles: [],
      fallback: [],
    };
  },
};

export default nextConfig;
