# Application Center — Client & Service Account Management

**Audience:** frontend engineers implementing the two admin pages under `/settings/` in Application Center; backend reviewers who need to see which endpoints will be consumed and which gaps this spec surfaces.

**Status:** proposed. TS-client alignment landed as `@igrp/platform-access-management-client-ts@0.2.0-beta.12` (see §2). Backend gaps flagged in §7 are not blocking — the pages can ship against the current backend, but the gaps should be filed as follow-ups.

**Scope:** two admin pages — **Client Management** (`/settings/clients`) and **Service Account Management** (`/settings/service-accounts`) — plus the client-library and sidebar wiring they depend on. Non-goals: any change to the OAuth2 authorization flow itself, or a service-account "console" for the account's owner (this spec covers the *admin* view only).

---

## 1. Domain model — one paragraph

An **OAuth2 client** is a registered API consumer in the iGRP authorization server; it has a `clientId`, a hashed `clientSecret`, a set of `grantTypes` (`authorization_code`, `refresh_token`, `client_credentials`, `device_code`), redirect URIs, TTLs, scopes, and an owning application. A **service account** is a 1:1 human-manageable wrapper around an OAuth2 client that carries `client_credentials`: it adds a display `name`/`description`, an owning application, a set of assigned `roleIds`, and a set of **direct** `permissionIds` (permissions granted without going through the role layer). At M2M token issuance, the effective permission set is the **union** of role-inherited and directly-granted permissions.

The two objects are separately managed on purpose — you can create a `client_credentials` OAuth2 client without a service account (e.g. an internal system integration whose caller identity is opaque), but a service account **cannot exist without** its OAuth2 client, and deleting the service account does **not** delete the OAuth2 client.

---

## 2. Client-library alignment — `@igrp/platform-access-management-client-ts@0.2.0-beta.*`

The audit found the client was *behind* the backend by one entire feature area: OAuth-client CRUD was present, but the service-account CRUD did not exist at all. This spec is grounded on the following aligned surface, shipped in `0.2.0-beta.12`.

### 2.1 `OAuthClient` (already present, unchanged)

Consumes `/api/clients` — the OAuth2 authorization server's client registry.

| Method | HTTP call | Consumed by page |
|---|---|---|
| `listOAuthClients()` | `GET /api/clients` | Client Management → list |
| `getOAuthClient(id)` | `GET /api/clients/{id}` | Client Management → detail; Service Account → linked-client panel |
| `createOAuthClient(request)` | `POST /api/clients` | Client Management → create; Service Account → step 1 of the wizard |
| `updateOAuthClient(id, request)` | `PUT /api/clients/{id}` | Client Management → edit |
| `deleteOAuthClient(id)` | `DELETE /api/clients/{id}` | Client Management → delete; secret-rotation flow (§4.6) |

**Type shape (`OAuthClientDTO`):** `id`, `clientId`, `clientSecret?` *(present ONLY on create response)*, `clientName?`, `description?`, `active`, `applicationId?`, `applicationCode?`, `accessTokenTtl`, `refreshTokenTtl`, `authorizationCodeTtl`, `scopes[]`, `redirectUris[]`, `grantTypes[]`, `createdAt?`, `updatedAt?`.

**Request shape (`OAuthClientRequestDTO`):** `clientId`, `clientName`, `description?`, `active?`, `applicationId?`, `accessTokenTtl?`, `refreshTokenTtl?`, `authorizationCodeTtl?`, `scopes[]`, `redirectUris?`, `grantTypes[]`.

### 2.2 `ServiceAccountClient` (NEW in `0.2.0-beta.*`)

Consumes `/api/service-accounts` — the human-facing wrapper over a `client_credentials` OAuth2 client.

| Method | HTTP call | Consumed by page |
|---|---|---|
| `listServiceAccounts()` | `GET /api/service-accounts` | Service Account Management → list |
| `getServiceAccount(id)` | `GET /api/service-accounts/{id}` | Service Account Management → detail |
| `createServiceAccount(request)` | `POST /api/service-accounts` | Service Account Management → wizard step 2 |
| `updateServiceAccount(id, request)` | `PUT /api/service-accounts/{id}` | Service Account Management → edit (name, roles, permissions) |
| `deleteServiceAccount(id)` | `DELETE /api/service-accounts/{id}` | Service Account Management → delete |

