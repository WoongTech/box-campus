import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@box-campus/engine"],
  allowedDevOrigins: ["127.0.0.1"],
};

export default nextConfig;
