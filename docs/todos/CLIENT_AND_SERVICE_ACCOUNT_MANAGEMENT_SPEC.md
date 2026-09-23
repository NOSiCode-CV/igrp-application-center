# Application Center — OAuth Client & Service Account Management

**Audience:** frontend engineers implementing the admin area under `/settings/accounts/` in Application Center; backend reviewers who need to see which endpoints will be consumed and which gaps this spec surfaces.

**Status:** agreed (design grilled 2026-09-23). Grounded on `@igrp/platform-access-management-client-ts@0.2.0-beta.16` (installed). Backend gaps in §7 are not blocking — the area ships against the current backend — but they should be filed as follow-ups.

**Scope:** one settings area — **Accounts** (`/settings/accounts`) — with two sections, **OAuth Clients** and **Service Accounts**, plus the server actions, feature modules and settings-card wiring they depend on. Non-goals: any change to the OAuth2 authorization flow itself; a service-account "console" for the account's owner (admin view only); secret rotation (§4.6); UI permission gating (§6.2).

**Vocabulary:** terms in **bold** are defined in [`CONTEXT.md`](../../CONTEXT.md). In particular, "client" alone always means an SDK class — the domain object is an **OAuth Client**; "grant" alone always means a **Grant Type**.

---

## 1. Domain model

An **OAuth Client** is a registered API consumer on the iGRP authorization server: a `clientId`, a hashed **Client Secret** (disclosed once, at registration), a set of **Grant Types** (`authorization_code`, `refresh_token`, `client_credentials`, `device_code`), redirect URIs, TTLs, scopes, and an owning application.

A **Service Account** wraps exactly one `client_credentials` **OAuth Client** and adds a display `name`/`description`, assigned `roleIds`, and **Direct Permissions** (`permissionIds`). Its **Effective Permissions** are the union of **Role-Inherited Permissions** and **Direct Permissions**.

Rules:

- **1:1.** An OAuth Client has zero or one Service Account; a Service Account has exactly one OAuth Client. The UI assumes at most one and shows a warning banner if it ever finds more (backend constraint is a follow-up, §7).
- **No independent owner.** A Service Account belongs to its OAuth Client's application. The UI never lets the two differ; the SA's `applicationId` is always sent as the client's.
- **Grant lock.** An OAuth Client with a Service Account always keeps `client_credentials`.
- **Deletion.** An OAuth Client that still has a Service Account cannot be deleted. Deleting a Service Account does not by itself delete its OAuth Client (the UI offers to, §5.6).
- **Deactivation.** Deactivating a Service Account turns off **both** the Service Account and its OAuth Client — the identity can no longer authenticate at all (§6.1).
- Role and permission scoping (which department a role/permission belongs to) is managed on the departments pages, not here.

---

## 2. Client-library surface — `@igrp/platform-access-management-client-ts@0.2.0-beta.16`

Both resources are exposed on the `AccessManagementClient` facade as `client.oauthClients` and `client.serviceAccounts`. Nothing in `src/` consumes them yet.

### 2.1 `OAuthClient`

| Method | HTTP call |
|---|---|
| `listOAuthClients()` | `GET /api/clients` |
| `getOAuthClient(id)` | `GET /api/clients/{id}` |
| `createOAuthClient(request)` | `POST /api/clients` — response carries the raw `clientSecret` |
| `updateOAuthClient(id, request)` | `PUT /api/clients/{id}` — full replacement, no secret in response |
| `deleteOAuthClient(id)` | `DELETE /api/clients/{id}` — `204` |

**`OAuthClientDTO`:** `id`, `clientId`, `clientSecret?` *(create response only)*, `clientName?`, `description?`, `active`, `applicationId?`, `applicationCode?`, `accessTokenTtl`, `refreshTokenTtl`, `authorizationCodeTtl`, `scopes[]`, `redirectUris[]`, `grantTypes[]`, `createdAt?`, `updatedAt?`.

**`OAuthClientRequestDTO`:** `clientId`, `clientName`, `description?`, `active?`, `applicationId?`, `accessTokenTtl?`, `refreshTokenTtl?`, `authorizationCodeTtl?`, `scopes[]`, `redirectUris?`, `grantTypes[]`.

### 2.2 `ServiceAccountClient`