**Type shape (`ServiceAccountDTO`):** `id`, `name`, `description?`, `active`, `oauthClientId`, `clientId` *(denormalised — same as `oauthClient.clientId`)*, `applicationId?`, `applicationCode?`, `roleIds?[]`, `roleCodes?[]`, `permissionIds?[]`, `permissionNames?[]`, `createdAt?`, `updatedAt?`.

**Request shape (`ServiceAccountRequestDTO`):** `name`, `description?`, `active?`, `oauthClientId` *(REQUIRED — created separately first)*, `applicationId?`, `roleIds?[]`, `permissionIds?[]`.

> ⚠ **REPLACEMENT semantics on PUT.** Both `roleIds` and `permissionIds` in the update request are treated as the *complete* set — ids omitted from the request are unassigned. To assign one additional role, the client must send the current set plus the new one; the frontend must therefore always load the current state before submitting a partial change.

### 2.3 What did NOT change

- No new methods on `M2MClient`. Service-account **management** is human-facing (this spec); M2M sync endpoints remain the automation surface for target-project boot (`AuthorizationSyncRunner`). Do not conflate them.
- No secret-rotation method on `OAuthClient` — the backend has no such endpoint. Rotation is `delete + recreate` (see §4.6).
- Both classes are also exposed on the `AccessManagementClient` facade (`client.oauthClients`, `client.serviceAccounts`) so `useAccessManagement()`-style hooks can pick them up consistently with the other resources.

---

## 3. Backend endpoints reference (for the frontend hook layer)

All paths are relative to the AS base URL configured in the Application Center (`IGRP_ACCESS_BASE_URL`).

### OAuth clients — `/api/clients`

| Method | Path | Body | Response | Permission (see §7) |
|---|---|---|---|---|
| GET | `/api/clients` | — | `OAuthClientDTO[]` | `igrp.client.list` |
| GET | `/api/clients/{id}` | — | `OAuthClientDTO` | `igrp.client.view` |
| POST | `/api/clients` | `OAuthClientRequestDTO` | `OAuthClientDTO` **with raw `clientSecret`** | `igrp.client.create` |
| PUT | `/api/clients/{id}` | `OAuthClientRequestDTO` | `OAuthClientDTO` (no secret) | `igrp.client.update` |
| DELETE | `/api/clients/{id}` | — | `204 No Content` | `igrp.client.delete` |

### Service accounts — `/api/service-accounts`

| Method | Path | Body | Response | Permission (see §7) |
|---|---|---|---|---|
| GET | `/api/service-accounts` | — | `ServiceAccountDTO[]` | *(unprotected today — §7)* |
| GET | `/api/service-accounts/{id}` | — | `ServiceAccountDTO` | *(unprotected today — §7)* |
| POST | `/api/service-accounts` | `ServiceAccountRequestDTO` | `ServiceAccountDTO` | *(unprotected today — §7)* |
| PUT | `/api/service-accounts/{id}` | `ServiceAccountRequestDTO` | `ServiceAccountDTO` | *(unprotected today — §7)* |
| DELETE | `/api/service-accounts/{id}` | — | `204 No Content` | *(unprotected today — §7)* |


Instead of using the /api route, use the app architecture as been using, the actions/
---

## 4. Page — Client Management

### 4.1 Route

- **URL:** `/settings/clients` (list) → `/settings/clients/[id]` (detail)
- **Route group:** `src/app/(igrp)(home)/settings/clients/` — matches the existing `settings/users` layout scope.
- **Container:** wraps in the existing `settings` group layout (`max-w-7xl`, `PageHeader` slot).

### 4.2 Data-layer scaffolding

One hook file (`src/hooks/use-oauth-clients.ts`) exposing:

