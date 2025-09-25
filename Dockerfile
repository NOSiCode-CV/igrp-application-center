FROM node:22-alpine AS base

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1

RUN apk add --no-cache libc6-compat libstdc++ dumb-init
WORKDIR /app
RUN corepack enable

FROM base AS deps
WORKDIR /app
COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* .npmrc ./
RUN --mount=type=cache,target=/root/.npm \
    --mount=type=cache,target=/root/.yarn \
    --mount=type=cache,target=/root/.pnpm \
    sh -lc '\
      if [ -f yarn.lock ]; then yarn install --frozen-lockfile; \
      elif [ -f package-lock.json ]; then npm ci; \
      elif [ -f pnpm-lock.yaml ]; then pnpm install --frozen-lockfile; \
      else echo "Lockfile not found." && exit 1; fi \
    '

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN sh -lc '\
  if [ -f yarn.lock ]; then yarn build; \
  elif [ -f package-lock.json ]; then npm run build; \
  elif [ -f pnpm-lock.yaml ]; then pnpm run build; \
  else echo "Lockfile not found." && exit 1; fi \
'

FROM base AS runner
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0
WORKDIR /app
RUN apk add --no-cache libc6-compat libstdc++ dumb-init

RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001 -G nodejs

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

USER nextjs
EXPOSE 3000
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "server.js"]