# Ticket: M2M read of the organization Brand (`GET /api/m2m/global-configuration`)

**Repository:** igrp-3_0/igrp-auth/backend/igrp-platform-access-management
**Requested by:** Application Center team (organization branding)
**Priority:** normal — not blocking; branding works today with the user's session token

## Problem

Every IGRP framework app with `IGRP_BRANDING_ENABLED=true` loads the organization Brand from
`GET /api/global-configuration?type=ORGANIZATION` at render time. That endpoint needs a user token.
Public pages (login, invite) have no user, so a freshly started app process shows the default colours
and logos there until a signed-in request warms its cache.

The framework would read the Brand with its machine (`client_credentials`) token instead, but
`M2MTokenRejectionFilter` returns 401 for M2M tokens on every path outside `/api/m2m/**` and its
short skip list.

## Request

Add a read-only endpoint in the M2M namespace:

```
GET /api/m2m/global-configuration?type={CLUSTER|ORGANIZATION}
→ 200 GlobalConfigurationDTO { type, config }   (newest row by lastModifiedDate, same as today's GET)
→ 404 IGRP_AUTH_GLOBAL_CONFIGURATION_NOT_FOUND when nothing was saved
→ 400 for an unknown type
→ 401/403 for a token that is not an authorised M2M client
```

- Same service call as `GlobalConfigurationController` GET; only the path and the caller differ.
- Authorise like the other `/api/m2m/**` endpoints in `M2MController` (registered M2M client), so any
  framework app with `IGRP_M2M_CLIENT_ID` / `IGRP_M2M_CLIENT_SECRET` can read it. The config is not
  secret (colours and public logo URLs), so no extra permission is needed beyond being a known client.
- No change to `POST /api/global-configuration` (still user token + `igrp.applications.customize`).

## Why not add the existing GET to the filter's skip list

Spec §14 lists that as an alternative, but it is unsafe: the filter exists because a sid-less M2M token
that reaches user-scoped code crashes in the permission cache (`Integer.parseInt(jwt.getSubject())`,
see the class Javadoc of `M2MTokenRejectionFilter`). A dedicated `/api/m2m/` endpoint keeps M2M tokens
out of the user path.

## Acceptance

- Endpoint above, with tests for 200 / 404 / 400 / 401 (user token rejected or accepted — say which) /
  M2M token accepted.
- `/api/m2m/global-configuration` is covered by the existing `/api/m2m/` skip prefix (no filter change).
- SDK `@igrp/platform-access-management-client-ts` exposes it (e.g. `client.m2m.getGlobalConfiguration(type)`)
  in the next beta.

## Follow-up on the frontend (not part of this ticket)

`resolveBrandingToken(config)` in `@igrp/framework-next` (`packages/framework/next/src/branding/token.ts`)
is the single switch point: it returns the M2M token instead of the session token, and the loader calls the
new endpoint. See the framework ADR `docs/adr/0001-brand-read-with-session-token.md` and the App Center
pointer `docs/adr/0003-brand-read-with-session-token.md`.