```ts
useOAuthClients()                              // → useQuery(['oauth-clients'], listOAuthClients)
useOAuthClient(id: string)                     // → useQuery(['oauth-clients', id], getOAuthClient)
useCreateOAuthClient()                         // → useMutation → invalidates ['oauth-clients']
useUpdateOAuthClient()                         // → useMutation → invalidates ['oauth-clients', id]
useDeleteOAuthClient()                         // → useMutation → invalidates ['oauth-clients']
```

Mutations invalidate their list on success (matching `use-users.ts` convention) and surface errors through `useIGRPToast()`.

### 4.3 List page — `/settings/clients`

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ ← Back                                                                       │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ OAuth2 Clients                                            [ + Register ]│ │
│ │ Registered API consumers on the iGRP authorization server.              │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│ ┌ Filter ─────────────────────────────────────────────────────────────────┐ │
│ │ [Search by name / clientId       ] [ Grant type ▾ ]  [ Application ▾ ]  │ │
│ │                                    [ Active ▾  All  ]                    │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│ ┌ IGRPDataTable ──────────────────────────────────────────────────────────┐ │
│ │ Client name     │ clientId          │ Grants             │ App   │ ⋮  │ │
│ │─────────────────┼───────────────────┼────────────────────┼───────┼────│ │
│ │ • Invoice App   │ my-invoice        │ auth_code, refresh │ INV   │ ⋮  │ │
│ │ • Cadastro SPA  │ cadastro-spa      │ auth_code, refresh │ CAD   │ ⋮  │ │
│ │ • Nightly ETL   │ etl-runner-m2m    │ client_credentials │ INV   │ ⋮  │ │
│ │ • Inactive Test │ test-app          │ client_credentials │ —     │ ⋮  │ │
│ │                                                                          │ │
│ │ [rows per page: 25 ▾]                     1–4 of 4    ‹ prev  next ›   │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Columns**: Name (`clientName`), Client Id (`clientId`, monospace), Grant types (multi-badge), Application (`applicationCode`), Status (green/gray `IGRPBadgePrimitive` on `active`), Actions column (see below).

**Row actions** (via `IGRPDropdownMenu`, `⋮` cell — mirrors `settings/users` pattern):
- **View details** → navigate to `/settings/clients/[id]`
- **Edit** → open edit dialog (§4.5)
- **Copy client Id** → `navigator.clipboard.writeText(row.clientId)` + toast
- ─── separator ───
- **Rotate secret** → opens rotation flow (§4.6). Destructive-styled.
- **Deactivate / Reactivate** → single-field PUT toggling `active`. Confirmation dialog for deactivate.
- **Delete** → `IGRPDialogDelete` (type-to-confirm, using `clientId` as the confirmation string). Destructive-styled.

**Row-level gating** (see §6.4): the "Rotate secret", "Deactivate", and "Delete" items are hidden for users without `igrp.client.update` / `igrp.client.delete`.

**Filters** are server-side query params where the backend supports them, client-side otherwise. Given the list is likely small (dozens, not thousands), client-side faceted filtering via `IGRPDataTable`'s built-in filter chips is sufficient for now.

### 4.4 Create flow — modal wizard (recommended) or single dialog

The create flow has one non-obvious step — the raw `clientSecret` is shown **once, and never again**. The dialog therefore has TWO panes shown sequentially:

**Pane 1 — form (`IGRPDialogPrimitive`, full-screen on md and below):**

