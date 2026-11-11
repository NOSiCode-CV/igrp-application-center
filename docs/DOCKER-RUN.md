# Running in Docker

The files under `docker/development/` produce a **production** Next.js standalone image (`output: "standalone"`). This is not a hot-reload `next dev` container.

All commands below run from the **template root** (this directory: `templates/demo-v1` in the monorepo, or the root of an app created from the template).

| File | Role |
| --- | --- |
| [`docker/development/Dockerfile`](../docker/development/Dockerfile) | Multi-stage build: Node 26 (slim) + pnpm → `next build` → `node server.js` |
| [`docker/development/docker-compose.yml`](../docker/development/docker-compose.yml) | Builds that Dockerfile and publishes **host `3001` → container `3000`** |
| [`docker/development/.env.development`](../docker/development/.env.development) | Copied to `.env.production` **at image build time** (inlines `NEXT_PUBLIC_*`) |
| [`.dockerignore`](../.dockerignore) | Keeps `node_modules`, `.next`, and local `.env*` out of the build context |

> There is **no** `Dockerfile` at the template root. `docker build -t … .` without `-f` will fail.

## Who this is for

This Docker setup targets a **standalone app** created from the template: published `@igrp/*` versions and a local `pnpm-lock.yaml`.

Building from the **monorepo checkout** of `templates/demo-v1` will not work as-is — `package.json` uses `workspace:*` and this folder has no lockfile. For day-to-day work in the repo, use `pnpm dev:demo` from the monorepo root instead.

## Prerequisites

- Docker Engine with Compose v2 (`docker compose`)
- A `pnpm-lock.yaml` in the app root (run `pnpm install` once locally). The Dockerfile uses `pnpm i --frozen-lockfile`.
- Credentials for the private `@igrp` registry (`https://sonatype.nosi.cv/repository/igrp/`). The image copies this app's `.npmrc` (registry **scope** only). Add auth to a local, uncommitted `.npmrc` before building. Never commit passwords or tokens.

## Quick start (preview, no IdP)

Preview mode skips OIDC and uses mock layout data. With `IGRP_PREVIEW_MODE=true`, layouts use a stub session and do not call `serverSession()`, so `NEXTAUTH_SECRET` is not required. A production build needs `IGRP_ALLOW_AUTH_BYPASS_IN_PRODUCTION=true` alongside `IGRP_PREVIEW_MODE=true` to accept preview mode. The image already bakes both (and `AUTH_PROVIDER=none`) through `docker/development/.env.development`, so no runtime variables are needed.

1. `docker/development/.env.development` already sets an empty base path (the usual local default):

   ```env
   NEXT_PUBLIC_BASE_PATH=
   NEXT_PUBLIC_ALLOWED_DOMAINS=
   ```

2. Compose needs no extra environment for preview, because the image bakes it. Build and run:

   ```bash
   docker compose -f docker/development/docker-compose.yml up --build
   ```

   Runtime `environment` / `-e` values override the baked ones, for example `IGRP_PREVIEW_MODE=false` and `AUTH_PROVIDER=igrp-auth` plus real IdP settings to run with auth (override both: the image also bakes `AUTH_PROVIDER=none`, which keeps bypass on by itself).

