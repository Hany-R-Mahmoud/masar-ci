import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // MasarCI is a client-only static SPA (no backend, no GitHub API).
  output: "export",
  // TOKEN_POLICY_BATCHED_EXECUTION: permit the in-app browser's local QA origin in development.
  allowedDevOrigins: ["127.0.0.1"],
  // Static export: images are not optimized by a Next server.
  images: { unoptimized: true },
};

export default nextConfig;
