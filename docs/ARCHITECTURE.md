# How It's Built

The template wires the framework together in four layers:

1. **Middleware** ([`src/middleware.ts`](../src/middleware.ts)) — runs first. On auth bypass it redirects `/login`, `/logout`, `/api/auth/*` to `/` and lets everything else through. Otherwise it skips public/static paths, extracts the JWT via `auth.getTokenFromRequest()`, and redirects to `<basePath>/login` (with a sanitized `callbackUrl`) when the token is missing/expired/refresh-failed. Injects an `x-current-path` request header and applies security headers in production. The matcher comes from the framework (`export const { config } = auth`).

2. **Root layout** ([`src/app/layout.tsx`](../src/app/layout.tsx)) — builds config via `createConfig(...)` and mounts `IGRPRootLayout` (providers, theme, session). Does **not** enforce auth, so the login page stays reachable.

3. **IGRP layout** ([`src/app/(igrp)/layout.tsx`](../src/app/(igrp)/layout.tsx)) — calls `verifySession()` (from [`lib/dal.ts`](../src/lib/dal.ts)) to gate the authenticated shell, then renders `IGRPLayoutFull` around `children`. The template mounts it with `showSidebar={false}` (header only); flip that prop to enable the sidebar.

4. **Config builder** ([`src/igrp.template.config.ts`](../src/igrp.template.config.ts)) — `createConfig()` wraps `igrpBuildConfig`, assembling header/sidebar data, fonts, API/M2M config, toaster, and session args. In preview mode it swaps in `src/temp/*` mock data.

## Data flow (authenticated)

1. Request → middleware validates JWT
2. Valid → passes through with `x-current-path`
3. `(igrp)/layout.tsx` → `verifySession()` confirms session (else redirect to `/login`)
4. `createConfig()` builds the IGRP config
5. `IGRPLayoutFull` renders the header (and optional sidebar) around the page

For the auth specifics, see [AUTHENTICATION.md](AUTHENTICATION.md). For Access Management sync, see [ACCESS_MANAGEMENT.md](ACCESS_MANAGEMENT.md).
