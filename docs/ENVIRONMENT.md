# Environment Variables

All variables are documented inline in [`.env.example`](../.env.example). Required values are validated when `IGRPRootLayout` renders — misconfiguration surfaces as a typed `IgrpConfigError` in `app/global-error.tsx`, not as an opaque runtime failure.

## Minimum for Access Management

The smallest `.env` that signs in against IGRP Access Management and loads the user, menus and permission claims from it:

```dotenv
AUTH_PROVIDER=igrp-auth
IGRP_PREVIEW_MODE=false

IGRP_AUTH_CLIENT_ID=igrp-access-management
IGRP_AUTH_CLIENT_SECRET=<secret>
IGRP_AUTH_ISSUER=http://auth.example.com
IGRP_AUTH_SCOPES=openid

NEXTAUTH_URL=http://localhost:3000/apps/template/api/auth   # <basePath>/api/auth
NEXTAUTH_SECRET=<openssl rand -base64 32>

IGRP_ACCESS_MANAGEMENT_API=http://am.example.com
IGRP_APP_CODE=DEMO_APP
NEXT_PUBLIC_IGRP_APP_CODE=DEMO_APP

NEXT_PUBLIC_BASE_PATH=/apps/template
```

- The application `IGRP_APP_CODE` must already exist in AM, and the OAuth client must have both redirect URIs registered (see [Auth Server Registration](#auth-server-registration-required)).
- To have the app register itself, its resources and routes in AM at startup, add `IGRP_SYNC_ACCESS=true` plus the three [M2M variables](#access-management-m2m-required-when-igrp_sync_accesstrue) (`IGRP_SERVICE_ID`, `IGRP_M2M_CLIENT_ID`, `IGRP_M2M_CLIENT_SECRET`). The app code must then contain only letters, digits and underscores, start and end alphanumeric, max 64 chars.
- With more than one replica, or several IGRP apps on one domain, also set `IGRP_SESSION_STORE_URL` (see `.env.example`).

## Authentication

| Variable | Description | Default |
| --- | --- | --- |
| `AUTH_PROVIDER` | Active provider. `igrp-auth` (OIDC) or `none` (bypass auth) | `igrp-auth` |
| `IGRP_AUTH_CLIENT_ID` | OAuth client ID registered on the authorization server | — |
| `IGRP_AUTH_CLIENT_SECRET` | OAuth client secret | — |
| `IGRP_AUTH_ISSUER` | Authorization server base URL (no trailing slash); discovery at `/.well-known/openid-configuration` | — |
| `IGRP_AUTH_SCOPES` | Space-separated OAuth scopes. Must be registered on the client *and* advertised by the IdP | `openid` |

> The IGRP discovery doc advertises `openid` only. Requesting unregistered scopes (`profile`, `email`, …) is silently dropped or rejected by Spring Authorization Server — register them on the client first.

## NextAuth

| Variable | Description |
| --- | --- |
| `NEXTAUTH_URL` | Public URL of the **NextAuth API root**. Under a basePath this must include `<basePath>/api/auth` (see callout below) |
| `NEXTAUTH_URL_INTERNAL` | Server-to-server URL; same as `NEXTAUTH_URL` outside Docker/K8s |
| `NEXTAUTH_SECRET` | JWE secret for tokens/cookies. Generate with `openssl rand -base64 32`. **Hard-fails in production if unset** |

> **`NEXTAUTH_URL` includes `/api/auth`.** NextAuth v4 treats this value as the URL of its API root and derives `signin`/`callback` from it — it does **not** auto-append `/api/auth` when a basePath is present. With `NEXT_PUBLIC_BASE_PATH=/apps/template`, the correct value is `http://localhost:3000/apps/template/api/auth`. Getting this wrong produces a login loop with a deeply nested `?callbackUrl=…?callbackUrl=…` chain.

## IGRP Framework

| Variable | Description | Default |
| --- | --- | --- |
| `IGRP_APP_CODE` | Unique application identifier | — |
| `IGRP_ACCESS_MANAGEMENT_API` | Base URL of the IGRP Access Management API | — |
| `IGRP_PREVIEW_MODE` | Bypass auth + use mock data (case-insensitive, quote-tolerant) | `false` |
| `IGRP_ALLOW_AUTH_BYPASS_IN_PRODUCTION` | Allows `IGRP_PREVIEW_MODE=true` or `AUTH_PROVIDER=none` in a production build (`next start`, Docker). Without it the server logs an `[igrp-auth-bypass]` error and answers every request with 500. Only the value `true` opts in. Set it only for demo deploys without login | `false` |
| `IGRP_SYNC_ACCESS` | Sync application/resources/menus to Access Management at startup | `false` |
| `IGRP_BRANDING_ENABLED` | Load the organization Brand (colours and logos) from Access Management at render time | `false` |
| `IGRP_SYNC_ON_CODE_MENUS` | Push `src/temp/menus/menus.ts` to AM (overwrites AM menus). Requires sync on + preview off | `false` |
| `IGRP_SYNC_ON_CODE_MENU_ROLES` | Forward `syncRoles` to `syncApplicationMenus` during the on-code menu push — reconcile menu↔role assignments too. Only consulted when the push runs | `true` |
| `IGRP_SYNC_PERMISSIONS` | Push the `.igrpstudio/permissions.json` catalog to AM at startup (idempotent upsert keyed on `name`; removals are NOT deleted in AM). Requires sync on + preview off | `false` |

## Access Management M2M (required when `IGRP_SYNC_ACCESS=true`)

| Variable | Description |
| --- | --- |
| `IGRP_SERVICE_ID` | Stable service identity — resource name + `X-Machine-Service-ID` header. Lowercase alphanumeric + `-`/`_`, 2-64 chars. **Not a credential.** |
| `IGRP_M2M_CLIENT_ID` | OAuth2 `client_credentials` client ID, issued by your AM admin |
| `IGRP_M2M_CLIENT_SECRET` | Paired client secret. Server-only — never commit |

## Next.js public

| Variable | Description | Default |
| --- | --- | --- |
| `NEXT_PUBLIC_BASE_PATH` | Subdirectory mount path (empty for root) | — |
| `NEXT_PUBLIC_IGRP_APP_CODE` | Client-readable copy of `IGRP_APP_CODE`. The logout / teardown loading screens render it client-side, where the server-only `IGRP_APP_CODE` is unavailable. Set it to the same value | — |
| `NEXT_PUBLIC_IGRP_APP_HOME_SLUG` | Route to land on after login | `/` |
| `NEXT_IGRP_APP_CENTER_URL` | Application Center URL (app switcher) | — |
| `NEXT_PUBLIC_ALLOWED_DOMAINS` | Comma-separated image domains for `next/image` | — |
| `NEXT_PUBLIC_IGRP_PROFILE_URL` | External profile base URL | — |
| `NEXT_PUBLIC_IGRP_NOTIFICATION_URL` | External notification base URL | — |
| `NEXT_PUBLIC_IGRP_SETTINGS_URL` | External settings base URL | — |

## Auth Server Registration (REQUIRED)

Two URIs **must** be registered on the OAuth client (e.g. `igrp-access-management` in IGRP Access Management). Missing either causes a silent failure:

| URI | Why | Symptom if missing |
| --- | --- | --- |
| **OAuth callback** | Where the IdP returns the user after authentication | Login bounces back to `/login` with a growing nested `callbackUrl` chain |
| **Post-logout redirect** | Where the IdP returns the user after the SSO session is cleared | Logout clears local cookies but the IdP SSO session survives — re-login skips the credential prompt |

Exact values depend on `NEXT_PUBLIC_BASE_PATH`:

| Config | OAuth callback URI | Post-logout redirect URI |
| --- | --- | --- |
| root (`NEXT_PUBLIC_BASE_PATH=`) | `http://localhost:3000/api/auth/callback/igrp-auth` | `http://localhost:3000/login` |
| `/apps/template` | `http://localhost:3000/apps/template/api/auth/callback/igrp-auth` | `http://localhost:3000/apps/template/login` |

The OIDC spec requires a byte-for-byte match. The provider enables PKCE (RFC 7636, S256) and an OIDC `nonce`; `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, and the proxy path must stay stable across the `/authorize` → `/callback` round-trip (the PKCE/state/nonce cookies are JWE-encrypted with `NEXTAUTH_SECRET` and scoped to the `NEXTAUTH_URL` path).

For the auth flow itself, see [AUTHENTICATION.md](AUTHENTICATION.md).

## Localisation

| Variable | Description | Default |
| --- | --- | --- |
| `IGRP_FORMAT_LOCALES` | Region-qualified tag per language, comma-separated (`pt-PT` or `pt-AO,en-US`); drives dates, numbers, the design-system locale and `<html lang>`. Languages are fixed (pt, en, fr); a bare language or a tag for another language fails at startup. See `docs/I18N.md`. | `pt-CV,en-GB,fr-FR` |
| `IGRP_TIME_ZONE` | IANA time zone (`Europe/Lisbon`, `Africa/Luanda`) used to format dates and times on the server and in the browser. Keeping both on one zone avoids hydration mismatches. | `Atlantic/Cape_Verde` |
