import {
  existsSync,
  mkdirSync,
  readFileSync,
  realpathSync,
  writeFileSync,
} from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

import type { NextConfig } from "next";
import { PHASE_DEVELOPMENT_SERVER } from "next/constants";
import type { RemotePattern } from "next/dist/shared/lib/image-config";

import createNextIntlPlugin from "next-intl/plugin";

// next-intl WITHOUT i18n routing: no [locale] segment and no locale in URLs.
// The locale is resolved per request in src/i18n/request.ts.
const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const appDir = path.dirname(fileURLToPath(import.meta.url));
const monorepoRoot = path.resolve(appDir, "../..");

const turbopackRoot = existsSync(path.join(monorepoRoot, "pnpm-workspace.yaml"))
  ? monorepoRoot
  : appDir;

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

// The design system (ESM) imports `lucide-react/dynamicIconImports` without an
// extension, and lucide-react has no `exports` map, so strict ESM resolution
// can't find the `.mjs` file. Alias it to the design system's own lucide copy
// (its peer; lucide-react isn't a direct dependency here). Drop once the design
// system imports the full path. Resolved from the design system's real location
// so it works from the pnpm store and from the monorepo's workspace link.
const lucideDir = path.dirname(
  createRequire(
    path.join(
      realpathSync(
        path.join(
          appDir,
          "node_modules/@igrp/igrp-framework-react-design-system",
        ),
      ),
      "package.json",
    ),
  ).resolve("lucide-react/package.json"),
);
const toAliasPath = (file: string) =>
  `./${path.relative(appDir, file).replaceAll("\\", "/")}`;

// Dev only: lucide's map has one `import()` per icon (~1,950), which Turbopack
// turns into ~1,950 client + server chunks with sourcemaps — minutes of first
// compile on Windows. Serve every icon from ONE lazy chunk instead, keeping the
// map's shape (key → loader of `{ default, __iconNode }`) that IGRPIcon reads.
// Production keeps the real per-icon map. Regenerated on every `next dev` so
// it always matches the installed lucide version.
const writeDevLucideIconMap = () => {
  const outDir = path.join(appDir, "node_modules/.cache/lucide-dev-icons");
  const source = readFileSync(
    path.join(lucideDir, "dist/esm/dynamicIconImports.js"),
    "utf8",
  );
  const entries = [
    ...source.matchAll(/"([^"]+)": \(\) => import\('\.\/icons\/([^']+)'\)/g),
  ];
  if (entries.length < 1000) {
    throw new Error(
      `lucide dynamicIconImports format changed (${entries.length} icons parsed); update writeDevLucideIconMap in next.config.ts`,
    );
  }
  const files = [...new Set(entries.map(([, , file]) => file))];
  const iconsDir = path
    .relative(outDir, path.join(lucideDir, "dist/esm/icons"))
    .replaceAll("\\", "/");
  mkdirSync(outDir, { recursive: true });
  writeFileSync(
    path.join(outDir, "all-icons.mjs"),
    files
      .map((file, i) => `export * as i${i} from "${iconsDir}/${file}";`)
      .join("\n"),
  );
  writeFileSync(
    path.join(outDir, "dynamicIconImports.mjs"),
    `const all = () => import("./all-icons.mjs");\nexport default {\n${entries
      .map(
        ([, key, file]) =>
          `  ${JSON.stringify(key)}: () => all().then((m) => m.i${files.indexOf(file)}),`,
      )
      .join("\n")}\n};\n`,
  );
  return path.join(outDir, "dynamicIconImports.mjs");
};

const getRemotePatterns = () => {
  const patterns: Array<{
    protocol: RemotePattern["protocol"];
    hostname: RemotePattern["hostname"];
  }> = [];

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

// Home redirect at the routing layer, not in `(igrp)/page.tsx`: a `redirect()`
// thrown from the page only fires after `(igrp)/layout.tsx` has verified the
// session, built the config and started the Access Management menu fetches —
// all thrown away. Config redirects run before middleware and render nothing.
// NEXT_PUBLIC_* is inlined at build time, so this matches what the page sees.
// An invalid slug (no leading "/") gets no redirect here: the page still throws
// the typed `IGRP_APP_HOME_SLUG_INVALID` error, rendered by `(igrp)/error.tsx`.
const homeSlug = process.env.NEXT_PUBLIC_IGRP_APP_HOME_SLUG || "/";

const getRedirects = async () =>
  homeSlug !== "/" && homeSlug.startsWith("/")
    ? [{ source: "/", destination: homeSlug, permanent: false }]
    : [];

const nextConfig = (phase: string): NextConfig => ({
  output: "standalone",
  basePath: basePath,
  redirects: getRedirects,
  images: {
    remotePatterns: getRemotePatterns(),
  },
  typedRoutes: true,
  turbopack: {
    root: turbopackRoot,
    resolveAlias: {
      "lucide-react/dynamicIconImports": toAliasPath(
        phase === PHASE_DEVELOPMENT_SERVER
          ? writeDevLucideIconMap()
          : path.join(lucideDir, "dynamicIconImports.mjs"),
      ),
    },
  },
  experimental: {
    authInterrupts: true,
    typedEnv: true,
    browserDebugInfoInTerminal: {
      depthLimit: 5,
      edgeLimit: 1000,
    },
    optimizePackageImports: [
      "@igrp/igrp-framework-react-design-system",
      "@igrp/framework-next-ui",
      "@igrp/framework-next",
      "@igrp/framework-next/i18n",
      "@igrp/framework-next/i18n/client",
      "@tanstack/react-query",
    ],
  },
});

export default (phase: string) => withNextIntl(nextConfig(phase));