```
┌─── Register OAuth2 client ──────────────────────────────── × ───┐
│                                                                   │
│  Basic info                                                       │
│  ─────────                                                        │
│  Client Id *          [ my-invoice                          ]    │
│    Kebab-case, unique. Cannot be changed later.                   │
│  Display name *       [ Invoice App                         ]    │
│  Description          [                                     ]    │
│  Owning application   [ Select application ▾ ]                   │
│                                                                   │
│  Grant types *                                                    │
│  ─────────────                                                    │
│  ☑ authorization_code      ☑ refresh_token                        │
│  ☐ client_credentials      ☐ device_code                          │
│                                                                   │
│  Redirect URIs                    (required for authorization_code)│
│  ─────────────                                                    │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ https://app.example.com/api/auth/callback/igrp-auth  ✕ │    │
│  │ https://staging.example.com/…/callback/igrp-auth    ✕ │    │
│  └─────────────────────────────────────────────────────────┘    │
│  [ + Add URI ]                                                    │
│                                                                   │
│  Scopes                                                           │
│  ──────                                                           │
│  [ openid × ] [ email × ] [ profile × ]  [ + Add scope ]         │
│                                                                   │
│  Advanced ▾                                                       │
│  ────────                                                         │
│  Access-token TTL (s)     [ 180              ]                    │
│  Refresh-token TTL (s)    [ 86400            ]                    │
│  Authorization-code TTL   [ 60               ]                    │
│                                                                   │
│  ☑ Active on creation                                             │
│                                                                   │
│                                          [ Cancel ]  [ Register ]│
└─────────────────────────────────────────────────────────────────┘
```

**Field-level rules:**
- `clientId`: kebab-case validator (`^[a-z0-9]+(-[a-z0-9]+)*$`), required, unique server-side. Errors from the server (409 on duplicate) surface next to the field, not as a toast.
- `redirectUris`: required if `grantTypes` contains `authorization_code`; must be `https://` (allow `http://localhost` for dev). Rendered as a chip-editor.
- `scopes`: chip-editor. Default `openid email profile` when `authorization_code` selected; default empty when `client_credentials`-only.
- TTLs: numeric inputs with sensible defaults, hidden behind an "Advanced" disclosure. Backend has defaults so omission is fine.
- Client-side validation via `react-hook-form` + `zod` (matches `settings/users`).

**Pane 2 — secret disclosure (shown ONLY on successful POST response):**

```
┌─── Client registered — SAVE THIS SECRET NOW ───────────────× ────┐
│                                                                   │
│  ⚠  The client secret below will not be shown again.              │
│      Store it in your secret manager before closing this dialog.  │
│                                                                   │
│  Client Id                                                        │
│  [ my-invoice                                        ] [ Copy ]  │
│                                                                   │
│  Client Secret                                                    │
│  [ Rh2v-JXQe… ●●●●●●●●●●●●●●●●   ] [ 👁 Reveal ]  [ Copy ]      │
│                                                                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ ☐ I have saved the secret in a safe place                 │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                   │
│                                    [ Done — view client details ]│
└─────────────────────────────────────────────────────────────────┘
```

