# OAuth Clients — Accounts & Services

How the **OAuth Clients** area of Application Center works, and how to use it.

| | |
|---|---|
| **Where** | Configurações → **Contas e Serviços** → tab **Clientes OAuth** (`/settings/accounts/clients`) |
| **Who** | Platform administrators |
| **Status** | OAuth Clients: live. Service Accounts tab (`/settings/accounts/services`): placeholder until the Service Accounts pages ship |
| **Backend** | `/api/clients` and `/api/service-accounts` of the Access Management API — see [`openapi.json`](./openapi.json) (tags *OAuth Clients*, *Service Accounts*) |
| **Design** | [Spec](../todos/CLIENT_AND_SERVICE_ACCOUNT_MANAGEMENT_SPEC.md) · [Glossary](../../CONTEXT.md) · [Implementation plan](../superpowers/plans/2026-09-23-oauth-clients-section.md) |

---

## 1. Concepts

The words below have precise meanings; they are defined in [`CONTEXT.md`](../../CONTEXT.md).

- **OAuth Client** — an application or service registered on the iGRP authorization server so it can request tokens. Identified by a **Client ID**, authenticated by a **Client Secret**.
- **Client Secret** — shown **once**, at registration. The server stores only a hash; nobody can read it again.
- **Grant Type** — how a client obtains tokens: `authorization_code` (users log in through a browser), `refresh_token`, `client_credentials` (machine-to-machine, no user), `device_code` (devices without a browser).
- **Service Account** — a named machine identity that wraps exactly one `client_credentials` OAuth Client and carries roles and direct permissions.

Rules that shape the screens:

- An OAuth Client has **zero or one** Service Account.
- A client that **has** a Service Account:
  - cannot be deleted (remove the Service Account first);
  - always keeps `client_credentials`;
  - keeps the same application as its Service Account;
  - is activated/deactivated **together with** its Service Account.
- "Client" on its own in code means an SDK class (`AccessManagementClient`). In the domain and the UI we always say **OAuth Client**.

---

## 2. Using it (administrators)

### 2.1 Open the area

1. Go to **Configurações**.
2. Open the card **Contas e Serviços**. You land on **Clientes OAuth** (`/settings/accounts` redirects there).

### 2.2 The client list

Each row shows:

| Column | Meaning |
|---|---|
| **Cliente** | Display name, with the Client ID underneath. Click to open the client. |
| **Tipo** | *Aplicação web* (has `authorization_code`) or *Máquina* (everything else). |
| **Grant types** | The grant types the client may use. |
| **Aplicação** | Code of the owning application, or `—`. |
| **Conta de serviço** | The linked Service Account, or `—`. |
| **Estado** | *Ativo* / *Inativo* (dot + word, never colour alone). |

Filters: search by name or Client ID, **Tipo**, **Aplicação**, **Estado**.

