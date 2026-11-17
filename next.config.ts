import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["whycrash", "@prisma/adapter-pg", "pg"],
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
