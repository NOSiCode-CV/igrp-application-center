# Documentation Maintenance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Audit and refresh README.md and AGENTS.md to match the current codebase, then add embedded maintenance rules to prevent future drift.

**Architecture:** Two files are updated independently. AGENTS.md is touched first (it is the AI reference and source of deeper truth); README.md is updated second (it references AGENTS.md and the docs/ folder). No code changes — documentation only.

**Tech Stack:** Markdown only. Verify commands against `package.json` and source files.

---

## Discovered Discrepancies

Before touching files, here is what the audit found:

### AGENTS.md
| Section | Issue |
|---|---|
| Commands | Missing `test` and `test:watch`; `release` has wrong flags; says "no test runner" — vitest is now configured |
| Auth | `isPreviewMode()` is no longer the bypass predicate — `isAuthBypass()` (combines preview + `AUTH_PROVIDER=none`) is used in `getSession()`; middleware no longer catches `RefreshAccessTokenError` — uses `auth.getTokenFromRequest()` + `auth.isTokenExpiredOrFailed()`; middleware `config` is delegated via `export const { config } = auth` |
| Route groups | Missing `(invite)` route group (`/invite/accept`) |
| Skills table | Missing `web-design-guidelines` skill |
| Conventions | Biome version is 2.4.15 (not 2.4.12); test runner IS configured (vitest ^4.1.6) |
| Maintenance | Section does not exist — must be added |

### README.md
| Section | Issue |
|---|---|
| Scripts | Missing `test` and `test:watch`; `release` description doesn't match actual script |
| Project structure | Outdated — missing `(invite)` route group, `/settings/users`, `src/temp/`, `src/config/` |
| Docker | References docker-compose (not in DOCKER-RUN.md); should shorten + link to docs/DOCKER-RUN.md |
| Documentation | Section does not exist — must link to docs/ files |

---

## File Map

| File | Action |
|---|---|
| `AGENTS.md` | Modify — update 5 sections, add Maintenance section |
| `README.md` | Modify — update 3 sections, add Documentation section |

---

## Task 1: Update AGENTS.md — Commands section

**Files:**
- Modify: `AGENTS.md`

- [ ] **Step 1: Replace the Commands section**

Find this block in `AGENTS.md`:

```markdown
## Commands

Package manager: **pnpm** (Node >= 20).

- `pnpm dev` — Next.js dev server with Turbopack.
- `pnpm build` — runs `pnpm format` then `next build --turbopack`.
- `pnpm start` — start production server.
- `pnpm lint` — `biome check --write` (lint + autofix + organize imports).
- `pnpm format` — `biome format --write`.
- `pnpm clean-all` — remove `node_modules` and `.next`.
- `pnpm release` — `pnpm i && pnpm format && pnpm build && pnpm start --tag next`.

There is no test runner configured in this project.
```

Replace with:

```markdown
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
```

- [ ] **Step 2: Commit**

```bash
git add AGENTS.md
git commit -m "docs: update AGENTS.md commands section — add test scripts, fix release"
```

---

## Task 2: Update AGENTS.md — Auth section

**Files:**
- Modify: `AGENTS.md`

- [ ] **Step 1: Replace the Auth bullet about preview mode and session**

Find this paragraph in the `### Auth (central piece)` section:

```markdown
- [src/lib/auth.ts](src/lib/auth.ts) exports a single `auth = withIGRPAuth(...)` instance. The auth provider is resolved from the `AUTH_PROVIDER` env var (`keycloak` / `autentika` / `none`). `serverSession()` both returns the session and configures the IGRP access client (`igrpSetAccessClientConfig`) with the access token + `IGRP_ACCESS_MANAGEMENT_API` base URL — server actions and server components that call the access-management SDK depend on this side effect.
- [src/app/api/auth/[...nextauth]/route.ts](src/app/api/auth) uses `auth.GET/POST`; middleware uses `auth.middleware`.
- [src/middleware.ts](src/middleware.ts) is a thin wrapper that redirects to `/logout` on `RefreshAccessTokenError` and bypasses `/login`, `/logout`, `/api/auth`, `/_next`, `/static`, and paths with a `.` (static files). It runs on the matcher `["/", "/((?!api|apps|health|_next|favicon.ico|.*\\..*).*)"]`.
- Preview mode (`isPreviewMode()` in `src/lib/utils.ts`) short-circuits `getSession()` to return null — keep this path working when touching auth.
```

Replace with:

```markdown
- [src/lib/auth.ts](src/lib/auth.ts) exports a single `auth = withIGRPAuth(...)` instance. The auth provider is resolved from the `AUTH_PROVIDER` env var (`igrp-auth` / `keycloak` / `autentika` / `none`). `serverSession()` both returns the session and configures the IGRP access client (`igrpSetAccessClientConfig`) with the access token + `IGRP_ACCESS_MANAGEMENT_API` base URL — server actions and server components that call the access-management SDK depend on this side effect.
- [src/app/api/auth/[...nextauth]/route.ts](src/app/api/auth) uses `auth.GET/POST`; middleware uses `auth.getTokenFromRequest` + `auth.isTokenExpiredOrFailed`.
- [src/middleware.ts](src/middleware.ts) calls `auth.isAuthDisabled()` and `auth.isPreviewMode()` to short-circuit when auth is off. For authenticated paths it calls `auth.getTokenFromRequest(request)` and redirects to login if the token is missing or expired. Security headers (`X-Content-Type-Options`, `X-Frame-Options`, etc.) are injected in production. The middleware `config` is delegated: `export const { config } = auth`.
- Auth bypass (`isAuthBypass()` in `src/lib/utils.ts`) returns `true` when `IGRP_PREVIEW_MODE=true` OR `AUTH_PROVIDER=none`. `getSession()` returns null in this case — keep this path working when touching auth.
```

