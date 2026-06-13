import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Tree-shake icon imports so we only bundle the icons we use, not the
    // whole lucide-react barrel.
    optimizePackageImports: ["lucide-react"],
  },
};

export default nextConfig;