| Method | HTTP call |
|---|---|
| `listServiceAccounts()` | `GET /api/service-accounts` |
| `getServiceAccount(id)` | `GET /api/service-accounts/{id}` |
| `createServiceAccount(request)` | `POST /api/service-accounts` |
| `updateServiceAccount(id, request)` | `PUT /api/service-accounts/{id}` |
| `deleteServiceAccount(id)` | `DELETE /api/service-accounts/{id}` — `204` |

**`ServiceAccountDTO`:** `id`, `name`, `description?`, `active`, `oauthClientId`, `clientId` *(denormalised)*, `applicationId?`, `applicationCode?`, `roleIds?[]`, `roleCodes?[]`, `permissionIds?[]`, `permissionNames?[]`, `createdAt?`, `updatedAt?`.

**`ServiceAccountRequestDTO`:** `name`, `description?`, `active?`, `oauthClientId` *(required)*, `applicationId?`, `roleIds?[]`, `permissionIds?[]`.

> ⚠ **Replacement semantics on PUT** for both resources. For Service Accounts, `roleIds` and `permissionIds` are the *complete* set — omitted ids are unassigned. For OAuth Clients the whole DTO is replaced. Every mutation must start from freshly loaded state and send the full object.

### 2.3 Not in scope of the library

- No new `M2MClient` methods. Service-account **management** is human-facing; M2M sync endpoints remain the automation surface (`AuthorizationSyncRunner`). Do not conflate them.
- No secret-rotation method — the backend has none (§4.6, §7).

---

## 3. Data layer — server actions + feature modules

The pages never call `/api/*` from the browser. They follow the existing architecture (see `src/actions/user.ts`, `src/features/users/`):

### 3.1 Server actions

- `src/actions/oauth-clients.ts` — `listOAuthClients`, `getOAuthClient`, `createOAuthClient`, `updateOAuthClient`, `deleteOAuthClient`.
- `src/actions/service-accounts.ts` — `listServiceAccounts`, `getServiceAccount`, `createServiceAccount`, `updateServiceAccount`, `deleteServiceAccount`, plus the composite actions below.

Each is `"use server"`, obtains the SDK via `getClientAccess()`, and returns `ActionResult<T>` (never throws), using `toActionError(error)` on failure.

