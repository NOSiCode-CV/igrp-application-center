# Developer Guide

Single entry point for working in the **IGRP Applications Center** codebase. It ties together the how-it-fits-together picture; deep dives live in the linked docs.

- [1. What this app is](#1-what-this-app-is)
- [2. Tech stack](#2-tech-stack)
- [3. Getting started](#3-getting-started)
- [4. Project structure](#4-project-structure)
- [5. Request lifecycle](#5-request-lifecycle)
- [6. Auth & permissions](#6-auth--permissions)
- [7. Feature modules](#7-feature-modules)
- [8. Data layer (server actions + React Query + Zod)](#8-data-layer-server-actions--react-query--zod)
- [9. UI & design system](#9-ui--design-system)
- [10. Design tokens & theming](#10-design-tokens--theming)
- [11. The Workspace (dashboard) feature](#11-the-workspace-dashboard-feature)
- [12. Error handling](#12-error-handling)
- [13. Testing](#13-testing)
- [14. Conventions, linting & CI gates](#14-conventions-linting--ci-gates)
- [15. Where to look next](#15-where-to-look-next)

---

## 1. What this app is

`@igrp/applications-center` is an admin portal for the **IGRP Platform**: it manages applications, users, roles/permissions, departments, and menus against the IGRP Platform Access Management API. It's built on the IGRP Framework template (`@igrp/framework-next*` + `@igrp/igrp-framework-react-design-system`), which supplies auth, layout chrome, and the component library — this repo is the application built on top of that template.

## 2. Tech stack

| Layer | Technology |
| --- | --- |
| Framework | Next.js 15 (App Router, Turbopack), React 19 |
| Language | TypeScript 5, strict, `typedRoutes: true` |
| Auth | NextAuth v4 via `@igrp/framework-next-auth` (`withIGRPAuth`) |
| Authorization | IGRP access-token claims (`@igrp/framework-next` / `@igrp/framework-next-ui`) |
| UI | `@igrp/igrp-framework-react-design-system` (shadcn-based) + Tailwind CSS v4 |
| Forms | `react-hook-form` + `@hookform/resolvers` + Zod v4 |
| Server state | `@tanstack/react-query` v5 over server actions |
| Tables | `@tanstack/react-table` v8 (via `IGRPDataTable`) |
| Drag & drop | `@dnd-kit/*` |
| Lint/format | Biome 2.5 |
| Tests | Vitest 4 + `@testing-library/react` |
| Package manager | pnpm, Node ≥ 22 |

## 3. Getting started

```bash
pnpm install
cp .env.example .env      # fill in required values — see docs/ENVIRONMENT.md
pnpm dev                  # http://localhost:3000
```

Fastest way to work on UI without a running auth/backend: set `IGRP_PREVIEW_MODE=true` (or `AUTH_PROVIDER=none`). This bypasses auth, mocks the session/menus/apps, and grants super-admin permission claims — see [§6](#6-auth--permissions) and [docs/AUTHENTICATION.md](AUTHENTICATION.md#preview-mode--auth-bypass).

Common scripts (full list in the [README](../README.md#scripts)):

```bash
pnpm dev          # dev server
pnpm build        # format + production build
pnpm lint         # biome check --write
pnpm typecheck    # tsc --noEmit
pnpm check:ui     # design-system rule linter (blocking in CI)
pnpm test         # vitest run
```

## 4. Project structure

```
src/
├── app/                      # Next.js App Router — routes only, thin
│   ├── (auth)/               # /login, /logout — public
│   ├── (invite)/             # /invite/accept — public
│   ├── (igrp)/                # authenticated shell (layout, error, forbidden, loading)
│   │   ├── (home)/            # dashboard, /profile, /settings/*
│   │   └── (generated)/       # reserved, empty
│   ├── (my-app)/               # reserved for per-app subroutes
│   └── api/{auth,health}/
├── features/<domain>/        # feature implementation (see §7)
├── actions/                  # server actions, one file per resource (+ actions/igrp/)
├── lib/                      # auth.ts, dal.ts, utils/config/error helpers
├── components/               # cross-feature shared UI (data-table helpers, error boundaries)
├── providers/                # React context providers (e.g. IGRPQueryProvider)
├── schemas/                  # shared Zod schemas
├── config/                   # site config, error messages, login config
├── styles/                   # globals.css + app-center.css (tokens/theme overrides)
├── temp/                     # on-code menu definitions + preview-mode mock data
└── __tests__/, test-stubs/   # cross-cutting tests and Vitest mocks
```

`src/app` stays intentionally thin — routes call into `src/features/<domain>` for the real implementation. This split is enforced by the [`igrp-module-architecture`](../.claude/skills) skill; use it whenever you add a page, module, or server action so the file lands in the right layer.

Path aliases: `@/*` → `./src/*`, `@igrp/template-config` → `./src/igrp.template.config.ts`.

## 5. Request lifecycle

```
request
  → middleware.ts            validates JWT (or lets through on auth bypass); injects x-current-path
  → app/layout.tsx            builds IGRP config, mounts providers/theme — auth NOT enforced here
  → (igrp)/layout.tsx          verifySession() (redirect to /login on failure)
                                → igrpGetClaims() → <IGRPSectionPermissions>
                                → IGRPLayoutFull (header, optional sidebar) renders {children}
  → page.tsx                  await igrpAssertAuthorize("<perm>") if the page needs a permission gate
```

Full breakdown, including the four "layers" (middleware / root layout / IGRP layout / config builder) and the config builder's preview-mode data swap: [docs/ARCHITECTURE.md](ARCHITECTURE.md).

## 6. Auth & permissions

These are two separate concerns — don't conflate them:

- **Authentication** (is there a valid session?) — `src/lib/auth.ts` exports one `auth = withIGRPAuth(...)` instance used by the NextAuth route handler, the middleware, and `serverSession()`/`getSession()`. Provider is chosen via `AUTH_PROVIDER` (`igrp-auth` | `keycloak` | `autentika` | `none`). Full flow, the `callbackUrl` sanitization rule, and preview-mode bypass: [docs/AUTHENTICATION.md](AUTHENTICATION.md).
- **Authorization** (what can this user see/do?) — reads claims baked into the IGRP access token (department `org`, `selectedRole`, `permissions`, `is_super_admin`) with **zero extra network calls**. The Access Management API is still the real enforcement on every data call — token-claims gates only shape what renders. Three gates, by scope:

  | Scope | API | Strength |
  | --- | --- | --- |
  | Page | `await igrpAssertAuthorize("perm")` (server) | Enforced — 403 via `forbidden()` |
  | Component | `<IGRPAuthorization permission="perm">` / `usePermissions()` (client) | Cosmetic — hide/show/disable |
  | Server action | `igrpAuthorize("perm")` inside the action | Enforced (backed by the AM API) |

  **There is no default-deny** — a forgotten `igrpAssertAuthorize` leaves a page open to anyone with a valid session. Full model, claim shape, and the per-page checklist: [docs/PERMISSIONS.md](PERMISSIONS.md).

- **Access Management sync** — when `IGRP_SYNC_ACCESS=true`, the app pushes its own app/resource/menu metadata to the AM API at startup via M2M `client_credentials`. Only relevant if you're changing menus or resource registration: [docs/ACCESS_MANAGEMENT.md](ACCESS_MANAGEMENT.md).
- **All required env vars**, including the two OAuth redirect URIs that must be registered on the IdP client: [docs/ENVIRONMENT.md](ENVIRONMENT.md).

## 7. Feature modules

`src/features/<domain>/` is the unit of organization: `applications`, `departments`, `files`, `menus`, `permissions`, `profile`, `roles`, `settings`, `users`, `workspace`. A typical module contains:

| File | Purpose |
| --- | --- |
| `*-schemas.ts` | Zod schemas — the source of truth for both form validation and API shapes |
| `use-<domain>.ts` | React Query hooks wrapping server actions |
| `components/` | Feature-specific UI |
| `*-utils.ts` / `*-mapper.ts` / `*-constants.ts` | Optional helpers |

Not every module has all of these — `menus`, `permissions`, `profile`, and `settings` are component-only or reuse another domain's hooks (`profile` reuses `use-users.ts`). That's by design, not an inconsistency to fix.

## 8. Data layer (server actions + React Query + Zod)

```
UI component
  → use-<domain>.ts (React Query hook: useQuery / useMutation)
    → src/actions/<resource>.ts ("use server" action)
      → @igrp/platform-access-management-client-ts (SDK)
        → IGRP Platform Access Management API
```

- **Server actions** live in `src/actions/` (one file per resource, plus `src/actions/igrp/` for framework-integration actions like layout config). They call the platform SDK, which is configured as a side effect of `serverSession()` — any action or server component calling the SDK must ensure `serverSession()` (or equivalent auth) ran first.
- **Client state** goes through `@tanstack/react-query` hooks in `use-<domain>.ts`; consult the `tanstack-query` skill when writing these.
- **Forms** use `react-hook-form` + `@hookform/resolvers/zod`, wired via the design system's `IGRPForm` / `IGRPFormField`, validated against the feature's `*-schemas.ts`.
- **Error handling policy**: throw to the route's `error.tsx` only for **page-critical** data (the primary reason the page exists). For **supplementary** data (e.g. dashboard "recently accessed" or favorites), show an inline `InlineError`/`Alert` with retry instead — one non-essential failure should never blank the whole page.

## 9. UI & design system

**This is load-bearing — read before writing any UI.** `@igrp/igrp-framework-react-design-system` is a **shadcn-based** design system, not a bespoke kit. It ships three layers:

| Layer | What it is | Example |
| --- | --- | --- |
| `primitives/` | Vanilla shadcn components (Radix + CVA + tailwind-merge/clsx + cmdk + sonner + vaul + lucide-react) | `Button`, `Card`, `Input` |
| `horizon/` | IGRP-branded wrappers — **prefer these** | `IGRPButton`, `IGRPInputText`, `IGRPForm`, `IGRPFormField`, `IGRPDataTable`, `IGRPCard`, `IGRPModalDialog`, `IGRPSelect`, `IGRPBadge` |
| `custom/` | Domain composites | `IGRPStatusBanner`, `IGRPStatsCardTopBorderColored`, `IGRPUserAvatar` |

Everything imports from the published package `@igrp/igrp-framework-react-design-system` — **there is no local design-system folder to edit**. Because it's shadcn underneath, shadcn conventions apply directly to all UI in this repo, and `pnpm check:ui` enforces the strict subset in CI (blocking merges):

- `Skeleton` — never a hand-rolled `animate-pulse`
- `Badge` / semantic color tokens — never raw Tailwind colors (`bg-emerald-600`) or manual `dark:` overrides
- `gap-*` — never `space-x-*`/`space-y-*`
- `size-N` — never matching `w-N h-N` (advisory, reported not blocked)
- `Field`/`FieldGroup` for form layout
- `Separator` — never a raw `<hr>` or `border-t` divider

Common patterns (form, input-with-icon, button, card, data table, icons) with copy-pasteable snippets: [docs/DESIGN_SYSTEM.md](DESIGN_SYSTEM.md). Before substantial UI work also check the relevant in-repo skill (`frontend-design`, `next-best-practices`, `tanstack-query`, `tanstack-table`, `shadcn`, `web-design-guidelines` under `.claude/skills/`).

## 10. Design tokens & theming

Tokens are CSS variables, shadcn-aligned, imported once from the design system and layered with two local files:

```
@igrp/igrp-framework-react-design-system/tokens   ← base tokens (:root / .dark)
        ↓
src/styles/globals.css                             ← imports tokens + Tailwind + app-center.css
        ↓
src/styles/app-center.css                          ← this app's token overrides + custom utilities
```

Core token groups (all overridable, set both `:root` and `.dark` when you touch one): `--background`/`--foreground`, `--card`, `--popover`, `--primary`, `--secondary`, `--muted`, `--accent`, `--destructive`, `--border`/`--input`/`--ring`, `--radius`, `--chart-1..5`, `--sidebar*`. This app adds three extra semantic groups not in the base tokens: **`--success`**, **`--warning`**, **`--info`** (each with a `-foreground` pair), used for status badges (`.status-active`, `.status-pending`, `.status-deleted` utility classes in `app-center.css`).

Notable local customizations in `app-center.css`:

- **Radius scale** is app-specific: `--radius-sm/md/lg/xl/2xl/3xl/4xl` computed as multiples of `--radius` (not the design system's default calc), giving a slightly larger, more rounded feel across the board.
- **Scrollbars are hidden globally** (`html, body`) — the home launcher is designed to read as fully scroll-free; routes that do need to scroll (settings, profile) still scroll, just without a visible bar. `.custom-scrollbar` opts a specific container back into a styled (thin) scrollbar.
- **`--home-scroll-h` / `--home-scroll-h-lg`** — viewport-fit heights for the home launcher, computed against the IGRP header height + framework padding. If the framework header height changes, these constants need updating (see the comment above them).
- Utility classes: `.glass-effect`, `.card-hover`, `.auto-grid`/`.auto-grid-dense`, `.animate-fade-in`/`.animate-slide-in-up`/`.animate-pulse-subtle` (all respect `prefers-reduced-motion`).

Do **not** import prebuilt `@igrp/*/styles.css` files — only the `/tokens` entry point. Full token reference (every variable, light/dark defaults, Tailwind alias mapping) and a visual theme-editor link: [docs/TOKENS.md](TOKENS.md).

## 11. The Workspace (dashboard) feature

`src/features/workspace/` implements the authenticated landing page (`(igrp)/(home)`) — an app launcher + task workspace, not a generic CRUD module, so it's structured a bit differently from the others:

- `components/enterprise-workspace.tsx` — top-level composition, tab switching between the app launcher and the task workspace.
- `components/home-apps/` — `welcome-banner.tsx`, `app-catalog.tsx`, `app-tile-card.tsx`, `recently-accessed.tsx`: the "launch an app" experience, including a compact card layout for the Recently Accessed row.
- `components/tasks/` — `tasks-tab.tsx`, `task-list.tsx`, `task-row.tsx`, `work-summary-sidebar.tsx`: the task-tracking side of the dashboard.
- `lib/app-utils.ts`, `lib/task-utils.ts` (+ colocated `.test.ts`) — pure helpers, unit-tested directly.
- `data/mock-tasks.ts` — seed data for building/demoing the tasks UI without a backend.

This is the area with the most active visual-design churn (tab active-color parity with the main tab bar in dark mode, banner polish, clickable app cards) — check recent commits touching `src/features/workspace/` before assuming current visual behavior matches an older screenshot or spec.

Full route-by-route breakdown of `(home)` — layout guards, the dashboard's prefetch pattern, what's real data vs. mock, and the `/settings/*` screens nested under it: [docs/HOME_FLOW.md](HOME_FLOW.md).

## 12. Error handling

Errors are typed, not ad hoc:

- `IgrpConfigError` — thrown for misconfiguration (missing/invalid env vars) surfaced through `app/global-error.tsx`, not as an opaque runtime crash. Required env vars are validated when `IGRPRootLayout` renders.
- Route-level `error.tsx` boundaries — reserved for **page-critical** data failures (see [§8](#8-data-layer-server-actions--react-query--zod)).
- `forbidden.tsx` (`IGRPForbidden`) — the 403 boundary for `igrpAssertAuthorize` denials; a claims **decode** error (as opposed to a genuine permission miss) throws to `error.tsx` instead, so an outage is never mislabeled as "forbidden."
- `src/components/errors/` — shared `InlineError`/`Alert`-style components for supplementary-data failures.

## 13. Testing

- Runner: **Vitest 4** + `@testing-library/react` + `jsdom`.
- Convention: tests live **beside** the code they cover (e.g. `lib/app-utils.test.ts` next to `lib/app-utils.ts`); `src/__tests__/` holds cross-cutting tests that don't map cleanly to one feature (actions, middleware, providers).
- `src/test-stubs/` — shared mocks/stubs for Vitest.
- Run with `pnpm test` (single run) or `pnpm test:watch`.

## 14. Conventions, linting & CI gates

- **Formatter/linter**: Biome 2.5, 2-space indent. `pnpm lint` autofixes + organizes imports; it's the gate to run before committing.
- **Imports**: `optimizePackageImports` is set for the IGRP framework packages and React Query — use named imports, no deep default imports into those packages, to keep them tree-shakable.
- **`output: "standalone"`** in `next.config.ts` — the Dockerfile depends on this; don't change it without updating the Dockerfile ([docs/DOCKER-RUN.md](DOCKER-RUN.md)).
- **Commit messages** must not include a `Co-Authored-By:` trailer naming an AI model or an Anthropic email.
- **CI pipeline** (`.gitlab-ci.yml`, `validate` stage, runs before build):
  - `check-ui` (`pnpm check:ui`) — **blocking**.
  - `validate` (`pnpm lint && pnpm typecheck && pnpm test`) — currently **advisory** (`allow_failure: true`) until pre-existing debt clears; will be made blocking after.
- **Framework upgrades** are applied via `@igrp/template-migrator`, not by hand-editing generated files — see [docs/MIGRATION_GUIDE.md](MIGRATION_GUIDE.md) if `pnpm dlx @igrp/template-migrator@latest status` reports pending migrations.

## 15. Where to look next

| Doc | Read it when |
| --- | --- |
| [ARCHITECTURE.md](ARCHITECTURE.md) | You need the exact layer-by-layer request flow |
| [AUTHENTICATION.md](AUTHENTICATION.md) | Touching login, logout, session, or preview-mode bypass |
| [PERMISSIONS.md](PERMISSIONS.md) | Adding a gated page, button, or server action |
| [ACCESS_MANAGEMENT.md](ACCESS_MANAGEMENT.md) | Changing menus, app metadata, or resource sync |
| [ENVIRONMENT.md](ENVIRONMENT.md) | Adding/changing an env var, or debugging a login loop |
| [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md) | Writing UI — component catalogue and copy-paste patterns |
| [TOKENS.md](TOKENS.md) | Theming — full CSS variable reference |
| [MIGRATION_GUIDE.md](MIGRATION_GUIDE.md) | Upgrading the IGRP framework version |
| [DOCKER-RUN.md](DOCKER-RUN.md) | Building/running the production container |
| [../AGENTS.md](../AGENTS.md) | The authoritative "how it works" reference (this guide's source) |
| [../README.md](../README.md) | Quick-start, scripts, env var tables (the "what exists" shallow view) |

Maintenance rule (from `AGENTS.md`): README describes *what exists*, `AGENTS.md` describes *how it works*, this guide is the onboarding map between the two. When you add a feature module, route group, or env var, update `AGENTS.md`/`README.md` per their existing maintenance rules — then skim this guide for anything it says that just went stale.
