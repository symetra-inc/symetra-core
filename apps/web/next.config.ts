import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  serverExternalPackages: ["@prisma/client", "prisma"],
  // A home é o HTML estático aprovado em public/home.html; o resto do app segue no App Router.
  // Atalhos que as pessoas digitam e antes davam 404.
  async redirects() {
    return [
      { source: "/inbox", destination: "/dashboard/chat", permanent: false },
      { source: "/dashboards", destination: "/dashboard", permanent: false },
      { source: "/dashboards/:path*", destination: "/dashboard/:path*", permanent: false },
      { source: "/sair", destination: "/logout", permanent: false },
    ];
  },
  async rewrites() {
    return {
      beforeFiles: [{ source: "/", destination: "/home.html" }],
      afterFiles: [],
      fallback: [],
    };
  },
};

export default nextConfig;