**Rules:**
- The "Done" button is **disabled until the confirmation checkbox is ticked**. This is deliberate friction — the failure mode of a lost secret is worse than the annoyance of one extra click.
- Attempting to close the dialog via `×` or Esc shows a `IGRPAlertDialog` warning: "You will not be able to retrieve this secret again. Close anyway?".
- The revealed secret uses `type="text"`; toggling `👁 Reveal` flips to `type="password"` (default is masked so screen-sharing users don't leak). Copy always writes the raw value regardless of visibility.
- The response payload is discarded from React Query cache immediately after the dialog closes (via `queryClient.setQueryData(['oauth-clients', id], stripSecret)`) so the secret cannot resurface in a re-render.

### 4.5 Detail page — `/settings/clients/[id]`

Tabbed layout using `IGRPTabs`, matching `/settings/users/[id]`.

```
┌─────────────────────────────────────────────────────────────────────┐
│ ← All clients / Invoice App                    [ Edit ] [ ⋮ More ]  │
├─────────────────────────────────────────────────────────────────────┤
│ [ Overview ] [ Grants & scopes ] [ Redirects ] [ Linked account ]   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  (tab content — see below)                                           │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

- **Overview**: read-only display of `clientId`, `clientName`, `description`, `applicationCode`, `active` (with quick toggle if permitted), TTLs, `createdAt`/`updatedAt`.
- **Grants & scopes**: multi-badge list of `grantTypes` and `scopes`. If `client_credentials` is present, show a hint pointing at Service Accounts: *"This client uses `client_credentials`. If you also need role-based access control for M2M calls, [create a service account](/settings/service-accounts/new?oauthClientId=...) linked to it."*
- **Redirects**: read-only list of `redirectUris` with copy buttons.
- **Linked account**: shows the service account linked to this client (via `useServiceAccounts` filtered by `oauthClientId`) — with a link to the SA detail page. If no account is linked, an empty state offers *"Create a service account for this client"* which pre-fills the SA wizard.

### 4.6 Secret rotation — until the backend has a dedicated endpoint

The backend currently has no `POST /api/clients/{id}/rotate-secret` endpoint. Rotation is delete + recreate, which loses the `id` (breaking any downstream references) and requires the operator to redeploy consumers with the new `clientId` as well.

The frontend should:

1. Offer a **"Rotate secret"** action that opens a wizard-style dialog:
   - **Step 1 — warning**: *"Rotation replaces this client entirely. The old `clientId` and secret will stop working immediately. All consumers of this client must be updated with new credentials. Continue?"* + type-`clientId`-to-confirm.
   - **Step 2 — new-client form** pre-filled from the existing client's config (name, description, applicationId, grantTypes, scopes, redirects, TTLs), with `clientId` free-editable so the operator can either keep it (delete-then-create is atomic enough at admin cadence) or change it entirely.
   - **Step 3 — execute** as a delete-then-create pair. If create fails, offer to restore the deleted one (the response body from delete is empty, so the frontend must have kept the DTO in memory to reconstruct it — carry it in the mutation's context).
   - **Step 4 — secret disclosure** identical to §4.4 pane 2.
2. When the backend adds a real rotation endpoint, this dialog becomes a single POST + secret disclosure. The wizard shell is designed to migrate cleanly (steps 1, 2, 3 collapse to a confirmation + immediate rotate call).

Filed as a backend follow-up in §7.

### 4.7 Edit flow

- Full-form modal, same layout as create pane 1 minus the `clientId` field (immutable), minus the secret pane.
- `PUT` semantics on the backend: full DTO replacement. The dialog must load current state via `getOAuthClient` (already in cache from the list) and submit the full object.

### 4.8 Delete flow

- `IGRPDialogDelete` (matches `settings/users` convention): destructive-styled, type-`clientId`-to-confirm.
- Copy warns explicitly if the client has a linked service account: *"Deleting this client will also break its service account. Delete the service account first, or that account will become orphaned."* — the SA endpoint doesn't cascade in the current backend (§7).

---

## 5. Page — Service Account Management

### 5.1 Route

- **URL:** `/settings/service-accounts` (list) → `/settings/service-accounts/[id]` (detail) → `/settings/service-accounts/new` (create wizard, deep-linkable with `?oauthClientId=…`)
- **Route group:** `src/app/(igrp)(home)/settings/service-accounts/`

### 5.2 Data-layer scaffolding

One hook file (`src/hooks/use-service-accounts.ts`):

```ts
useServiceAccounts()                    // → useQuery(['service-accounts'], listServiceAccounts)
useServiceAccount(id: string)           // → useQuery(['service-accounts', id], getServiceAccount)
useCreateServiceAccount()               // → useMutation → invalidates list
useUpdateServiceAccount()               // → useMutation → invalidates list + detail
useDeleteServiceAccount()               // → useMutation → invalidates list

// Cross-resource helpers for the wizard:
useOAuthClientsAvailableForServiceAccount()  // → useOAuthClients() filtered client-side
                                              //   to grantTypes.includes('client_credentials')
                                              //   AND not already linked to a SA (needs
                                              //   listServiceAccounts to compute)
```

### 5.3 List page — `/settings/service-accounts`

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ ← Back                                                                       │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ Service Accounts                                     [ + New account ]  │ │
│ │ Machine identities that authenticate via client_credentials.            │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│ [Search by name / clientId    ] [ Application ▾ ] [ Active ▾ All ]         │
│                                                                              │
│ ┌ IGRPDataTable ──────────────────────────────────────────────────────────┐ │
│ │ Name              │ clientId       │ App   │ Roles │ Grants │  │  ⋮   │ │
│ │───────────────────┼────────────────┼───────┼───────┼────────┼──┼──────│ │
│ │ Nightly Invoice   │ etl-runner-m2m │ INV   │ 2     │ 8+3 dir│ ● │ ⋮   │ │
│ │ Cadastro Sync     │ cad-sync-m2m   │ CAD   │ 1     │ 4      │ ● │ ⋮   │ │
│ │ Legacy Reporter   │ legacy-report  │ —     │ 0     │ 12 dir │ ⊗ │ ⋮   │ │
│ │                                                                          │ │
│ │                                                          ‹ prev  next › │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Columns:**
- **Name** (`name`)
- **Client Id** (`clientId`, monospace) — linked out to the OAuth client's detail page.
- **App** (`applicationCode`)
- **Roles** — count of `roleIds`; on hover, a `Popover` shows the `roleCodes`.
- **Grants** — displayed as `<inherited-perms>` + `<direct-perms> dir` (e.g. `8+3 dir`). "dir" is the count of `permissionIds` (direct grants); the number before `+` is `roleIds.length` mapped to their permission counts (client-side computed if the backend doesn't denormalise it — TBD).
- **Status** — active dot / inactive circle.

**Row actions:**
- View details → `/settings/service-accounts/[id]`
- Edit → detail page's Roles/Permissions tabs
- Copy client Id
- Deactivate / Reactivate
- Delete → `IGRPDialogDelete` (type-name-to-confirm; warns "the linked OAuth2 client is NOT deleted; delete it separately if it is no longer needed").

### 5.4 Create wizard — `/settings/service-accounts/new`

Full-page wizard (**not** a dialog — the flow has enough steps that a modal cramps the layout, and it needs to be deep-linkable so the *Client Management* page can send users into it with a pre-filled `oauthClientId`).

```
┌─────────────────────────────────────────────────────────────────────┐
│ ← Cancel                              Step 1 of 3 · Link OAuth2 client │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  A service account needs a client_credentials OAuth2 client to talk  │
│  to. Pick an existing one, or register a new one.                    │
│                                                                      │
│  ○ Use an existing OAuth2 client                                     │
│    [ Select client ▾ ]                                               │
│      (only client_credentials clients WITHOUT an existing service    │
│       account are shown; others are filtered out)                    │
│                                                                      │
│  ● Register a new OAuth2 client                                      │
│    ┌ inlined OAuthClient create form (§4.4 pane 1) ─────────────┐   │
│    │  … with grantTypes locked to client_credentials …          │   │
│    └───────────────────────────────────────────────────────────┘   │
│                                                                      │
│                                                    [ Back ] [ Next ]│
└─────────────────────────────────────────────────────────────────────┘
```

- Step 1 outputs an `oauthClientId`. If step 1 registered a new client, its secret is shown at the end of step 3 (deferred until the SA is created — otherwise the operator has to keep the tab open across two sensitive-value moments).
- Deep-link: `?oauthClientId=<uuid>` skips step 1 and jumps to step 2 with the client already selected.

**Step 2 — service-account identity:**

```
┌─────────────────────────────────────────────────────────────────────┐
│ ← Cancel                                   Step 2 of 3 · Identity   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Name *                    [ Nightly Invoice ETL              ]     │
│  Description               [                                  ]     │
│  Owning application        [ Select ▾  Invoicing              ]     │
│  ☑ Active on creation                                                │
│                                                                      │
│                                          [ Back ] [ Next: assign… ] │
└─────────────────────────────────────────────────────────────────────┘
```

**Step 3 — roles + direct permissions:**

```
┌─────────────────────────────────────────────────────────────────────┐
│ ← Cancel                             Step 3 of 3 · Roles & permissions │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Roles                                                               │
│  ─────                                                               │
│  ┌ Selected ────────────────────────────────────────────────────┐   │
│  │ INV.invoice.reader ×    INV.invoice.exporter ×                │   │
│  └───────────────────────────────────────────────────────────────┘   │
│  [ + Add role from department ▾ ]                                    │
│    (opens IGRPCommandPrimitive combobox: searchable + department-    │
│     grouped; matches settings/users pattern)                         │
│                                                                      │
│  Direct permissions       ⓘ Grants bypass the role layer.           │
│  ──────────────────                                                  │
│  ┌ Selected ────────────────────────────────────────────────────┐   │
│  │ my.invoice.approve ×    my.invoice.delete ×    my.report.run ×│   │
│  └───────────────────────────────────────────────────────────────┘   │
│  [ + Add permission ▾ ]                                              │
│                                                                      │
│  Effective permissions preview                                       │
│  ──────────────────────────                                          │
│  From roles: 8    Directly granted: 3    Total unique: 11            │
│  [ Preview list ]                                                    │
│                                                                      │
│                                       [ Back ] [ Create account ]   │
└─────────────────────────────────────────────────────────────────────┘
```

- **Direct permissions warning tooltip**: hovering the ⓘ shows *"Direct grants are absolute — they cannot be revoked by removing a role. Use them sparingly; role-based grants are almost always the right choice."*
- **Preview** opens a dialog listing the union of role-inherited + directly-granted permissions with a `<Badge>direct</Badge>` marker on the direct ones. If the backend returns `roleCodes` but not their permission expansions, the preview is server-called via `RoleClient.getRole(id)` for each role — this is the argument for the backend to return an expanded permission set on the service-account response as a follow-up (§7).
- On submit → `createServiceAccount(request)`. If step 1 registered a new OAuth2 client, the SA-create-success screen also shows the OAuth2 client's secret (via §4.4 pane 2), because that's the only moment where it's practical to hand off to the operator.

### 5.5 Detail page — `/settings/service-accounts/[id]`

Tabbed layout, same shell as clients:

```
┌─────────────────────────────────────────────────────────────────────┐
│ ← All service accounts / Nightly Invoice ETL     [ Edit ] [ ⋮ More ]│
├─────────────────────────────────────────────────────────────────────┤
│ [ Overview ] [ Roles ] [ Direct permissions ] [ Linked client ]     │
├─────────────────────────────────────────────────────────────────────┤
```

- **Overview**: name, description, active toggle, linked client (with clientId + link to `/settings/clients/[oauthClientId]`), owning application, created/updated timestamps.
- **Roles**: chip list of `roleCodes` grouped by department. "+ Assign role" opens the same `IGRPCommandPrimitive` picker from §5.4 step 3. Removing a chip triggers an inline confirmation ("Remove `INV.invoice.reader`?") then a `PUT` with the reduced `roleIds` set.
- **Direct permissions**: chip list of `permissionNames`. Same add/remove UX as roles. Every add prompts once: *"Direct grants bypass roles. Are you sure?"* — dismissible per-session.
- **Linked client**: read-only summary of the `oauthClientId` (name, clientId, grantTypes, active), with an "Open client" button routing to the client's detail page.

**⚠ PUT-replacement caveat**: every role/permission add or remove must send the ENTIRE current `roleIds` / `permissionIds` set (§2.2). The hook must always read the fresh detail before submitting, and the UI must optimistic-update carefully (roll back on failure).

### 5.6 Delete flow

Same shape as client delete. Extra copy: *"This does not delete the linked OAuth2 client. If you want to also disable the credentials themselves, delete the OAuth2 client separately."*

---

## 6. Cross-cutting concerns

### 6.1 Sensitive-value display component

Both pages need to render a client secret once and only once. Extract a shared component:

```tsx
<IGRPSensitiveValueDisclosure
  label="Client Secret"
  value={clientSecret}                     // required
  requireConfirmation                     // shows the "I have saved it" checkbox
  onDismiss={() => queryClient.setQueryData(...)}  // called on user-driven close
  defaultMasked                           // hides value initially
  copyable
/>
```

- Lives in `src/components/access-management/sensitive-value-disclosure.tsx` (new).
- Used by: OAuth client create (§4.4 pane 2), rotation (§4.6 step 4), SA-create-if-new-client (§5.4 step 3 success).
- Enforces the "cannot close without ticking confirmation" invariant so it can't be bypassed.

### 6.2 Permission gating in the UI

Application Center currently has no `<Can permission="…">` component; enforcement is server-side. That's acceptable for correctness (a user without `igrp.client.delete` who somehow triggers `deleteOAuthClient` gets a 403 → toast) but **poor UX** — showing buttons that will 403 is confusing.

For this spec, introduce a minimal wrapper (`src/lib/auth/can.tsx`):

```tsx
<Can permission="igrp.client.delete">
  <IGRPDropdownMenuItem …>Delete</IGRPDropdownMenuItem>
</Can>
```

Backed by the session's `permissions[]` claim (already in the JWT). Falls back to `null` (hidden) when the check fails. No async check — the JWT is authoritative and the check is client-side only, defence-in-depth relative to the server-side check.

Suggested per-endpoint permissions to check against:

| Element | Permission |
|---|---|
| "+ Register" button on client list | `igrp.client.create` |
| Row-level "Edit" | `igrp.client.update` |
| Row-level "Rotate", "Deactivate", "Delete" | `igrp.client.delete` |
| Service-account "+ New account" | `igrp.service_account.create` *(see §7 — permission does not exist yet)* |
| SA row edit / role assign / permission grant | `igrp.service_account.update` *(same)* |
| SA delete | `igrp.service_account.delete` *(same)* |

### 6.3 Empty states

- **No OAuth2 clients yet**: illustration + copy + `[ Register your first client ]` primary CTA.
- **No service accounts yet**: illustration + copy explaining the wrapper concept + `[ New service account ]`.
- **No linked client on SA-detail**: shouldn't happen (the FK is NOT NULL), but if it does, show an error state and a support-contact link, never a silent broken UI.

### 6.4 Errors

- All mutation errors surface through `useIGRPToast()` with the `ProblemDetail.detail` field (fall back to `error.message`).
- Field-level errors (409 on duplicate `clientId`) surface next to the offending field via `react-hook-form.setError`.
- 401 / 403 open the standard session-expired flow (existing middleware behaviour).

### 6.5 Loading states

- List pages: `AppCenterLoading` while `useQuery` is fetching; skeleton rows in the table on a background refetch (matches `settings/users`).
- Detail pages: skeleton tabs + skeleton form fields.
- Mutation submit: button `isLoading` state disables the form.

---

## 7. Backend gaps to file as follow-ups

These are **not blocking** — the pages ship functional against the current backend — but they materially improve the UX or security posture:

1. **`igrp.service_account.*` permissions missing.** `/api/service-accounts` endpoints have no `@PreAuthorize`. Anyone with a valid JWT can list, create, mutate, and delete service accounts. Suggested codes: `igrp.service_account.list`, `.view`, `.create`, `.update`, `.delete`. Track as a hardening item alongside the UI gating in §6.2 — until this lands, the `<Can>` wrapper hides UI but the server does not enforce.
2. **No secret-rotation endpoint on OAuth clients.** `POST /api/clients/{id}/rotate-secret` that atomically re-hashes the secret and returns the raw value once, preserving the `id` and `clientId`. Removes the fragile delete-then-recreate dance in §4.6.
3. **No expanded permission set on `ServiceAccountDTO`.** The DTO returns `roleIds`+`roleCodes` and `permissionIds`+`permissionNames`, but not the union of role-inherited permissions. The UI's *Effective permissions preview* has to N+1-fetch each role's permissions. Adding an `effectivePermissionNames: Set<String>` field to the response would remove that.
4. **No cascade on `DELETE /api/service-accounts/{id}`.** The linked OAuth2 client remains. That's a defensible default (someone might want to keep the client without the SA layer), but the API should surface a `?cascade=true` query param so the frontend can offer a "delete both" affordance in one call rather than sequencing.
5. **List filtering / pagination.** `/api/clients` and `/api/service-accounts` return everything unpaged. Fine for now (dozens of records); add query-param filters + pagination when the count grows past ~200.

---