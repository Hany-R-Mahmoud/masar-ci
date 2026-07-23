import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // MasarCI is a client-only static SPA (no backend, no GitHub API).
  output: "export",
  // Static export: images are not optimized by a Next server.
  images: { unoptimized: true },
  // Type-checking is a separate gate (`pnpm tsc` / `pnpm lint`); skip the
  // redundant build-time check so `next build` stays fast (Monaco's large
  // type graph would otherwise slow it past interactive thresholds).
  typescript: { ignoreBuildErrors: true },
};

export default nextConfig;
