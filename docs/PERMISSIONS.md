# Permissions

How the template gates **pages**, **components**, and **menus** by the current user's permissions.

- [The model](#the-model)
- [How it works (request lifecycle)](#how-it-works-request-lifecycle)
- [One-time wiring](#one-time-wiring)
- [Gating a page](#gating-a-page-server--authoritative)
- [Gating a component](#gating-a-component-client)
- [Gating a server action](#gating-a-server-action)
- [Permission names & the active department](#permission-names--the-active-department)
- [Enforcement layering](#enforcement-layering)
- [The catalog vs the claims](#the-catalog-vs-the-claims-three-senses-of-permission)
- [Preview mode](#preview-mode)
- [Per-page guard checklist](#per-page-guard-checklist-there-is-no-default-deny)
- [API reference](#api-reference)
- [Limitations](#limitations)

## The model

Gating reads the **IGRP access-token claims** — **zero network**. The Access-Management (AM) API remains the *real* enforcement on every data call; these gates only shape **what the user sees**.

The access token carries (decoded from its JWT payload):

```jsonc
{
  "org": "DEPT_IGRP",                 // active department
  "selectedRole": "DEPT_IGRP.superadmin",
  "is_super_admin": true,             // bypasses every check
  "resource_access": { "igrp-access-management": { "roles": ["DEPT_IGRP.superadmin"] } },
  "permissions": ["DEPT_IGRP.manage_access"]  // all departments; `${dept}.${suffix}`
}
```

Matching rule (`claimsAllow`): `is_super_admin` → allow all; a `name` containing `.` matches verbatim; a **bare** `name` is qualified with the active `org` → `` `${org}.${name}` ``; a bare name with no `org` → **deny** (fail-closed).

## How it works (request lifecycle)

```
request
  → middleware (auth gate / preview bypass)
  → (igrp)/layout.tsx [server]
        verifySession()      → validates session AND seeds the per-request access token
        igrpGetClaims()      → decode the token → { permissions, roles, selectedRole, org, isSuperAdmin }
                               (preview/AUTH_PROVIDER=none → super-admin mock, no decode)
        <IGRPSectionPermissions state={claims}>   ← provides claims to the whole subtree
  → page  : await igrpAssertAuthorize("…")  → 200 or forbidden() → 403
  → client: usePermissions() / <IGRPAuthorization>  → show / hide
```

Everything reads from that **one** decoded claims object — no extra network calls. `igrpGetClaims()` is deduped per request (React `cache`). On a decode failure it returns a distinguishable **error** state (never a silent "no permissions").

**In a Server Action or Route Handler** there is no layout above you and no `AsyncLocalStorage` store, so `igrpGetClaims()` recovers the access token from the session cookie itself (and seeds the store, so the Access-Management client works in the same call). You do **not** need to call `verifySession()` first just to check a permission.

**Client-side**, claims are re-decoded from the live session rather than frozen at page load — the server-rendered state is the initial value only. A token rotation therefore updates what `usePermissions()` reports without a reload. Three guards apply: no `SessionProvider` mounted → keep the server state; session still `loading` → keep the server state; a non-JWT token (preview mode's `preview-token`) → keep the server state. Only a **JWT-shaped token that fails to decode** produces an error state.

## One-time wiring

A consuming app sets this up **once** (already done in this template):

1. **Enable `forbidden()`** — `next.config.ts`:
   ```ts
   experimental: { authInterrupts: true }
   ```
2. **Seed the provider** in the authenticated layout — [`src/app/(igrp)/layout.tsx`](../src/app/(igrp)/layout.tsx):
   ```tsx
   import { IGRPLayoutFull, igrpGetClaims } from "@igrp/framework-next";
   import { IGRPSectionPermissions } from "@igrp/framework-next-ui";

   await verifySession();                  // seeds the per-request access token
   const claims = await igrpGetClaims();
   return (
     <IGRPSectionPermissions state={claims}>
       <IGRPLayoutFull config={config}>{children}</IGRPLayoutFull>
     </IGRPSectionPermissions>
   );
   ```
   > Keep `verifySession()` **before** `igrpGetClaims()`: it is what enforces authentication, and it seeds the per-request access-management token. (Since `@igrp/framework-next` beta — see the changeset for this change — `igrpGetClaims()` also recovers the token from the session cookie on its own, so the order is no longer the difference between working claims and an error state. It is still the correct order: authenticate first, then read claims.)
3. **403 boundary** — [`src/app/(igrp)/forbidden.tsx`](../src/app/(igrp)/forbidden.tsx):
4. 
   ```tsx
   import { IGRPForbidden } from "@igrp/framework-next-ui";
   export default function Forbidden() { return <IGRPForbidden />; }
   ```

After that, day-to-day you only write the gates below.

## Gating a page (server — authoritative)

```tsx
// app/(igrp)/(demo)/invoices/page.tsx  — server component
import { igrpAssertAuthorize } from "@igrp/framework-next";

export default async function InvoicesPage() {
  await igrpAssertAuthorize("manage_access"); // missing → forbidden() → 403 (forbidden.tsx)
  return <InvoicesScreen />;
}
```

This is the real render gate: it runs before content streams and cannot be bypassed client-side. A genuine missing permission → `forbidden()` (403, in-chrome). A claims **decode error** throws instead (→ `error.tsx`, 5xx) so an outage is never mislabeled as a 403.

> **`igrpAssertAuthorize` is for pages only.** In a Server Action there is no `forbidden.tsx` boundary, so both the deny and the error path surface as an unhandled action error. Use `igrpAuthorize` there — see below.

Worked example: [`exemplo-permissao/page.tsx`](../src/app/(igrp)/(demo)/exemplo-permissao/page.tsx).

## Gating a component (client)

**Wrap (default):**

```tsx
"use client";
import { IGRPAuthorization } from "@igrp/framework-next-ui";
import { IGRPButton } from "@igrp/igrp-framework-react-design-system";

<IGRPAuthorization permission="delete_invoice" fallback={<IGRPButton disabled>Eliminar</IGRPButton>}>
  <IGRPButton variant="destructive">Eliminar</IGRPButton>
</IGRPAuthorization>
```
Denied → renders `fallback` (default: nothing — unmounts). `permission` accepts an array with `mode="all"` (default) or `mode="any"`.

**Hook** — when you need *disable* instead of *hide*, or several checks:

```tsx
"use client";
import { usePermissions } from "@igrp/framework-next-ui";

const { isAllowed } = usePermissions();
<IGRPButton disabled={!isAllowed("read_invoice")}>Ver</IGRPButton>
```

The design system stays auth-agnostic — never add a `permission` prop to a DS component; gate it from the consumer with `<IGRPAuthorization>` or `usePermissions()`. Worked example: [`exemplo-permissao/_components/actions.tsx`](../src/app/(igrp)/(demo)/exemplo-permissao/_components/actions.tsx).

## Gating a server action

The button is cosmetic — protect the actual operation in its server action:
```ts
"use server";
import { igrpAuthorize } from "@igrp/framework-next";

export async function deleteInvoice(id: string) {
  if (!(await igrpAuthorize("delete_invoice"))) return { ok: false, code: "forbidden" };
  // … then the AM API enforces again on the real call
}
```

No extra setup is needed: `igrpAuthorize` resolves the token itself in an action context. Use `igrpAuthorize`, **not** `igrpAssertAuthorize` — an action has no `forbidden.tsx` boundary, so the assert would surface as an unhandled action error instead of a 403.

## Permission names & the active department

Pass the **bare suffix** (`"manage_access"`); it is auto-qualified with the user's active department (`org`) from the token. Pass a fully-qualified `"DEPT_X.manage_access"` for a cross-department check. A bare name with no `org` is denied (fail-closed). `is_super_admin` bypasses all checks.

## Enforcement layering

| Scope | Gate | Strength |
| --- | --- | --- |
| Component | `<IGRPAuthorization>` / `usePermissions` (token, client) | Cosmetic — hide/show UI |
| Menu | Whatever AM returns from `getCurrentUserApplicationMenus` | Server-trusted **navigation only** — see the note below |
| Page | `igrpAssertAuthorize` → `forbidden()` (token, server) | Enforced render gate |
| Action behind a control | `igrpAuthorize` in the server action **+ the AM API** | **Real enforcement** |

Token-claims gating is fast and convenient; the AM API is the source of truth. **A gated button with an un-gated server action behind it is not secure.**

> **The menu row is not a gate.** A menu item's `roles` field is metadata: **nothing** in this template or in `@igrp/framework-next-ui` filters menus on it — the sidebar renders whatever list it is handed. In production that list is already scoped server-side by AM, which is why the row says "server-trusted"; in preview/bypass mode the list is the mock in `src/temp/menus/menus.ts`, so **every** item renders regardless of `roles`. Either way a user can deep-link straight to the route, so menu visibility never substitutes for a page guard.

## The catalog vs the claims (three senses of "permission")

The word means three different things here. Conflating them is the likeliest way to misuse this:

| Sense | What it is | Where |
| --- | --- | --- |
| **Catalog entry** | A permission the app **declares** so AM knows it exists: `{ name, description, enabled }`. No id, no department. | `.igrpstudio/permissions.json` → `IGRPPermissionCatalogEntry` |
| **AM record** | The permission **as AM returns it** — AM's `id`, `status`, `departmentCode`. A read model. | `IGRPPermissionArgs` |
| **Token claim** | The string actually checked at runtime: `` `${org}.${name}` `` in the access token's `permissions[]`. | `claimsAllow` / `igrpAuthorize` |

**Registering a permission does not make it checkable.** The catalog sync is *write-only*: it tells AM the permission exists so a department manager can bind it to a role. Until that binding happens and the user gets a fresh token, every gate on that permission still denies. The chain is:

```
.igrpstudio/permissions.json  →  AM catalog        (IGRP_SYNC_PERMISSIONS=true, at startup)
AM catalog                    →  role             (manual, AM admin UI)
role                          →  user's token     (on next login / token refresh)
token claim                   →  igrpAuthorize()  (what the gates read)
```

**Keep catalog names bare** (`manage_access`, not `DEPT_IGRP.manage_access`). AM qualifies with the department when granting, so the token claim becomes `DEPT_IGRP.manage_access` and a bare-name gate matches. A catalog name **containing a dot** is treated by `claimsAllow` as already fully-qualified and matched verbatim — so with the permission `DEPT.invoice.delete`, `igrpAuthorize("invoice.delete")` **silently denies**. Off-production the framework warns when it sees a dotted catalog name.

Enable the push with `IGRP_SYNC_PERMISSIONS=true` (requires `IGRP_SYNC_ACCESS=true` and `IGRP_PREVIEW_MODE=false`). It is an idempotent upsert keyed on `name`; entries you delete from the JSON are **not** removed in AM — retire those through the AM admin UI. A malformed name is skipped with a warning rather than blocking boot.

## Preview mode

With `IGRP_PREVIEW_MODE=true` (or `AUTH_PROVIDER=none`), claims = **super-admin**, so every gate passes — ideal for building UI without a backend. To see a *denied* state (the disabled fallback) or the **403** page, run with preview **off** against a real backend with a user who lacks the permission.

## Per-page guard checklist (there is NO default-deny)

- [ ] Does this page need a permission? If yes, call `await igrpAssertAuthorize("<perm>")` at the top of the server component.
- [ ] Forgetting it leaves the page **open** — a hidden menu item is navigation UX, **not** enforcement (a user can deep-link).
- [ ] For sensitive mutations, also gate the **server action** (`igrpAuthorize`) — the component gate is cosmetic.
- [ ] Permission name: pass the **bare suffix** (`"manage_access"`); use a `dept.suffix` string only for an explicit cross-department check.

## API reference

| Symbol | Package | Use |
| --- | --- | --- |
| `igrpGetClaims()` | `@igrp/framework-next` | Resolve the request's claims (`IGRPClaimsState`); seed the provider |
| `igrpAuthorize(name)` | `@igrp/framework-next` | Boolean check — **the one to use in server actions** |
| `igrpAssertAuthorize(name)` | `@igrp/framework-next` | Page guard → `forbidden()` on deny. **Pages only** (no `forbidden.tsx` boundary exists in an action) |
| `IGRPSectionPermissions` | `@igrp/framework-next-ui` | Provider; seed with `igrpGetClaims()` result |
| `usePermissions()` | `@igrp/framework-next-ui` | `{ isAllowed, permissions, roles, selectedRole, isSuperAdmin, status, error }` |
| `<IGRPAuthorization>` | `@igrp/framework-next-ui` | Wrap a component to show/hide by permission |
| `<IGRPGuardPage>` | `@igrp/framework-next-ui` | Client-side page guard (convenience; server guard is authoritative) |
| `IGRPForbidden` | `@igrp/framework-next-ui` | 403 UI for `forbidden.tsx` |
| `IGRPAccessClaims`, `IGRPClaimsState` | `@igrp/framework-next-types` | Claim types (re-exported from `@igrp/framework-next-auth/claims`) |

## Limitations

- **Revocation latency.** Gates read token claims, so a server-side permission *revocation* is not reflected until the token refreshes (short TTL) or the user re-logs-in. For an operation that must lock the instant access is pulled, enforce it on the AM API (which is always fresh).
- **No default-deny.** Per-page guards are opt-in (see the checklist). A forgotten `igrpAssertAuthorize` leaves a page open. This is deliberate — the App Router has no seam for a layout to know a child page's required permission — which is why the rule lives in `AGENTS.md` for whoever (or whatever) writes the page.
- **A claims error hides UI silently.** When claims cannot be resolved, `isAllowed()` returns `false` for everything, so gated controls simply vanish with nothing shown to the user. Nothing in this template reads `usePermissions().status` / `.error` — if a screen must distinguish "you lack access" from "we could not determine your access", read those fields and render accordingly.
- **A token with no `org` denies every bare name.** `claimsAllow` qualifies a bare name with the active department and fail-closes without one, which looks identical to a genuine denial. Off-production, `igrpGetClaims()` warns once per request when this happens — check the server log before assuming a permission is missing.
- **Menu `roles` is not enforced.** See the note under [Enforcement layering](#enforcement-layering).
- **Active-role switching** (changing the active department/role mid-session) is not yet wired in this template — the active role is whatever the current token carries. The client provider's `setState` override is the seam for it.