Row menu (**⋯**): *Ver detalhes*, *Copiar client ID*, *Desativar*/*Ativar*, *Eliminar*. An action that isn't allowed stays in the menu, greyed out, with the reason underneath (for example "Remova primeiro a conta de serviço «…»").

### 2.3 Register a client

1. Click **Registar cliente** (or **Registar o primeiro cliente** on an empty list).
2. Fill in the form:
   - **Client ID** — lower-case letters, digits and hyphens (`my-invoice`). Unique, and **cannot be changed later**.
   - **Nome** — display name.
   - **Descrição** — up to 140 characters.
   - **Aplicação** — the owning application (optional).
   - **Grant types** — tick what the client needs. For a machine client, tick only `client_credentials`.
   - **Redirect URIs** — only appears while `authorization_code` is ticked, and then it's required. Type a URI and press Enter. Only `https://` is accepted, except `http://localhost` / `http://127.0.0.1` for development.
   - **Scopes** — defaults to `openid email profile` for web clients. It clears itself when you switch to a machine-only client, unless you've edited it.
   - **Duração dos tokens** — access token, refresh token and authorization code lifetimes in seconds. The equivalent appears underneath ("= 3 minutos"). Leave blank to use the server defaults.
3. Click **Registar**.

If the Client ID already exists, the error appears under **Client ID**. Change it and try again.

### 2.4 Save the secret (once)

After a successful registration the dialog switches to **Cliente registado**:

1. The secret is masked. Use **Mostrar** to see it, or **Copiar**, which always copies the full value, even while masked.
2. Store it in your secret manager **now**. It will never be shown again, to you or to any other administrator.
3. Tick **Guardei o segredo num local seguro**. Only then does **Concluir — ver detalhes** become available.

Closing the dialog before ticking the box asks **Fechar sem confirmar?**. While the registration is still being sent, the dialog can't be closed at all, so the secret can't be lost mid-request.

### 2.5 Edit a client

Open a client (click its name, or **Ver detalhes**). The page is one settings form:

- Change any field. A bar appears at the bottom: **Guardar alterações** or **Descartar**.
- **Client ID** is read-only. **Client secret** is locked and only explains that it was shown once.
- Leaving or reloading the page with unsaved changes asks for confirmation. **Note:** this covers the browser's reload/close, but not in-app links yet.
- The **Registo** section shows when the client was created and last updated.

Things that can't be changed, and why:

| Locked item | Reason |
|---|---|
| `client_credentials` checkbox | A Service Account depends on it. |
| **Aplicação** | A Service Account must stay in its client's application. |
| Both of the above, briefly | The Service Account list is still loading or failed to load, so the page can't yet tell whether the client is linked. It unlocks by itself. |

### 2.6 Deactivate / reactivate

Use **Zona de perigo → Desativar** on the client page, or **Desativar** in the row menu, then confirm.

- **Unlinked client:** only the client is switched off. Applications using it can no longer authenticate.
- **Linked client:** the client **and** its Service Account are switched off together. On deactivate the client goes first, because that's what actually blocks authentication.
- If only one of the two steps succeeds, the error says which one failed (*cliente OAuth* or *conta de serviço*). Retrying from the same dialog finishes the same action; it never flips to the opposite.

Activation is never part of **Guardar alterações**. Saving a form never switches a client on or off.

### 2.7 Delete

Use **Zona de perigo → Eliminar** (or the row menu), type the Client ID to confirm, and click **Eliminar**.

- Deletion is immediate and permanent. The credentials stop working at once.
- It's **blocked** while a Service Account is linked, and also while the page can't confirm there isn't one.

### 2.8 A secret was exposed

There is **no "rotate secret"** yet: the backend has no rotation endpoint. Instead:

1. **Desativar** the client straight away.
2. **Registar** a new client and hand the new credentials to the consumers.
3. **Eliminar** the old client.

### 2.9 Troubleshooting

| You see | What it means / what to do |
|---|---|
| "Já existe um cliente com este client ID." | Pick another Client ID. |
| "A aplicação «X» não existe." | The chosen application code no longer exists. Choose another. |
| "Não foi possível verificar as contas de serviço." banner | The Service Account list failed to load. Delete, activate and deactivate are disabled until you retry. |
| An action greyed out with a reason | The reason is the rule that applies; see §1. |
| "O servidor não devolveu o segredo." | The registration succeeded but no secret came back. Deactivate that client and register a new one. |
| "Não foi possível copiar" | The browser blocked the clipboard. Use **Mostrar** and copy by hand. |

---

## 3. How it works (developers)

### 3.1 Layers

```
Route shell (server)                 src/app/(igrp)/(home)/settings/accounts/**
  └─ prefetch + <HydrationBoundary>  src/features/oauth-clients/prefetch.ts
       └─ Client views               src/features/oauth-clients/components/*
            └─ React Query hooks     src/features/oauth-clients/use-oauth-clients.ts
                                     src/features/service-accounts/use-service-accounts.ts
                 └─ Server actions   src/actions/oauth-clients.ts, src/actions/service-accounts.ts
                      └─ SDK         client.oauthClients / client.serviceAccounts / client.applications
                                     (@igrp/platform-access-management-client-ts, via getClientAccess())
```

This follows the same pattern as `src/features/applications` and `src/features/users`:
- Server actions return `ActionResult<T>` and never throw.
- `unwrap()` turns a failure into an `HttpStatusError` inside `queryFn`.
- Page-critical data uses `fetchQuery` (a failure renders `error.tsx`). Supplementary data uses `prefetchQuery` (a failure leaves the page usable).

### 3.2 File map

| Path | Responsibility |
|---|---|
| `app/.../settings/accounts/layout.tsx` | Page header + `AccountsTabs` for both sections |
| `app/.../settings/accounts/page.tsx` | Redirect to `/settings/accounts/clients` |
| `app/.../settings/accounts/clients/page.tsx` · `[id]/page.tsx` | Prefetch + hydrate the list / detail; `loading.tsx`, `error.tsx` beside each |
| `app/.../settings/accounts/services/page.tsx` | Placeholder until the Service Accounts pages ship |
| `features/accounts/components/accounts-tabs.tsx` | Link-based tab nav (`aria-current="page"`) |
| `actions/oauth-clients.ts` | list / get / create / update / delete / setActive; application code → id; strips secrets |
| `actions/service-accounts.ts` | `listServiceAccounts`, `setServiceAccountActive` (combined, ordered, reports `failedStep`) |
| `features/oauth-clients/lib/oauth-client-utils.ts` | Grant-type catalogue, client kind, redirect-URI rule, `formatSeconds`, `findLinkedServiceAccount` |
| `features/oauth-clients/lib/oauth-client-request.ts` | DTO → SDK request (full-replacement safe); `OAuthClientInput` type |
| `features/service-accounts/lib/service-account-request.ts` | SA DTO → SDK request |
| `features/oauth-clients/oauth-client-schemas.ts` | Zod form schema, defaults, `toFormValues`, `toCreateRequest`, `toUpdateRequest` |
| `features/oauth-clients/{query-keys,query-options,prefetch}.ts` | Cache keys and query definitions |
| `features/oauth-clients/use-oauth-clients.ts` | Query + mutation hooks, incl. `useSetClientActive` |
| `features/oauth-clients/use-copy-client-id.ts` | Clipboard copy with success/error toast |
| `features/service-accounts/use-service-accounts.ts` | `useServiceAccounts`, `useLinkedServiceAccount` |
| `features/oauth-clients/components/*` | List, columns + row menu, badges, form sections, create dialog, detail page, activation / delete dialogs |
| `components/chip-input.tsx` | Chip editor (redirect URIs, scopes) |
| `components/sensitive-value-disclosure.tsx` | One-time secret display (masked, copy, confirmation) |
| `components/unsaved-changes-bar.tsx` | Sticky save/discard bar |

### 3.3 Invariants — read before changing anything

1. **The secret never reaches the cache.**
   - Only `createOAuthClient` returns `clientSecret`. List, get, update and setActive run `withoutSecret`.
   - `useCreateOAuthClient` never calls `setQueryData` and uses `gcTime: 0`. The dialog calls `reset()` on unmount, so the secret doesn't linger in the MutationCache either.
   - The secret lives only in the dialog's component state.
2. **PUT is full replacement.**
   - `toUpdateRequest(dto, values)` starts from the loaded DTO, so fields the UI doesn't edit survive a save: `requirePkce`, `postLogoutRedirectUris`, and grant types outside the four the UI knows.
   - `clientId` and `active` always come from the DTO, never from the form.
   - When `authorization_code` isn't selected, redirect URIs are sent empty, so there's no hidden configuration.
3. **Applications travel by code.**
   - The form and UI use `applicationCode` only.
   - The create/update actions resolve it with `client.applications.getApplications({ code })` and send `applicationId` to the SDK. An unknown code returns `422 "A aplicação «X» não existe."` without calling the SDK.
4. **A linked pair never diverges.**
   - `useSetClientActive` routes to `setServiceAccountActive(saId, active)` when a client is linked, and to `setOAuthClientActive(clientId, active)` otherwise.
   - The combined action deactivates client → SA and reactivates SA → client. It sends the client's `applicationId` in the SA PUT.
   - The hook invalidates on **settle**, because a partial failure still changed server state.
   - The activation dialog fixes its intent (activate/deactivate) when it opens.
5. **Fail safe on unknown link state.** When the Service Account list is loading or errored (`linkUnknown`), the list and detail pages:
   - disable delete and activation;
   - lock `client_credentials` and **Aplicação**.
6. **Unsaved edits survive refetches.**
   - The detail form re-seeds from the server only while it isn't dirty.
   - A successful save resets the form from the response.

### 3.4 Cache keys and invalidation

| Key | Used by |
|---|---|
| `["oauth-clients", "list"]` | List page |
| `["oauth-clients", "detail", id]` | Detail page |
| `["service-accounts", "list"]` | Linked-account lookup (list + detail) |

| Mutation | Invalidates |
|---|---|
| create | `["oauth-clients"]` (not awaited, so the secret pane opens immediately) |
| update | `["oauth-clients"]` |
| delete | removes `detail(id)`, invalidates the client list + `["service-accounts"]` |
| set active | `["oauth-clients"]` + `["service-accounts"]`, on settle |

### 3.5 Errors

- Action failures come back as `{ success: false, error, status }`. Components show them with `useIGRPToast()`.
- A **409** on create goes to the `clientId` field (`form.setError`), not a toast.
- A failure to load the primary list or detail throws to the route's `error.tsx`. A failure to load the Service Account list shows an inline banner and triggers the fail-safe (§3.3.5).

### 3.6 Tests

Under `src/__tests__/`:
- `actions/oauth-clients.test.ts`, `actions/service-accounts.test.ts`
- `oauth-clients/**`: lib, schema, hooks, columns, create dialog, detail, activation dialog, copy hook
- `components/{chip-input,sensitive-value-disclosure,unsaved-changes-bar}.test.tsx`
- `accounts/accounts-tabs.test.tsx`

Component tests render the real design system and mock only actions/hooks. `src/test-setup.ts` polyfills `ResizeObserver` for the design system's `Select` in jsdom.

```bash
npx vitest run src/__tests__/oauth-clients src/__tests__/actions src/__tests__/components src/__tests__/accounts
```

---

## 4. Known limitations

- **No secret rotation.** Waiting for `POST /api/clients/{id}/rotate-secret` (spec §7.1).
- **Service-account endpoints are unprotected server-side.** No `@PreAuthorize` yet (spec §7.2). The UI has no permission gating either; a 403 shows as a toast.
- **In-app navigation while the form is dirty isn't guarded.** Only reload/close is.
- **At 640–767px the register dialog is 32rem wide** instead of full-screen.
- **Deleting from the detail page** flashes a blank frame before returning to the list.
- **Lists are unpaged and filtered client-side.** Fine for dozens of clients (spec §7.8).

## 5. What comes next

The Service Accounts pages (list, detail, create wizard, delete-with-client) will replace the placeholder tab. They will also add the client detail's **Conta de serviço** section, and turn the Service Account names in the client list into links. The data-layer pieces they build on already exist: `serviceAccountKeys`, `useServiceAccounts`, `setServiceAccountActive`, `toServiceAccountRequest`, `SensitiveValueDisclosure` and `OAuthClientFormSections`.
