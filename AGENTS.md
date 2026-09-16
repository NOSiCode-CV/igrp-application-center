# AGENTS.md

Working agreement for coding agents in `@igrp/applications-center` — a Next.js 15 / React 19 App Router portal for managing applications, users, roles, permissions, departments, and menus against the IGRP Platform Access Management API.

Read this file first, then follow the pointers below into `docs/` for the area you are touching.

## Gates

Run before claiming work is done. `pnpm` only (Node >= 22); the full script list is in `package.json`.

| Command | Why it matters |
| --- | --- |
| `pnpm check:ui` | **Blocks merges.** Enforces the design-system rules below on `src/**/*.tsx`. |
| `pnpm typecheck` | `typedRoutes` + `typedEnv` are on, so route strings and env reads are type-checked. |
| `pnpm test` | Vitest, single run. |
| `pnpm lint` | `biome check --write` — **mutates files**. Run it before staging, then re-check your diff. |

CI ([.gitlab-ci.yml](.gitlab-ci.yml)) runs `check-ui` as blocking and a `validate` job (`lint`, `typecheck`, `test`) as advisory (`allow_failure: true`) while pre-existing debt is cleared. Advisory is not permission to add debt — leave `validate` no worse than you found it.

## Architecture pointers

Each doc is the single source of truth for its area; this file does not restate them.

| Read | When |
| --- | --- |
| [docs/DEVELOPER_GUIDE.md](docs/DEVELOPER_GUIDE.md) | Orienting in the codebase, or unsure which doc applies. Start here. |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Touching the request lifecycle: middleware, layouts, providers, server actions. |
| [docs/AUTHENTICATION.md](docs/AUTHENTICATION.md) | Touching login, logout, sessions, tokens, middleware redirects, or preview/bypass mode. |
| [docs/PERMISSIONS.md](docs/PERMISSIONS.md) | Gating a page, component, or menu by permission. |
| [docs/ACCESS_MANAGEMENT.md](docs/ACCESS_MANAGEMENT.md) | Touching the `IGRP_SYNC_*` sync of applications, routes, or on-code menus. |
| [docs/DESIGN_SYSTEM.md](docs/DESIGN_SYSTEM.md) | Building or changing any UI — component inventory and copy-pasteable patterns. |
| [docs/TOKENS.md](docs/TOKENS.md) | Choosing colors, spacing, or theming; adding a theme. |
| [docs/ENVIRONMENT.md](docs/ENVIRONMENT.md) | Adding or reading an env var. Values are documented inline in [.env.example](.env.example). |
| [docs/HOME_FLOW.md](docs/HOME_FLOW.md) | Working on `(home)` — the app launcher, task workspace, or `/settings` screens. |
| [docs/MIGRATION_GUIDE.md](docs/MIGRATION_GUIDE.md) | Upgrading the IGRP framework packages. |
| [docs/BUSINESS_GUIDE.en.md](docs/BUSINESS_GUIDE.en.md) | Needing the user-facing meaning of a screen or concept. |

## Where code goes

- `src/app/` — routes only. `(auth)` public login/logout · `(igrp)` authenticated shell, containing `(home)` (dashboard, `/profile`, `/settings/*`) and `(generated)` (reserved for iGRP Studio output — hand-edits get overwritten) · `(invite)` public invite acceptance · `(my-app)` reserved for per-app subroutes mounted outside the middleware-protected tree · `api/{auth,health}`.
- `src/features/<domain>/` — the unit of organization (`applications`, `departments`, `files`, `menus`, `permissions`, `profile`, `roles`, `settings`, `users`, `workspace`). A full domain carries `*-schemas.ts` (Zod v4, the source of truth for both form and API shapes), `use-<domain>.ts` (React Query hooks over server actions), `query-keys.ts` / `query-options.ts` / `prefetch.ts`, and `components/`. Thin domains share another's hooks (`profile` reuses `use-users.ts`) or are component-only; match the neighbours in the domain you are editing rather than forcing the full set.
- `src/actions/` — server actions, one file per resource, plus `src/actions/igrp/` for framework integration. They call `@igrp/platform-access-management-client-ts`, which is configured as a side effect of `serverSession()` — reach auth before the SDK call or it runs unconfigured.
- `src/lib/` — cross-cutting helpers. [dal.ts](src/lib/dal.ts) (`verifySession()`, request-scoped via React `cache`) is how pages assert auth; [auth.ts](src/lib/auth.ts) holds the single `withIGRPAuth` instance; [utilities.ts](src/lib/utilities.ts) holds `isAuthBypass()` and `sanitizeCallbackUrl()`; [utils.ts](src/lib/utils.ts) is only shadcn's `cn`.
- `src/components/` — shared UI. `src/components/ui/` is emitted verbatim by the shadcn CLI; let `shadcn add` own it.
- Aliases: `@/*` → `./src/*`, `@igrp/template-config` → `./src/igrp.template.config.ts`.