Composite actions (sequencing lives server-side so the browser makes one call; each step's outcome is reported so the UI can offer a precise retry):

| Action | Steps | Partial-failure result |
|---|---|---|
| `setServiceAccountActive(id, active)` | Deactivate: PUT client `active=false` → PUT SA `active=false`. Reactivate: PUT SA → PUT client. | Reports which step failed. On deactivate, the client step goes first so authentication is blocked even if the SA step fails. |
| `createServiceAccountWithNewClient(clientRequest, saRequest)` | POST client → POST SA with the new `oauthClientId` and the client's `applicationId`. | If the SA step fails, returns the created client **including its raw `clientSecret`** so the UI can still disclose it and offer "retry creating the account" against that client. |
| `deleteServiceAccount(id, { alsoDeleteClient })` | DELETE SA → (optional) DELETE client. | Reports whether the client step failed; the SA is already gone. |

All three are backend follow-up candidates (§7) — once the backend cascades, they collapse to single calls.

### 3.2 Feature modules

```
src/features/oauth-clients/
  query-keys.ts        // oauthClientKeys.all / list() / detail(id)
  query-options.ts     // queryOptions wrapping actions with unwrap()
  prefetch.ts
  use-oauth-clients.ts // useOAuthClients, useOAuthClient, useCreate…, useUpdate…, useDelete…, useSetOAuthClientActive
  components/
src/features/service-accounts/
  query-keys.ts
  query-options.ts
  prefetch.ts
  use-service-accounts.ts // useServiceAccounts, useServiceAccount, useCreate…, useCreateWithNewClient, useUpdate…, useDelete…, useSetServiceAccountActive
                          // useOAuthClientsAvailableForServiceAccount → client_credentials clients with no linked SA
  components/
```

- Mutations invalidate the relevant keys on success (matching `useAddUserRole`). Cross-resource mutations (combined deactivate, create-with-client, delete-with-client) invalidate **both** key families.
- Errors surface through `useIGRPToast()` (§6.4).
- **Secrets never enter the query cache.** Create mutations must not `setQueryData` with the create response; the secret lives only in the mutation result held by the disclosure component and is dropped when it unmounts.

### 3.3 Pages

Server components prefetch via `getQueryClient().fetchQuery(...)` and render the client view inside `<HydrationBoundary>` (as in `settings/users/[id]/page.tsx`). A failed primary fetch throws `HttpStatusError`. Each route has `page.tsx`, `loading.tsx` (`AppCenterLoading`) and `error.tsx`.

---

## 4. Section — OAuth Clients

### 4.1 Routes & navigation

```
src/app/(igrp)/(home)/settings/accounts/
  layout.tsx            // shared tab nav: "Clientes OAuth" | "Contas de Serviço"
  page.tsx              // redirect → /settings/accounts/clients
  clients/page.tsx      // list
  clients/[id]/page.tsx // detail
  services/page.tsx
  services/new/page.tsx
  services/[id]/page.tsx
```

- The existing settings card "Gestão de Contas e Serviços" in `settings/page.tsx` changes `href` from `/settings/accounts-services` to `/settings/accounts` and drops `status: "inativo"`.
- **All UI copy is Portuguese**, matching the rest of the app. English strings in this spec express intent only.

### 4.2 List — `/settings/accounts/clients`

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ [ Clientes OAuth ] [ Contas de Serviço ]                                     │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ Clientes OAuth                                          [ + Registar ]  │ │
│ │ Consumidores de API registados no servidor de autorização iGRP.         │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│ [Pesquisar por nome / clientId ] [ Grant type ▾ ] [ Aplicação ▾ ] [ Estado ▾]│
│ ┌ IGRPDataTable ──────────────────────────────────────────────────────────┐ │
│ │ Nome            │ clientId          │ Grant types        │ App │ ● │ ⋮  │ │
│ │ Invoice App     │ my-invoice        │ auth_code, refresh │ INV │ ● │ ⋮  │ │
│ │ Nightly ETL     │ etl-runner-m2m    │ client_credentials │ INV │ ● │ ⋮  │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Columns:** Name (`clientName`), Client Id (`clientId`, monospace), Grant Types (multi-badge), Application (`applicationCode`), Status (`active` badge), Actions.

**Row actions** (`IGRPDropdownMenu`, mirrors `settings/users`):
- View details → `/settings/accounts/clients/[id]`
- Edit → edit dialog (§4.7)
- Copy client Id → clipboard + toast
- ─── separator ───
- Deactivate / Reactivate → §6.1. Confirmation dialog for deactivate.
- Delete → §4.8. **Disabled** when a Service Account is linked, with tooltip "Remova primeiro a conta de serviço."

**Filters** are client-side (`IGRPDataTable` faceted filters) — the list is small and unpaged (§7).

### 4.3 Reusable client form

One `OAuthClientForm` component (`react-hook-form` + `zod`), used by the create dialog, the edit dialog, and wizard step 1 (§5.4). Props control: `clientId` editable or not, Grant Types locked to `client_credentials`, `client_credentials` locked on.

```
┌─── Registar cliente OAuth2 ─────────────────────────────── × ───┐
│  Client Id *          [ my-invoice                          ]    │
│    Kebab-case, único. Não pode ser alterado depois.              │
│  Nome *               [ Invoice App                         ]    │
│  Descrição            [                                     ]    │
│  Aplicação            [ Selecionar aplicação ▾ ]                 │
│                                                                   │
│  Grant types *                                                    │
│  ☑ authorization_code      ☑ refresh_token                        │
│  ☐ client_credentials      ☐ device_code                          │
│                                                                   │
│  Redirect URIs              (obrigatório com authorization_code)  │
│  [ https://app.example.com/api/auth/callback/igrp-auth  ✕ ]      │
│  [ + Adicionar URI ]                                              │
│                                                                   │
│  Scopes   [ openid × ] [ email × ] [ profile × ] [ + Adicionar ]  │
│                                                                   │
│  Avançado ▾   Access-token TTL (s) / Refresh-token TTL (s) /      │
│               Authorization-code TTL (s)                          │
│  ☑ Ativo na criação                                               │
│                                          [ Cancelar ] [ Registar ]│
└─────────────────────────────────────────────────────────────────┘
```

**Field rules:**
- `clientId`: `^[a-z0-9]+(-[a-z0-9]+)*$`, required, unique server-side. A 409 surfaces on the field via `setError`, not as a toast.
- `redirectUris`: required when `authorization_code` is selected; `https://` only, except `http://localhost`. Chip editor.
- `scopes`: chip editor. Defaults to `openid email profile` when `authorization_code` is selected; empty for `client_credentials`-only.
- TTLs: behind "Avançado"; optional (backend has defaults).

### 4.4 Create flow

Dialog (`IGRPDialogPrimitive`, full-screen on md and below) with two sequential panes:

1. **Form** — §4.3.
2. **Secret disclosure** — shown only on a successful POST, using `SensitiveValueDisclosure` (§6.3) for both `clientId` and `clientSecret`. "Concluído — ver detalhes" navigates to the detail page.

### 4.5 Detail — `/settings/accounts/clients/[id]`

Tabbed (`IGRPTabs`, active tab in URL search params, each tab in ErrorBoundary + Suspense — as `user-details-tabs.tsx`).

```
┌─────────────────────────────────────────────────────────────────────┐
│ ← Clientes OAuth / Invoice App                  [ Editar ] [ ⋮ ]    │
│ [ Visão geral ] [ Grant types & scopes ] [ Redirects ] [ Conta de serviço ] │
└─────────────────────────────────────────────────────────────────────┘
```

- **Overview:** `clientId`, `clientName`, `description`, `applicationCode`, `active` (toggle → §6.1), TTLs, timestamps.
- **Grant Types & scopes:** badges. If `client_credentials` is present and no Service Account is linked, hint linking to `/settings/accounts/services/new?oauthClientId=…`.
- **Redirects:** read-only list with copy buttons.
- **Service Account:** the linked Service Account (via `useServiceAccounts` filtered by `oauthClientId`) with a link to its detail page; empty state offers "Criar conta de serviço para este cliente" (deep link above). If more than one is found, show a warning banner (1:1 violated).

### 4.6 Secret rotation — not offered

There is no rotation UI until the backend ships `POST /api/clients/{id}/rotate-secret` (§7, top priority). Delete-and-recreate was rejected: it changes the `id`, breaks the Service Account link, and needs a hand-rolled restore path.

**Leaked-secret procedure** (shown as a one-line hint on the disclosure screen and documented for operators): deactivate immediately (§6.1), then delete and re-register.

### 4.7 Edit flow

- Dialog with `OAuthClientForm`, `clientId` read-only (still sent, unchanged), no secret pane.
- Loads current state via `getOAuthClient` and submits the full DTO (replacement semantics).
- If a Service Account is linked, `client_credentials` is checked and disabled, with a tooltip explaining why.

### 4.8 Delete flow

- `IGRPDialogDelete` (`src/components/dialog-delete.tsx`), type-`clientId`-to-confirm.
- Unavailable while a Service Account is linked (§4.2).

---

## 5. Section — Service Accounts

### 5.1 Routes

- `/settings/accounts/services` (list), `/settings/accounts/services/[id]` (detail), `/settings/accounts/services/new` (wizard; `?oauthClientId=…` deep link).

### 5.2 List — `/settings/accounts/services`

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ [ Clientes OAuth ] [ Contas de Serviço ]                                     │
│ Contas de Serviço                                        [ + Nova conta ]   │
│ Identidades de máquina que autenticam via client_credentials.               │
│ [Pesquisar por nome / clientId ] [ Aplicação ▾ ] [ Estado ▾ ]               │
│ ┌ IGRPDataTable ──────────────────────────────────────────────────────────┐ │
│ │ Nome            │ clientId       │ App │ Permissões          │ ● │ ⋮   │ │
│ │ Nightly Invoice │ etl-runner-m2m │ INV │ 2 perfis · 3 diretas │ ● │ ⋮   │ │
│ │ Legacy Reporter │ legacy-report  │ —   │ 0 perfis · 12 diretas│ ⊗ │ ⋮   │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Columns:** Name, Client Id (monospace, links to the OAuth Client detail), App (`applicationCode`), **Permissions** — `N roles · M direct` (role count from `roleIds`, popover lists `roleCodes`; direct count from `permissionIds`), Status.

The list does **not** compute Effective Permissions (that would be N+1 across every row); see §5.5 and §7.

**Row actions:** View details; Edit → detail page; Copy client Id; Deactivate / Reactivate (§6.1); Delete (§5.6).

### 5.3 Available OAuth Clients

`useOAuthClientsAvailableForServiceAccount()` = OAuth Clients with `client_credentials` and no linked Service Account (computed client-side from both lists).

### 5.4 Create wizard — `/settings/accounts/services/new`

Full page (not a dialog): multiple steps and must be deep-linkable. **Nothing is persisted until the final submit.**

**Step 1 — OAuth Client**

```
│  ○ Usar um cliente OAuth2 existente   [ Selecionar cliente ▾ ]      │
│      (apenas clientes client_credentials sem conta de serviço)      │
│  ● Registar um novo cliente OAuth2                                   │
│    ┌ OAuthClientForm, Grant Types locked to client_credentials ┐    │
│    └───────────────────────────────────────────────────────────┘    │
```

- Step 1 only collects input (an existing `oauthClientId`, or a new-client request). No POST happens here.
- `?oauthClientId=<uuid>` pre-selects the client and jumps to step 2.

**Step 2 — Identity**

```
│  Nome *          [ Nightly Invoice ETL              ]               │
│  Descrição       [                                  ]               │
│  Aplicação       INV — Invoicing   (herdada do cliente OAuth)       │
│  ☑ Ativa na criação                                                  │
```

The application is read-only and inherited from the OAuth Client (or from the new-client form).

**Step 3 — Roles & Direct Permissions**

```
│  Perfis           [ INV.invoice.reader × ] [ INV.invoice.exporter × ]│
│                   [ + Adicionar perfil ]                             │
│  Permissões diretas  ⓘ                                               │
│                   [ my.invoice.approve × ] [ my.report.run × ]       │
│                   [ + Adicionar permissão ]                          │
│  Permissões efetivas: De perfis: 8 · Diretas: 3 · Total únicas: 11   │
│  [ Ver lista ]                                                       │
│                                          [ Voltar ] [ Criar conta ]  │
```

- Pickers reuse the `SelectableDataTable` pattern from `user-role-dialog.tsx` (roles) and `role-permissions-dialog.tsx` (permissions), with a local diff helper like `computeRoleDiff`.
- ⓘ tooltip on Direct Permissions: "Permissões diretas não são revogadas ao remover um perfil. Prefira perfis." Direct Permissions carry a `direct` badge. **No per-add confirmation prompt.**
- Effective Permissions preview fetches each selected role's permissions (roles are few) and lists the union with `direct` markers.

**Submit ("Criar conta")**
- Existing client → `createServiceAccount` with `applicationId` = the client's.
- New client → `createServiceAccountWithNewClient` (§3.1).
- **Success with new client:** a success screen shows the Client Secret via `SensitiveValueDisclosure`, then routes to the SA detail.
- **Client created but SA failed:** the secret disclosure is shown **anyway** (the secret is otherwise lost), followed by an error state with "Tentar criar a conta novamente", which retries `createServiceAccount` against the now-existing client with the wizard's retained step-2/3 input.

### 5.5 Detail — `/settings/accounts/services/[id]`

```
│ ← Contas de Serviço / Nightly Invoice ETL        [ Editar ] [ ⋮ ]   │
│ [ Visão geral ] [ Perfis ] [ Permissões diretas ] [ Cliente OAuth ] │
```

- **Overview:** name, description, active toggle (§6.1), linked OAuth Client (clientId + link), application, timestamps, Effective Permissions summary.
- **Roles:** chips of `roleCodes` grouped by department; "+ Atribuir perfil" opens the step-3 picker; removing a chip confirms inline, then PUTs the reduced set.
- **Direct Permissions:** chips of `permissionNames`; same add/remove UX; no extra confirmation on add.
- **OAuth Client:** read-only summary (name, clientId, Grant Types, active) + "Abrir cliente".

**Replacement caveat:** every add/remove sends the entire current `roleIds` / `permissionIds`. The hook reads fresh detail before submitting; optimistic updates roll back on failure.

### 5.6 Delete flow

- `IGRPDialogDelete`, type-name-to-confirm.
- Checkbox **"Eliminar também o cliente OAuth `<clientId>`" — checked by default.** An orphaned OAuth Client is a live, untracked credential.
- Executes `deleteServiceAccount(id, { alsoDeleteClient })` (§3.1). If the client step fails, toast with a link to the client's detail page to finish manually.

---

## 6. Cross-cutting concerns

### 6.1 Activation state

| Where | Behaviour |
|---|---|
| OAuth Client **without** Service Account | Single full-DTO PUT toggling `active`. |
| OAuth Client **with** Service Account (toggle on client page) | Same combined action as the Service Account toggle — the two never diverge. |
| Service Account | `setServiceAccountActive` (§3.1): deactivate = client → SA; reactivate = SA → client. |

Deactivation copy states the consequence plainly: the identity can no longer authenticate. On partial failure, show which step failed with a retry.

### 6.2 Permission gating — not in v1

No existing settings page gates UI with `usePermissions()` / `<IGRPAuthorization>`, and no `igrp.client.*` / `igrp.service_account.*` codes exist in the token claims or `.igrpstudio/permissions.json`. This area matches the rest of the app: no UI gating; a 403 surfaces as a toast (§6.4). When codes exist, gate with the framework's `usePermissions().can(...)` / `<IGRPAuthorization>` — do not introduce a custom `<Can>`.

Hiding buttons would not fix the real issue — the service-account endpoints are unprotected server-side (§7.2).

### 6.3 Sensitive-value disclosure

`src/components/sensitive-value-disclosure.tsx` (new, shared):

```tsx
<SensitiveValueDisclosure
  label="Client Secret"
  value={clientSecret}
  requireConfirmation   // "Guardei o segredo num local seguro" checkbox
  defaultMasked
  copyable
  onDismiss={...}
/>
```

- Used by: client create (§4.4), SA wizard success and partial-failure screens (§5.4).
- Masked by default (`type="password"`); the reveal toggle switches to `type="text"`. Copy always writes the raw value.
- The "done" action is disabled until the confirmation checkbox is ticked; closing via × or Esc asks "Não poderá voltar a ver este segredo. Fechar mesmo assim?".
- Holds the secret only in component state; nothing is written to the query cache (§3.2).
- Includes the leaked-secret hint (§4.6).

### 6.4 Errors

- Action failures surface via `useIGRPToast()` with the error detail (`ProblemDetail.detail`, falling back to the message).
- Field-level errors (409 on duplicate `clientId`) go to the field via `setError`.
- 401 follows the existing session flow (`getClientAccess()` redirects to `/login`).
- Composite actions report per-step outcomes (§3.1) so the UI can retry precisely.

### 6.5 Empty & loading states

- No OAuth Clients: copy + "Registar o primeiro cliente".
- No Service Accounts: copy explaining the wrapper + "Nova conta de serviço".
- SA with no resolvable OAuth Client: shouldn't happen (FK NOT NULL); show an error state, never a silently broken UI.
- Lists: `AppCenterLoading` on first load, skeleton rows on refetch. Detail: skeleton tabs. Submit buttons show loading and disable the form.

---

## 7. Backend gaps to file as follow-ups

Not blocking; ordered by priority.

1. **Secret-rotation endpoint.** `POST /api/clients/{id}/rotate-secret` that atomically re-hashes the secret, returns the raw value once, and preserves `id` and `clientId`. Until then there is no rotation in the UI (§4.6).
2. **Service-account endpoints are unprotected.** `/api/service-accounts` has no `@PreAuthorize`; any valid JWT can list, create, mutate, or delete. Add `igrp.service_account.{list,view,create,update,delete}` (and confirm the real `igrp.client.*` codes) so the UI can later gate on them (§6.2).
3. **Enforce 1:1.** Unique constraint on `service_account.oauth_client_id`.
4. **Cascade activation.** A Service Account PUT with `active=false/true` should cascade to its OAuth Client atomically, removing the two-step `setServiceAccountActive` (§3.1).
5. **Expanded permissions on `ServiceAccountDTO`.** Add `effectivePermissionNames` so the UI stops fetching each role (§5.4, §5.5) and the list can show Effective Permission counts.
6. **Cascade delete.** `DELETE /api/service-accounts/{id}?cascade=true` to delete both in one call (§5.6). Also define server-side behaviour when deleting an OAuth Client that has a Service Account (reject with 409).
7. **Atomic create.** Optionally accept a nested client request on `POST /api/service-accounts` to remove the two-step `createServiceAccountWithNewClient`.
8. **Filtering / pagination.** Both list endpoints are unpaged. Fine at dozens of records; add query params when counts pass ~200.
