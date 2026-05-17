# AI Reference

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

Package manager: **pnpm** (Node >= 22).

- `pnpm dev` — Next.js dev server with Turbopack.
- `pnpm build` — runs `pnpm format` then `next build --turbopack`.
- `pnpm start` — start production server.
- `pnpm lint` — `biome check --write` (lint + autofix + organize imports).
- `pnpm format` — `biome format --write`.
- `pnpm clean-all` — remove `node_modules` and `.next`.
- `pnpm release` — `pnpm i && pnpm build && pnpm start`.
- `pnpm test` — run tests with Vitest (single run).
- `pnpm test:watch` — run tests in watch mode.

## Architecture

**Next.js 15 + React 19 App Router** application (`@igrp/applications-center`) acting as the IGRP Applications Center — a portal for managing applications, users, roles, permissions, departments, and menus against the IGRP Platform Access Management API.

### Auth (central piece)

All auth flows through `@igrp/framework-next-auth`, wrapping NextAuth v4.

- [src/lib/auth.ts](src/lib/auth.ts) exports a single `auth = withIGRPAuth(...)` instance. The auth provider is resolved from the `AUTH_PROVIDER` env var (`igrp-auth` / `keycloak` / `autentika` / `none`). `serverSession()` both returns the session and configures the IGRP access client (`igrpSetAccessClientConfig`) with the access token + `IGRP_ACCESS_MANAGEMENT_API` base URL — server actions and server components that call the access-management SDK depend on this side effect.
- [src/app/api/auth/[...nextauth]/route.ts](src/app/api/auth) exports `auth.GET/POST` as the NextAuth route handler.
- [src/middleware.ts](src/middleware.ts) calls `auth.isAuthDisabled()` and `auth.isPreviewMode()` directly to short-circuit when auth is off (the middleware uses these primitives; `getSession()` uses the combined `isAuthBypass()` predicate instead). For authenticated paths it calls `auth.getTokenFromRequest(request)` + `auth.isTokenExpiredOrFailed(token)` and redirects to login on failure. Security headers (`X-Content-Type-Options`, `X-Frame-Options`, etc.) are injected in production. The middleware `config` is delegated: `export const { config } = auth`.
- Auth bypass (`isAuthBypass()` in `src/lib/utils.ts`) returns `true` when `IGRP_PREVIEW_MODE=true` OR `AUTH_PROVIDER=none`. `getSession()` returns null in this case — keep this path working when touching auth.

### Route groups

- `src/app/(auth)` — `/login`, `/logout`. Public.
- `src/app/(igrp)` — authenticated app shell (layout, error, not-found, loading). Contains:
  - `(home)` — dashboard, `/profile`, `/settings` (applications, departments, users, users/[id])
  - `(app-center)` — application center features
  - `(generated)` — reserved, empty (`.gitkeep`)
  - `/invite` — invite pending and invite-error pages (authenticated)
- `src/app/(invite)` — `/invite/accept` — public invite acceptance flow (outside the authenticated shell).
- `src/app/(my-app)` — reserved for per-app subroutes (see the matcher's `apps` exclusion — subdomain-style apps are mounted outside the middleware-protected tree).
- `src/app/api/{auth,health}`.

`typedRoutes: true` is enabled in [next.config.ts](next.config.ts) — route strings are type-checked; don't hand-build hrefs that bypass this.

### Feature modules

`src/features/<domain>/` is the unit of organization (applications, departments, files, menus, permissions, profile, roles, users). Each typically contains:

- `*-schemas.ts` — Zod schemas (Zod v4). Schemas are the source of truth for form + API shapes.
- `use-<domain>.ts` — React Query hooks wrapping server actions.
- `components/` — feature UI.
- Optional `*-utils.ts` / `*-mapper.ts` / `*-constants.ts`.

Server actions live in `src/actions/` (one file per resource, plus `src/actions/igrp/` for framework integration actions like layout). Actions call the `@igrp/platform-access-management-client-ts` SDK; the SDK is configured by `serverSession()` so calling `serverSession()` (or otherwise ensuring auth) before SDK calls is required.

### UI — use the IGRP design system

**This is load-bearing.** See [AGENTS.md](AGENTS.md) and [DESIGN_SYSTEM.md](docs/DESIGN_SYSTEM.md) for the full rule. Summary:

- All UI imports from `@igrp/igrp-framework-react-design-system` (published package — there is no local design-system folder).
- Prefer **Horizon** components (`IGRPButton`, `IGRPInputText`, `IGRPForm`, `IGRPFormField`, `IGRPDataTable`, `IGRPCard`, `IGRPModalDialog`, etc.) before primitives.
- Do not introduce other UI kits or hand-roll components when a Horizon component exists.
- Tokens come from `@igrp/igrp-framework-react-design-system/tokens` via `src/styles/globals.css`. Do not import prebuilt `*/styles.css` files.
- Tailwind v4 via `@tailwindcss/postcss`.

Before substantial UI/auth work, consult the in-repo skills (under `.claude/skills/`):

| Skill | Use when |
| --- | --- |
| `frontend-design` | General frontend/UX design guidance |
| `next-best-practices` | Next.js 15 / App Router patterns, RSC vs client boundaries, caching |
| `vercel-react-best-practices` | React 19 / Next.js performance and rendering patterns |
| `vercel-composition-patterns` | Component-API and composition refactors |
| `shadcn` | Reference only — this project uses IGRP Horizon, not raw shadcn primitives |

### Data layer

- Server: server actions in `src/actions/` → `@igrp/platform-access-management-client-ts`.
- Client: `@tanstack/react-query` via `use-<domain>.ts` hooks.
- Forms: `react-hook-form` + `@hookform/resolvers` + Zod schemas from the feature's `*-schemas.ts`. IGRP `IGRPForm` wires these together.

### Path aliases

- `@/*` → `./src/*`
- `@igrp/template-config` → `./src/igrp.template.config.ts`

## Key environment variables

(See `.env.igrp.example`.)

- `AUTH_PROVIDER` — `keycloak` | `autentika` | `none` (chooses NextAuth provider in `withIGRPAuth`).
- `NEXTAUTH_SECRET` — required in production; `serverSession()` warns in dev and throws in prod if missing.
- `NEXTAUTH_URL_INTERNAL` — internal URL used for redirects (middleware refresh-error redirect).
- `IGRP_ACCESS_MANAGEMENT_API` — base URL for the platform access-management API.
- `NEXT_PUBLIC_BASE_PATH` — Next `basePath`.
- `NEXT_PUBLIC_ALLOWED_DOMAINS` — comma-separated hostnames added to `images.remotePatterns`.

## Conventions

- Formatter/linter: Biome 2.4.12 (2-space indent). `pnpm lint` is the gate.
- `optimizePackageImports` is set for the IGRP framework packages and React Query — keep imports tree-shakable (named imports, no deep default imports into those packages).
- `output: "standalone"` — Dockerfile builds rely on this; don't change without updating the Dockerfile.
