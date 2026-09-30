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

- [src/lib/auth.ts](src/lib/auth.ts) exports a single `auth = withIGRPAuth(...)` instance. The auth provider is resolved from the `AUTH_PROVIDER` env var (`igrp-auth` / `keycloak` / `autentika` / `none`). `serverSession()` both returns the session and configures the IGRP access client (`igrpSetAccessClientConfig`) with the access token + `IGRP_ACCESS_MANAGEMENT_API` base URL — server actions and server components that call the access-management SDK depend on this side effect.
- [src/app/api/auth/[...nextauth]/route.ts](src/app/api/auth) exports `auth.GET/POST` as the NextAuth route handler.
- [src/middleware.ts](src/middleware.ts) calls `auth.isAuthDisabled()` and `auth.isPreviewMode()` directly to short-circuit when auth is off (the middleware uses these primitives; `getSession()` uses the combined `isAuthBypass()` predicate instead). For authenticated paths it calls `auth.getTokenFromRequest(request)` + `auth.isTokenExpiredOrFailed(token)` and redirects to login on failure. Security headers (`X-Content-Type-Options`, `X-Frame-Options`, etc.) are injected in production. The middleware `config` is delegated: `export const { config } = auth`.
- Auth bypass (`isAuthBypass()` in `src/lib/utils.ts`) returns `true` when `IGRP_PREVIEW_MODE=true` OR `AUTH_PROVIDER=none`. `getSession()` returns null in this case — keep this path working when touching auth.
- `withIGRPAuth` callback extensions in `src/lib/auth.ts` carry the user's language: `jwt` seeds `token.locale` from the OIDC `locale` claim at sign-in and applies `update({ locale })`; `session` exposes `session.locale`. `getSessionLocale()` reads it (null-safe, never throws except Next's dynamic bailout).
- The middleware rewrites the `IGRP_LOCALE` cookie to the token's locale when they differ (FR-27, `syncLocaleCookie`), reusing the token it already decoded.

### i18n (`src/i18n/`)

next-intl 4 **without i18n routing** — no `[locale]` segment and no locale in URLs (HAProxy routes `/apps/[slug]`). Full guide: [docs/I18N.md](docs/I18N.md). Spec: `access-management/_specs/i18n/`.

- `config.ts` — `LOCALES` (`pt`, `en`, `fr`), module default `pt`, platform default `pt`, `FORMAT_REGION` (pt-CV / en-GB / fr-FR), cookie `IGRP_LOCALE`, `normalizeLocale()` (`pt-CV` → `pt`, unsupported → `undefined`).
- `resolve-locale.ts` (server-only) — session `locale` → cookie → `Accept-Language` (q-ordered) → platform default.
- `request.ts` — `getRequestConfig`; messages = `pt.json` deep-merged under the requested file (per-key fallback); a key missing in both renders the key and warns.
- `messages/{pt,en,fr}.json` — one file per language, top-level namespace per feature, nested camelCase keys, ICU. `pt.json` is complete and types the keys (`global.d.ts`), so `tsc` fails on unknown keys. `en`/`fr` may be partial.
- `format.ts` — `formatDate`/`formatDateTime`/`formatNumber`/`compare` (+ `useFormat()`); never hardcode a locale/region in feature code.
- `actions.ts` — `setLocale` server action (validate → `PUT /api/users/me/locale` when signed in → cookie). `components/locale-switcher.tsx` then calls next-auth `update({ locale })` and `router.refresh()`. The selector is on `/login`, the `(invite)` layout and `/profile` (the framework header has no extension point yet).
- The root layout wraps children in `I18nProvider` (NextIntlClientProvider + design-system `IGRPI18nProvider`). `global-error.tsx` has no provider: it reads the cookie and uses an inline pt/en/fr table.
- `getClientAccess()` sends `Accept-Language` = resolved locale on every API call; error UIs show the API ProblemDetail `detail` as-is, else `errors.*` messages (`components/errors/use-error-copy.ts`).
- Migrating a feature: move its strings to `pt.json` under the feature namespace, use `useTranslations`/`getTranslations`, make Zod schemas factories taking `t`, use `format.ts`, and add the folder to `MIGRATED_FOLDERS` in `src/__tests__/i18n/literal-strings.test.ts` (hardcoded-string guard).

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
