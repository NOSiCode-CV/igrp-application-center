import path from "node:path";
import { fileURLToPath } from "node:url";

import type { NextConfig } from "next";
import type { RemotePattern } from "next/dist/shared/lib/image-config";

/** Absolute app root so Turbopack does not pick a parent `pnpm-lock.yaml` (e.g. on `D:\`). */
const turbopackRoot = path.dirname(fileURLToPath(import.meta.url));

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

const getRemotePatterns = () => {
  const patterns: Array<{
    protocol: RemotePattern["protocol"];
    hostname: RemotePattern["hostname"];
    pathname?: RemotePattern["pathname"];
  }> = [];

  // Whitelist the configured MinIO endpoint so next/image can load app pictures.
  const minioUrl = process.env.NEXT_PUBLIC_IGRP_MINIO_URL;
  if (minioUrl) {
    try {
      const parsed = new URL(minioUrl);
      patterns.push({
        protocol: parsed.protocol.replace(":", "") as RemotePattern["protocol"],
        hostname: parsed.hostname,
        pathname: "/**",
      });
    } catch {
      // Ignore malformed URLs — they will simply not be whitelisted.
    }
  }

  // Add extra domains via env (comma-separated)
  // Ex: NEXT_PUBLIC_ALLOWED_DOMAINS=example.com,cdn.example.com
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
  turbopack: {
    root: turbopackRoot,
  },
  experimental: {
    typedEnv: true,
    browserDebugInfoInTerminal: {
      depthLimit: 5,
      edgeLimit: 1000,
    },
    optimizePackageImports: [
      "@igrp/igrp-framework-react-design-system",
      "@igrp/framework-next-ui",
      "@igrp/framework-next",
      "@tanstack/react-query",
      "@tanstack/react-table",
      "@tanstack/react-virtual",
      "lucide-react",
      "radix-ui",
      "shadcn",
    ],
  },
};

export default nextConfig;