3. Open [http://localhost:3001](http://localhost:3001).

Stop with `Ctrl+C`, then `docker compose -f docker/development/docker-compose.yml down`.

## Docker CLI (same image, no Compose)

Context **must** be the template/app root so `COPY . .` and `COPY ./docker/development/…` resolve.

```bash
docker build -f docker/development/Dockerfile -t igrp-template-development .

docker run --rm -it -p 3001:3000 --name igrp-template \
  igrp-template-development
```

Use host port **3001** to match Compose. Map `-p 3000:3000` only if nothing else is bound to 3000 — then every public URL below must use `:3000` instead of `:3001`.

## Environment

Full variable reference: [ENVIRONMENT.md](ENVIRONMENT.md). Two timings matter in Docker:

| When | What | How |
| --- | --- | --- |
| **Build** | `NEXT_PUBLIC_*` (base path, image domains, public app code, …) | Edit `docker/development/.env.development` **before** `docker build` / `compose up --build`. Next inlines these into the client bundle. Changing them later with `-e` has **no** effect until you rebuild. `.env.development` also bakes server defaults (`IGRP_PREVIEW_MODE`, `AUTH_PROVIDER`, `IGRP_ALLOW_AUTH_BYPASS_IN_PRODUCTION`), which a runtime `-e` overrides. |
| **Run** | Secrets and server config (`NEXTAUTH_*`, `IGRP_AUTH_*`, `AUTH_PROVIDER`, AM/M2M, …; `IGRP_PREVIEW_MODE` and `IGRP_ALLOW_AUTH_BYPASS_IN_PRODUCTION` override the baked defaults) | `docker run -e` / `--env-file`, or Compose `environment` / `env_file`. Do not bake secrets into the image. |

`.dockerignore` excludes root `.env*` files so local secrets never enter the image. `!docker/development/.env.development` is allow-listed because the Dockerfile copies that file to `.env.production` during the build.

### With authentication (OIDC)

The container listens on `0.0.0.0:3000`. Browsers hit the **host** port (Compose: **3001**). `NEXTAUTH_URL` is the public NextAuth **API root** (it must include `/api/auth`, and the base path when one is set).

With Compose (`3001:3000`) and no base path:

```env
AUTH_PROVIDER=igrp-auth
NEXTAUTH_URL=http://localhost:3001/api/auth
NEXTAUTH_URL_INTERNAL=http://localhost:3000
NEXTAUTH_SECRET=<openssl rand -base64 32>
IGRP_AUTH_CLIENT_ID=
IGRP_AUTH_CLIENT_SECRET=
IGRP_AUTH_ISSUER=
IGRP_APP_CODE=
NEXT_PUBLIC_IGRP_APP_CODE=
IGRP_ACCESS_MANAGEMENT_API=
IGRP_PREVIEW_MODE=false
```

Register these URIs on the auth server (byte-for-byte). Wrong host or port produces a login loop (`callbackUrl` nested on itself):

| Config | OAuth callback | Post-logout redirect |
| --- | --- | --- |
| Root, Compose port 3001 | `http://localhost:3001/api/auth/callback/igrp-auth` | `http://localhost:3001/login` |
| `NEXT_PUBLIC_BASE_PATH=/apps/template` | `http://localhost:3001/apps/template/api/auth/callback/igrp-auth` | `http://localhost:3001/apps/template/login` |

`NEXTAUTH_URL_INTERNAL` is the in-container origin (port **3000**, no `/api/auth`). Use it for server-to-server redirects inside Docker/K8s; keep `NEXTAUTH_URL` as the browser-facing URL.

Pass a local env file at runtime (never commit it):

```bash
docker run --rm -p 3001:3000 --env-file .env --name igrp-template \
  igrp-template-development
```

Or in Compose:

```yaml
env_file:
  - ../../.env
```

## Image internals

The Dockerfile is five stages on `node:26.13.0-slim` (Debian, glibc):

1. **base** — the Node image as is. Deliberately thin: `runner` inherits from it, so no build tooling reaches the final image.
2. **toolchain** — `base` + `pnpm`. Used by the build stages only.
3. **deps** — `pnpm install --frozen-lockfile --ignore-scripts`
4. **builder** — copies sources, copies `docker/development/.env.development` → `.env.production`, runs `pnpm exec next build --turbopack`
5. **runner** — copies `.next/standalone`, `.next/static`, and `public`; runs as user `nextjs` (`node server.js`)

The image build runs `next build` directly rather than the `build` script, because
`pnpm build` is `biome check --write && next build` — an image build must not rewrite
sources, and a lint finding should not fail the image. Run `pnpm lint` locally or in CI.

The process binds `HOSTNAME=0.0.0.0` and `PORT=3000`. Telemetry is disabled.

### Healthcheck

The image declares a `HEALTHCHECK` that polls `/api/health` (30s interval, 20s start
period, 3 retries), so `docker ps` and Compose report real readiness. If you set
`NEXT_PUBLIC_BASE_PATH`, the route moves with it — override the probe to match:

```bash
docker run -e HEALTHCHECK_PATH=/my-base/api/health ...
```

## Troubleshooting

| Symptom | Likely cause |
| --- | --- |
| `docker build` cannot find a Dockerfile | You ran `docker build .` from the app root. Use `-f docker/development/Dockerfile` or Compose. |
| `NEXTAUTH_SECRET must be set in production` **during `pnpm build` / `next build`** | A prerender-time failure, not a runtime one. Fixed by `export const dynamic = "force-dynamic"` in `src/app/layout.tsx` — the root layout reads the session, so nothing under it may be statically prerendered. The build must never require runtime secrets; if this reappears, something re-enabled prerendering of a session-reading route. |
| `Missing required authentication environment variables for "igrp-auth"` during the build | Same cause and same fix as the row above (`assertAuthProviderEnv` is the guard immediately after the `NEXTAUTH_SECRET` one in `src/lib/auth.ts`). |
| `EPERM: operation not permitted, symlink` at **Collecting build traces** (Windows only) | `output: "standalone"` recreates pnpm's symlinked `node_modules`, and Windows forbids symlinks unless **Developer Mode** is on. Enable *Settings → System → For developers → Developer Mode*, or run the build in Docker/WSL. Does not affect the Docker build (Linux). |
| `ERR_PNPM_NO_LOCKFILE` / frozen lockfile error | No `pnpm-lock.yaml` in the build context. Run `pnpm install` in the app first. |
| `ERR_PNPM_OUTDATED_LOCKFILE` | `pnpm-lock.yaml` is out of sync with `package.json`. The build uses `--frozen-lockfile` on purpose so this fails loudly instead of silently resolving different versions. Run `pnpm install` locally and commit the lockfile. |
| Container stuck `health: starting` / `unhealthy` | The healthcheck probes `/api/health`. With `NEXT_PUBLIC_BASE_PATH` set, pass a matching `HEALTHCHECK_PATH`. |
| 404 from registry.npmjs.org for `@igrp/…` | Docker’s `.npmrc` has no Sonatype auth. Add credentials locally (uncommitted) before building. |
| `workspace:*` cannot be resolved | You are building the monorepo template folder. Use a generated app, or develop with `pnpm dev:demo`. |
| Login loop, nested `callbackUrl` | `NEXTAUTH_URL` missing `/api/auth`, or it uses container port `3000` while the browser uses `3001`. See [ENVIRONMENT.md](ENVIRONMENT.md). |
| `NEXTAUTH_SECRET must be set in production` | Image is `NODE_ENV=production`. Set `NEXTAUTH_SECRET` at runtime, or use `IGRP_PREVIEW_MODE=true` so layouts never call `serverSession()`. |
| `[igrp-auth-bypass]` error in the log, every request returns 500 | `IGRP_PREVIEW_MODE=true` or `AUTH_PROVIDER=none` in a production build without `IGRP_ALLOW_AUTH_BYPASS_IN_PRODUCTION=true`. Set that variable only for demo deploys without login; otherwise turn bypass off. |
| `IgrpConfigError` on first request | Required AM/auth env is missing and preview mode is off. See [ENVIRONMENT.md](ENVIRONMENT.md). |
| Changing `NEXT_PUBLIC_BASE_PATH` does nothing | Public env is baked at **build**. Rebuild after editing `docker/development/.env.development`. |
| Port already allocated | Compose binds **3001**. Change the left-hand side of `'3001:3000'` and update `NEXTAUTH_URL` + IdP URIs to match. |

Logs: `docker compose -f docker/development/docker-compose.yml logs -f`.
