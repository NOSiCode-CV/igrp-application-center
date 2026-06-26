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
   > `verifySession()` must run **before** `igrpGetClaims()` — it seeds the per-request access-management token that `igrpGetClaims()` reads. Without that order, claims resolve to an error state off-preview.
3. **403 boundary** — [`src/app/(igrp)/forbidden.tsx`](../src/app/(igrp)/forbidden.tsx):
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

const { can } = usePermissions();
<IGRPButton disabled={!can("read_invoice")}>Ver</IGRPButton>
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

## Permission names & the active department

Pass the **bare suffix** (`"manage_access"`); it is auto-qualified with the user's active department (`org`) from the token. Pass a fully-qualified `"DEPT_X.manage_access"` for a cross-department check. A bare name with no `org` is denied (fail-closed). `is_super_admin` bypasses all checks.

## Enforcement layering

| Scope | Gate | Strength |
| --- | --- | --- |
| Component | `<IGRPAuthorization>` / `usePermissions` (token, client) | Cosmetic — hide/show UI |
| Menu | AM server-side scoping of `getCurrentUserApplicationMenus` | Server-trusted navigation |
| Page | `igrpAssertAuthorize` → `forbidden()` (token, server) | Enforced render gate |
| Action behind a control | `igrpAuthorize` in the server action **+ the AM API** | **Real enforcement** |

Token-claims gating is fast and convenient; the AM API is the source of truth. **A gated button with an un-gated server action behind it is not secure.**

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
| `igrpAuthorize(name)` | `@igrp/framework-next` | Boolean check (server actions / logic) |
| `igrpAssertAuthorize(name)` | `@igrp/framework-next` | Page guard → `forbidden()` on deny |
| `IGRPSectionPermissions` | `@igrp/framework-next-ui` | Provider; seed with `igrpGetClaims()` result |
| `usePermissions()` | `@igrp/framework-next-ui` | `{ can, permissions, roles, selectedRole, isSuperAdmin, status, error }` |
| `<IGRPAuthorization>` | `@igrp/framework-next-ui` | Wrap a component to show/hide by permission |
| `<IGRPGuardPage>` | `@igrp/framework-next-ui` | Client-side page guard (convenience; server guard is authoritative) |
| `IGRPForbidden` | `@igrp/framework-next-ui` | 403 UI for `forbidden.tsx` |
| `IGRPAccessClaims`, `IGRPClaimsState` | `@igrp/framework-next-types` | Claim types (re-exported from `@igrp/framework-next-auth/claims`) |

## Limitations

- **Revocation latency.** Gates read cached token claims, so a server-side permission *revocation* is not reflected until the token refreshes (short TTL) or the user re-logs-in. For an operation that must lock the instant access is pulled, enforce it on the AM API (which is always fresh).
- **No default-deny.** Per-page guards are opt-in (see the checklist). A forgotten `igrpAssertAuthorize` leaves a page open.
- **Active-role switching** (changing the active department/role mid-session) is not yet wired in this template — the active role is whatever the token carried at login.
