import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  ...(process.env.DOMEL_STANDALONE_BUILD === "true" ? { output: "standalone" as const } : {}),
  reactStrictMode: true,
  poweredByHeader: false,
};

export default nextConfig;
