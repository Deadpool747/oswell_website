import type { NextConfig } from "next";

const staticExport = process.env.NEXT_STATIC_EXPORT === "1";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  agentRules: false,
  trailingSlash: true,
  ...(staticExport ? { output: "export" as const } : {})
};

export default nextConfig;
