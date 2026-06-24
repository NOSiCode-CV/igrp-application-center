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
| `pnpm typecheck` | Type-check without emitting (`tsc --noEmit`) |
| `pnpm check:ui` | Enforce design-system UI rules (blocking CI merge gate) |
| `pnpm clean-all` | Remove `node_modules` and `.next` |
| `pnpm test` | Run tests (Vitest) |
| `pnpm test:watch` | Run tests in watch mode |

---

## Environment

Copy `.env.example` to `.env` and fill in the required variables:

### Authentication

| Variable | Description |
|---|---|
| `AUTH_PROVIDER` | Provider to use: `igrp-auth` \| `none` (custom providers require code changes) |
| `IGRP_AUTH_CLIENT_ID` | OAuth2 client identifier |
| `IGRP_AUTH_CLIENT_SECRET` | OAuth2 client secret |
| `IGRP_AUTH_ISSUER` | Authorization server base URL (OIDC issuer) |
| `IGRP_AUTH_SCOPES` | Space-separated OAuth2 scopes (default: `openid`) |
| `NEXTAUTH_URL` | Public app URL (e.g. `http://localhost:3000`) |
| `NEXTAUTH_SECRET` | JWT/cookie encryption secret (**required in production**) |
| `NEXTAUTH_URL_INTERNAL` | Internal server URL (for SSR / server-to-server) |
| `IGRP_SESSION_MAX_AGE` | Optional session-cookie lifetime in seconds (align to IdP refresh-token lifetime) |

### IGRP Framework

| Variable | Description |
|---|---|
| `IGRP_ACCESS_MANAGEMENT_API` | Platform Access Management API base URL |
| `IGRP_APP_CODE` | App identifier in the IGRP system |
| `IGRP_PREVIEW_MODE` | Skip auth (`true`/`false`) — useful for demos |
| `IGRP_SYNC_ACCESS` | Sync app, resources, and menus with Access Management at startup |
| `IGRP_SYNC_ON_CODE_MENUS` | Push on-code menus (`src/temp/menus/menus.ts`); requires `IGRP_SYNC_ACCESS=true` |
| `IGRP_SYNC_ON_CODE_MENU_ROLES` | Also sync menu↔role assignments during the menu push (default: `true`) |
| `IGRP_SERVICE_ID` | Service identity — resource name + `X-Machine-Service-ID` header |
| `IGRP_M2M_CLIENT_ID` | OAuth2 `client_credentials` client ID for M2M sync |
| `IGRP_M2M_CLIENT_SECRET` | OAuth2 `client_credentials` client secret for M2M sync |

> `IGRP_SERVICE_ID` and the `IGRP_M2M_*` credentials are only required when `IGRP_SYNC_ACCESS=true`.

### Public & App URLs

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_BASE_PATH` | Base path for subdirectory deployments |
| `NEXT_PUBLIC_ALLOWED_DOMAINS` | Comma-separated allowed image domains |
| `NEXT_PUBLIC_IGRP_APP_HOME_SLUG` | Default post-login route |
| `NEXT_IGRP_APP_CENTER_URL` | Application Center URL (used for app switching) |
| `NEXT_PUBLIC_IGRP_PROFILE_URL` | External profile page URL |
| `NEXT_PUBLIC_IGRP_NOTIFICATION_URL` | External notifications URL |
| `NEXT_PUBLIC_IGRP_SETTINGS_URL` | External settings URL |

---

## Docker

```bash
docker build -t igrp-application-center .
docker run --rm -it -p 3000:3000 --env-file .env igrp-application-center
```

See [docs/DOCKER-RUN.md](docs/DOCKER-RUN.md) for full instructions.

---

## Project Structure

```
src/
├── app/                  # Next.js App Router
│   ├── (auth)/           # Public routes: /login, /logout
│   ├── (invite)/         # Public invite flow: /invite/accept, /pending, /invite-error
│   ├── (igrp)/           # Protected app shell (layout, error, loading)
│   │   ├── (home)/       # Dashboard, /profile, /settings (applications, departments, users)
│   │   └── (generated)/  # Reserved for generated routes (empty)
│   ├── (my-app)/         # Reserved for per-app subroutes
│   └── api/
│       ├── auth/         # NextAuth route handler
│       └── health/       # Health check endpoint
├── features/             # Feature modules (applications, departments, files, menus, permissions, profile, roles, settings, users)
├── actions/              # Server actions (one file per resource + igrp/ framework actions)
├── lib/                  # Auth config, utilities, data access layer
├── components/           # Shared UI components
├── providers/            # React context providers
├── schemas/              # Zod validation schemas
├── config/               # Site config, error messages, login config
├── styles/               # Global CSS + design tokens (globals.css)
├── temp/                 # On-code menu definitions + mock data
├── __tests__/            # Cross-cutting tests (most tests live beside features)
└── test-stubs/           # Test stubs/mocks for Vitest
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

## Documentation

| File | Contents |
|---|---|
| [docs/DESIGN_SYSTEM.md](docs/DESIGN_SYSTEM.md) | Horizon component patterns, imports, and usage examples |
| [docs/TOKENS.md](docs/TOKENS.md) | CSS design tokens, dark mode, Tailwind aliases |
| [docs/DOCKER-RUN.md](docs/DOCKER-RUN.md) | Full Docker build and run instructions |

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