Preserve the auth-bypass path when touching anything above: `isAuthBypass()` is true when `IGRP_PREVIEW_MODE=true` or `AUTH_PROVIDER=none`, and the app must still render.

## UI — the IGRP design system

**Load-bearing.** `@igrp/igrp-framework-react-design-system` is a shadcn-based design system, not a separate kit. It ships `primitives/` (vanilla shadcn over Radix), `horizon/` (IGRP-branded wrappers), and `custom/` (composites) — so the `shadcn` skill's Critical Rules govern all UI here.

- Import UI from `@igrp/igrp-framework-react-design-system` (published package; there is no local design-system folder). Take tokens from its `/tokens` entry via `src/styles/globals.css`, never from a prebuilt `*/styles.css`.
- Reach for a **Horizon** component first (`IGRPButton`, `IGRPInputText`, `IGRPForm`, `IGRPFormField`, `IGRPDataTable`, `IGRPCard`, `IGRPModalDialog`, …), then a primitive, and only compose your own when neither exists.
- Use `Skeleton` for loading, `Badge` and semantic tokens for color, `gap-*` for spacing, `size-N` for equal dimensions, `Field`/`FieldGroup` for form layout, `Separator` for dividers.

[scripts/check-ui-rules.mjs](scripts/check-ui-rules.mjs) enforces the strict half of that on merge: `space-x/y-*`, raw color literals, `animate-pulse`, manual `dark:` color overrides, and `<hr>`/`border-t` dividers all fail; `w-N h-N` → `size-N` is reported only. One carve-out — `no-dark-color` skips `src/components/ui/`, whose `dark:` classes are semantic tokens with an alpha delta that the next `shadcn add` would restore anyway. Widen exemptions only for vendored code, via `exemptPathPrefixes` on the rule.

Consult the in-repo skills under [.claude/skills/](.claude/skills) (mirrored in `.agents/skills/`, pinned in [skills-lock.json](skills-lock.json)) before substantial work:

| Skill | Use when |
| --- | --- |
| `shadcn` | Any UI work — its Critical Rules are this repo's UI rules. |
| `frontend-design` | Shaping a new surface or its visual direction. |
| `impeccable` | Auditing or polishing an existing surface. |
| `web-design-guidelines` | Checking accessibility, responsiveness, and interaction defaults. |
| `tanstack-query` | Writing `use-<domain>.ts` hooks, query keys, prefetch, or invalidation. |
| `tanstack-table` | Building `IGRPDataTable` columns or custom table logic. |
| `vercel-react-best-practices` | Tuning React 19 / Next.js rendering and performance. |
| `vercel-composition-patterns` | Refactoring a component API or composition. |
| `grill-me` | Stress-testing a plan before committing to it. |

## Data and errors

- Server → `src/actions/` → `@igrp/platform-access-management-client-ts`. Client → `@tanstack/react-query` via `use-<domain>.ts`.
- Forms → `react-hook-form` + `@hookform/resolvers` over the feature's Zod schema, wired by `IGRPForm`.
- Error routing splits on whether the page can exist without the data: throw to the route `error.tsx` for **page-critical** data (the primary query the page exists to show), and render `InlineError`/`Alert` with retry for **supplementary** data (dashboard favorites, recents) so one non-essential failure leaves the page standing.

## Conventions and gotchas

- Tests live in `src/__tests__/<domain>/`, mirroring the feature tree; a few pure-logic tests sit beside their module (`src/features/*/lib/*.test.ts`). Follow whichever pattern the module you are testing already uses.
- [vitest.config.ts](vitest.config.ts) inlines `@igrp/*` deps (they ship extensionless ESM imports Node's resolver rejects) and aliases `server-only` to a stub in `src/test-stubs/`. A new test importing a server module needs neither change — it is already handled.
- `optimizePackageImports` covers the IGRP, TanStack, `radix-ui`, `lucide-react`, and `shadcn` packages: keep named imports so they stay tree-shakable.
- `output: "standalone"` is what the [Dockerfile](Dockerfile) builds against — change one and change both.
- `next/image` hosts come from `NEXT_PUBLIC_IGRP_MINIO_URL` plus comma-separated `NEXT_PUBLIC_ALLOWED_DOMAINS`; an image from anywhere else fails at runtime, not at build.
- Biome (2-space indent) is the only formatter; `.editorconfig` and `biome.json` carry the settings.
- `src/temp/` holds scratch fixtures, not shipped code. Leave it out of imports.
- Commit messages carry no `Co-Authored-By:` trailer naming an AI model or an Anthropic email. Strip any such line before committing.
- [CLAUDE.md](CLAUDE.md) is a one-line pointer to this file — keep the guidance here.
