# Digest pins the exact image; bump it together with the tag.
FROM node:26.13.0-slim@sha256:5adad64f9a1fca2d51972caa65983634c8a774eb300d72b20f7f2a0f60368072 AS base

WORKDIR /app

FROM base AS toolchain

RUN npm install -g pnpm@12.15.0

FROM toolchain AS deps

COPY package.json pnpm-lock.yaml pnpm-workspace.yam[l] .npmrc ./
RUN pnpm install --frozen-lockfile --ignore-scripts

FROM toolchain AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
COPY ./env/.env.development .env.production

ENV NEXT_TELEMETRY_DISABLED=1

RUN pnpm exec next build --turbopack

FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

ENV NEXT_TELEMETRY_DISABLED=1

# npm/npx/corepack are unused at runtime and carry their own CVEs (undici, brace-expansion).
RUN rm -rf /usr/local/lib/node_modules/npm /usr/local/lib/node_modules/corepack \
      /usr/local/bin/npm /usr/local/bin/npx /usr/local/bin/corepack \
 && groupadd --system --gid 1001 nodejs && useradd --system --uid 1001 --gid nodejs nextjs

# App files stay root-owned so the process can't rewrite its own code; only the cache is writable.
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
RUN mkdir -p .next/cache && chown nextjs:nodejs .next/cache

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Override when NEXT_PUBLIC_BASE_PATH is set — route handlers live under basePath.
ENV HEALTHCHECK_PATH=/api/health

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+process.env.PORT+process.env.HEALTHCHECK_PATH).then(r=>process.exit(r.ok?0:1),()=>process.exit(1))"

CMD ["node", "server.js"]
