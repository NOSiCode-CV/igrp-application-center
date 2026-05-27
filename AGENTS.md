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
- `src/app/(igrp)` — authenticated app shell (layout, error, loading). Contains:
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

- `@igrp/igrp-framework-react-design-system` **is a shadcn-based design system, not a separate UI kit.** It ships three layers under `dist/components/`: `primitives/` = vanilla shadcn components (built on Radix + class-variance-authority + tailwind-merge/clsx + cmdk + sonner + vaul + lucide-react), `horizon/` = IGRP-branded wrappers, `custom/` = composites. Because it is shadcn underneath, the **shadcn skill's Critical Rules apply directly** to all UI in this repo.
- All UI imports from `@igrp/igrp-framework-react-design-system` (published package — there is no local design-system folder).
- Prefer **Horizon** components (`IGRPButton`, `IGRPInputText`, `IGRPForm`, `IGRPFormField`, `IGRPDataTable`, `IGRPCard`, `IGRPModalDialog`, etc.) before primitives.
- Do not introduce other UI kits or hand-roll components when a Horizon component exists.
- Follow shadcn conventions: `Skeleton` (never custom `animate-pulse`), `Badge`/semantic tokens (never raw `bg-emerald-600` or manual `dark:` color overrides), `gap-*` (never `space-x/y-*`), `size-N` (never `w-N h-N`), `Field`/`FieldGroup` for form layout, `Separator` (never `<hr>`).
- Tokens come from `@igrp/igrp-framework-react-design-system/tokens` via `src/styles/globals.css`. Do not import prebuilt `*/styles.css` files.
- Tailwind v4 via `@tailwindcss/postcss`.

Before substantial UI/auth work, consult the in-repo skills (under `.claude/skills/`):

| Skill | Use when |
| --- | --- |
| `frontend-design` | General frontend/UX design guidance |
| `next-best-practices` | Next.js 15 / App Router patterns, RSC vs client boundaries, caching |
| `vercel-react-best-practices` | React 19 / Next.js performance and rendering patterns |
| `vercel-composition-patterns` | Component-API and composition refactors |
| `tanstack-query` | TanStack Query patterns — use when writing `use-<domain>.ts` hooks or server-state data fetching |
| `tanstack-table` | TanStack Table patterns — use when building `IGRPDataTable` columns or custom table logic |
| `shadcn` | **Applies directly** — the IGRP design system is shadcn-based (primitives + Horizon wrappers), so the shadcn Critical Rules govern all UI here |
| `web-design-guidelines` | General web design guidelines and principles |

### Data layer

- Server: server actions in `src/actions/` → `@igrp/platform-access-management-client-ts`.
- Client: `@tanstack/react-query` via `use-<domain>.ts` hooks.
- Forms: `react-hook-form` + `@hookform/resolvers` + Zod schemas from the feature's `*-schemas.ts`. IGRP `IGRPForm` wires these together.
- Error handling: throw to the route `error.tsx` only for **page-critical** data (the primary query a page exists to show); use `InlineError`/`Alert` + retry for **supplementary** data (e.g. dashboard favorites/recent) so one non-essential failure doesn't blank the page.

### Path aliases

- `@/*` → `./src/*`
- `@igrp/template-config` → `./src/igrp.template.config.ts`

## Key environment variables

(See `.env.igrp.example`.)

- `AUTH_PROVIDER` — `igrp-auth` | `keycloak` | `autentika` | `none` (chooses NextAuth provider in `withIGRPAuth`).
- `NEXTAUTH_SECRET` — required in production; `serverSession()` warns in dev and throws in prod if missing.
- `NEXTAUTH_URL_INTERNAL` — internal URL used for redirects (middleware refresh-error redirect).
- `IGRP_ACCESS_MANAGEMENT_API` — base URL for the platform access-management API.
- `NEXT_PUBLIC_BASE_PATH` — Next `basePath`.
- `NEXT_PUBLIC_ALLOWED_DOMAINS` — comma-separated hostnames added to `images.remotePatterns`.

## Conventions

- Formatter/linter: Biome 2.4.15 (2-space indent). `pnpm lint` is the gate.
- Test runner: Vitest ^4.1.6 with `@testing-library/react`. Run with `pnpm test`. Tests live alongside features.
- `optimizePackageImports` is set for the IGRP framework packages and React Query — keep imports tree-shakable (named imports, no deep default imports into those packages).
- `output: "standalone"` — Dockerfile builds rely on this; don't change without updating the Dockerfile.
- CI gate: merge-request pipelines run two jobs in the `validate` stage before build (see [.gitlab-ci.yml](.gitlab-ci.yml)): `check-ui` (`pnpm check:ui`) is **blocking**, and `validate` (`pnpm lint`, `pnpm typecheck`, `pnpm test`) is **advisory** (`allow_failure: true`) until the pre-existing lint/typecheck/test debt is cleared, after which it can be made blocking too.
- `pnpm check:ui` ([scripts/check-ui-rules.mjs](scripts/check-ui-rules.mjs)) enforces shadcn Critical Rules on `src/**/*.tsx` and **blocks merges**. **Strict** (fail): `space-x/y-*`, raw color literals, `animate-pulse`, manual `dark:` color overrides, `<hr>`/`border-t` dividers. **Advisory** (report only): equal `w-N h-N` → `size-N`.

## Maintenance

These rules define when each documentation file must be updated. They exist here so both humans and AI have a single place to check.

**Update `README.md` when:**
- Adding or removing environment variables
- Changing `pnpm` scripts
- Adding new top-level directories under `src/`

**Update `AGENTS.md` when:**
- Auth flow changes (providers, middleware logic, session helpers)
- New feature modules added under `src/features/`
- New route groups added under `src/app/`
- SDK or data-fetching patterns change
- New skills added to `.claude/skills/`
- Biome, Vitest, or other tooling versions change

**Update `docs/DESIGN_SYSTEM.md` when:**
- New Horizon components are available or usage patterns change

**Update `docs/TOKENS.md` when:**
- Token definitions or theme override patterns change

**Update `docs/DOCKER-RUN.md` when:**
- Docker build or run instructions change

**Content boundary rule:** README describes *what exists* (shallow). AGENTS.md describes *how it works* (deep). When adding an env var: README gets a table row (name + one-line description); AGENTS.md gets the behavioral explanation.
