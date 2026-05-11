import type { NextConfig } from "next";
import type { RemotePattern } from "next/dist/shared/lib/image-config";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

const getRemotePatterns = () => {
  const patterns: Array<{
    protocol: RemotePattern["protocol"];
    hostname: RemotePattern["hostname"];
  }> = [];

  const extraDomains =
    process.env.NEXT_PUBLIC_ALLOWED_DOMAINS?.split(",") || [];

  extraDomains.forEach((domain) => {
    const trimmedDomain = domain.trim();
    if (trimmedDomain) {
      patterns.push(
        { protocol: "https" as const, hostname: trimmedDomain },
        { protocol: "http" as const, hostname: trimmedDomain },
      );
    }
  });

  return patterns;
};

const nextConfig: NextConfig = {
  output: "standalone",
  basePath: basePath,
  images: {
    remotePatterns: getRemotePatterns(),
  },
  typedRoutes: true,
  experimental: {
    typedEnv: true,
    optimizePackageImports: [
      "@igrp/igrp-framework-react-design-system",
      "@igrp/framework-next-ui",
      "@igrp/framework-next",
      "@tanstack/react-query",
    ],
  },
};

export default nextConfig;
