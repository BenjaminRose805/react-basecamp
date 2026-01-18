import path from "path";

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable React strict mode for better development experience
  reactStrictMode: true,

  // Disable x-powered-by header for security
  poweredByHeader: false,

  // Set the workspace root to this directory to avoid multiple lockfile issues
  outputFileTracingRoot: path.join(__dirname, "./"),
};

export default nextConfig;
