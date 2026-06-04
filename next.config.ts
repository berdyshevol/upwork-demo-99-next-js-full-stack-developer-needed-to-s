import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // This prototype lives inside a larger repo that has its own lockfile.
  // Pin the Turbopack root to this folder so Next.js resolves files correctly.
  turbopack: {
    root: path.resolve(import.meta.dirname),
  },
};

export default nextConfig;