- [ ] **Step 2: Commit**

```bash
git add AGENTS.md
git commit -m "docs: update AGENTS.md auth section — fix middleware description and bypass predicate"
```

---

## Task 3: Update AGENTS.md — Route groups section

**Files:**
- Modify: `AGENTS.md`

- [ ] **Step 1: Replace the Route groups section**

Find:

```markdown
### Route groups

- `src/app/(auth)` — `/login`, `/logout`. Public.
- `src/app/(igrp)` — authenticated app shell (layout, error, not-found, loading). Contains `(home)` (dashboard, `/profile`, `/settings`), `(app-center)`, `(generated)`, and `/invite`.
- `src/app/(my-app)` — reserved for per-app subroutes (see the matcher's `apps` exclusion — subdomain-style apps are mounted outside the middleware-protected tree).
- `src/app/api/{auth,health}`.
```

Replace with:

```markdown
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
```

- [ ] **Step 2: Commit**

```bash
git add AGENTS.md
git commit -m "docs: update AGENTS.md route groups — add (invite) group and users/[id]"
```

---

## Task 4: Update AGENTS.md — Skills table and Conventions

**Files:**
- Modify: `AGENTS.md`

- [ ] **Step 1: Add missing skill to the skills table**

Find the skills table row for `shadcn`:

```markdown
| `shadcn` | Reference only — this project uses IGRP Horizon, not raw shadcn primitives |
```

Add the missing row after it:

```markdown
| `shadcn` | Reference only — this project uses IGRP Horizon, not raw shadcn primitives |
| `web-design-guidelines` | General web design guidelines and principles |
```

- [ ] **Step 2: Update the Conventions section**

Find:

```markdown
- Formatter/linter: Biome 2.4.12 (2-space indent). `pnpm lint` is the gate.
```

Replace with:

```markdown
- Formatter/linter: Biome 2.4.15 (2-space indent). `pnpm lint` is the gate.
- Test runner: Vitest ^4.1.6 with `@testing-library/react`. Run with `pnpm test`. Tests live alongside features.
```

- [ ] **Step 3: Commit**

```bash
git add AGENTS.md
git commit -m "docs: update AGENTS.md skills table and conventions — add vitest, fix biome version"
```

---

## Task 5: Add Maintenance section to AGENTS.md

**Files:**
- Modify: `AGENTS.md`

- [ ] **Step 1: Append the Maintenance section at the end of the file**

Add to the very end of `AGENTS.md`:

```markdown
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
```

- [ ] **Step 2: Commit**

```bash
git add AGENTS.md
git commit -m "docs: add Maintenance section to AGENTS.md"
```

---

## Task 6: Update README.md — Scripts table

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Replace the Scripts table**

Find:

```markdown
| Command | Description |
|---|---|
| `pnpm dev` | Start dev server (Turbopack) |
| `pnpm build` | Format + build for production |
| `pnpm start` | Start production server |
| `pnpm release` | Install + build + start (one command) |
| `pnpm lint` | Lint and autofix (Biome) |
| `pnpm format` | Format code (Biome) |
| `pnpm clean-all` | Remove `node_modules` and `.next` |
```

Replace with:

```markdown
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
```

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: update README.md scripts table — add test commands"
```

---

## Task 7: Update README.md — Project structure

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Replace the project structure block**

Find:

````markdown
```
src/
├── app/                  # Next.js App Router
│   ├── (auth)/           # Public routes: /login, /logout
│   ├── (igrp)/           # Protected app shell
│   │   ├── (home)/       # Dashboard, /profile, /settings
│   │   └── (app-center)/ # Application center features
│   └── api/
│       ├── auth/         # NextAuth route handler
│       └── health/       # Health check endpoint
├── features/             # Feature modules (applications, users, roles, …)
├── actions/              # Next.js server actions
├── lib/                  # Auth config, utilities, data access layer
├── components/           # Shared UI components
├── providers/            # React context providers
└── schemas/              # Zod validation schemas
```
````

Replace with:

````markdown
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
````

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: update README.md project structure — add invite routes, users, config, temp"
```

---

## Task 8: Update README.md — Docker section + add Documentation section

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Replace the Docker section**

Find:

```markdown
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
```

Replace with:

```markdown
## Docker

```bash
docker build -t igrp-application-center .
docker run --rm -it -p 3000:3000 --env-file .env igrp-application-center
```

See [docs/DOCKER-RUN.md](docs/DOCKER-RUN.md) for full instructions.
```

- [ ] **Step 2: Add Documentation section**

Find the `## Authentication` section header and insert the new section immediately before it:

```markdown
## Documentation

| File | Contents |
|---|---|
| [docs/DESIGN_SYSTEM.md](docs/DESIGN_SYSTEM.md) | Horizon component patterns, imports, and usage examples |
| [docs/TOKENS.md](docs/TOKENS.md) | CSS design tokens, dark mode, Tailwind aliases |
| [docs/DOCKER-RUN.md](docs/DOCKER-RUN.md) | Full Docker build and run instructions |

---

## Authentication
```

- [ ] **Step 3: Commit**

```bash
git add README.md
git commit -m "docs: update README.md — shorten Docker section, add Documentation links"
```

---

## Self-Review Checklist

- [x] **Spec coverage:** All discrepancies listed in the audit table are addressed by a task. Maintenance section added. README Documentation section added.
- [x] **Placeholder scan:** No TBD, no TODO, no "similar to task N" — all replacement blocks are complete.
- [x] **Type consistency:** No code signatures — documentation only. No type drift risk.
