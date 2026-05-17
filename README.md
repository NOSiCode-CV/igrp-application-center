# IGRP Applications Center

Admin portal for managing applications, users, roles, departments, and menus within the IGRP platform.

Built with **Next.js 15** (App Router) + **React 19**, using the IGRP Horizon design system.

---

## Requirements

- Node >= 22.x.x
- pnpm

---

## Quick Start

```bash
# 1. Install dependencies
pnpm install

# 2. Set up environment
cp .env.example .env
# Fill in the required values (see Environment below)

# 3. Start development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Scripts

| Command | Description |
|---|---|
| `pnpm dev` | Start dev server (Turbopack) |
| `pnpm build` | Format + build for production |
| `pnpm start` | Start production server |
| `pnpm release` | Install + build + start (one command) |
| `pnpm lint` | Lint and autofix (Biome) |
| `pnpm format` | Format code (Biome) |
| `pnpm clean-all` | Remove `node_modules` and `.next` |
| `pnpm test` | Run tests (Vitest) |
| `pnpm test:watch` | Run tests in watch mode |

---

## Environment

Copy `.env.example` to `.env` and fill in the required variables:

### Authentication

| Variable | Description |
|---|---|
| `AUTH_PROVIDER` | Provider to use: `igrp-auth` \| `keycloak` \| `autentika` \| `none` |
| `IGRP_AUTH_CLIENT_ID` | OAuth2 client identifier |
| `IGRP_AUTH_CLIENT_SECRET` | OAuth2 client secret |
| `IGRP_AUTH_ISSUER` | Authorization server base URL |
| `IGRP_AUTH_SCOPES` | OAuth2 scopes (default: `openid`) |
| `NEXTAUTH_URL` | Public app URL (e.g. `http://localhost:3000`) |
| `NEXTAUTH_SECRET` | JWT encryption secret (**required in production**) |
| `NEXTAUTH_URL_INTERNAL` | Internal server URL (for SSR) |

### IGRP Framework

| Variable | Description |
|---|---|
| `IGRP_ACCESS_MANAGEMENT_API` | Platform API base URL |
| `IGRP_APP_CODE` | App identifier in the IGRP system |
| `IGRP_PREVIEW_MODE` | Skip auth (`true`/`false`) — useful for demos |
| `IGRP_SYNC_ON_CODE_MENUS` | Sync code-based menus on startup |
| `IGRP_SYNC_ACCESS` | Sync apps/resources with Access Management API |
| `IGRP_M2M_SERVICE_ID` | M2M auth service ID |
| `IGRP_M2M_TOKEN` | M2M auth token |

### Public (Client-side)

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_BASE_PATH` | Base path for subdirectory deployments |
| `NEXT_PUBLIC_ALLOWED_DOMAINS` | Comma-separated image domains |
| `NEXT_PUBLIC_IGRP_MINIO_URL` | MinIO URL for images |
| `NEXT_PUBLIC_IGRP_APP_CENTER_URL` | App center URL |
| `NEXT_PUBLIC_IGRP_APP_HOME_SLUG` | Default post-login route |
| `NEXT_PUBLIC_IGRP_PROFILE_URL` | Profile page URL |
| `NEXT_PUBLIC_IGRP_NOTIFICATION_URL` | Notifications URL |

---

## Docker

```bash
# Build
docker build -t igrp-application-center .

# Run
docker run --rm -it -p 3000:3000 --env-file .env igrp-application-center
```

Or with Docker Compose (runs on port 3001):

```bash
docker-compose up -d
```

See [DOCKER-RUN.md](docs/DOCKER-RUN.md) for detailed Docker instructions.

---

## Project Structure

```
src/
├── app/                  # Next.js App Router
│   ├── (auth)/           # Public routes: /login, /logout
│   ├── (invite)/         # Public invite acceptance: /invite/accept
│   ├── (igrp)/           # Protected app shell
│   │   ├── (home)/       # Dashboard, /profile, /settings, /settings/users
│   │   ├── (app-center)/ # Application center features
│   │   └── invite/       # Invite pending + invite-error pages
│   └── api/
│       ├── auth/         # NextAuth route handler
│       └── health/       # Health check endpoint
├── features/             # Feature modules (applications, departments, files, menus, permissions, profile, roles, users)
├── actions/              # Next.js server actions
├── lib/                  # Auth config, utilities, data access layer
├── components/           # Shared UI components
├── providers/            # React context providers
├── schemas/              # Zod validation schemas
├── config/               # Site config, error messages, login config
└── temp/                 # Mock data (development only)
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router, Turbopack) |
| Language | TypeScript 5 |
| UI | IGRP Horizon Design System + Tailwind CSS 4 |
| Auth | NextAuth 4 via `@igrp/framework-next-auth` |
| Forms | react-hook-form + Zod |
| Data | TanStack Query v5 + server actions |
| Tables | TanStack Table v8 |
| Linting | Biome |

---

## Authentication

The auth instance is defined in [`src/lib/auth.ts`](src/lib/auth.ts) using `withIGRPAuth`. The provider is resolved from `AUTH_PROVIDER` at runtime.

`IGRP_PREVIEW_MODE=true` bypasses authentication entirely — useful for local development without a running auth server.

In production, `NEXTAUTH_SECRET` is required; the app will throw on startup if it is missing.

---

## Health Check

`GET /api/health` — returns `200 OK` when the server is running. Used by Docker health checks.

---

## License

MIT — NOSi E.P.E (Núcleo Operacional Para a Sociedade de Informação)
