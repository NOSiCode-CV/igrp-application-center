# Authentication

Auth is centralized in [`src/lib/auth.ts`](../src/lib/auth.ts) via a single `withIGRPAuth(...)` instance. The provider is resolved from `AUTH_PROVIDER`. That instance exposes everything the app needs:

- **Route handler** — `export const { GET, POST } = auth` in `api/auth/[...nextauth]/route.ts`
- **Middleware** — `export const { config } = auth`
- **`serverSession()`** — validates env, configures the IGRP access client, returns the session (or `null`)
- **`getSession()`** — returns `null` on bypass; otherwise redirects to `/logout` on expired/failed refresh

A custom `redirect` callback resolves post-login destinations against the **app origin** (`NEXTAUTH_URL` minus `/api/auth`), honoring same-origin `callbackUrl` values but never bouncing back to `/login` or `/logout`.

For the env vars and auth-server URI registration this depends on, see [ENVIRONMENT.md](ENVIRONMENT.md).

## `callbackUrl` is always sanitized

`sanitizeCallbackUrl()` ([`lib/utils.ts`](../src/lib/utils.ts)) is applied in both middleware and the login page. It rejects scheme-relative (`//…`) and absolute URLs (open-redirect), collapses basePath-prefixed `/login`, and drops `/login*` / `/logout*` targets. Any new code consuming `callbackUrl` must go through it.

## Authentication flow (no bypass)

1. Request hits middleware → no/expired token → redirect to `<basePath>/login`
2. `/login` renders `IGRPAuthForm`; the button calls `signIn('igrp-auth', { callbackUrl })`
3. NextAuth returns the IGRP issuer's `/oauth2/authorize` URL → browser navigates there
4. IdP authenticates → 302 back to `<NEXTAUTH_URL>/callback/igrp-auth?code=…`
5. NextAuth exchanges the code → session cookie set → redirect to `callbackUrl`
6. Next request: middleware sees a valid token → passes through

## Preview Mode & Auth Bypass

Two env paths bypass authentication, both unified behind `isAuthBypass()`:

```env
IGRP_PREVIEW_MODE=true   # or
AUTH_PROVIDER=none
```

When bypass is on:

- Middleware lets every non-auth path through and redirects `/login`, `/logout`, `/api/auth/*` to `/`
- `serverSession()` / `getSession()` return `null`; `verifySession()` returns a stub session
- `createConfig()` swaps in mock data
- Client session refetch is disabled

**Mock data sources:**

- [`src/temp/users/use-mock-user.ts`](../src/temp/users/use-mock-user.ts)
- [`src/temp/menus/use-mock-menus.ts`](../src/temp/menus/use-mock-menus.ts)
- [`src/temp/applications/use-mock-apps.ts`](../src/temp/applications/use-mock-apps.ts)

> Any change to middleware, root layout, or the config builder must work with bypass **on** and **off**.
