# Status-aware error pages (401/403/404/500/503)

**Date:** 2026-06-10
**Status:** Approved

## Goal

When a page-load fetch to the access-manager fails, show a full-page,
status-specific error page (401, 403, 404, 500, 503 — plus a generic
fallback) that displays the API's error message when one is available.
Today the HTTP status is lost: server actions flatten every failure to
`{ success: false, error: string }` and pages silently render empty lists.

## Decisions (confirmed with user)

- **Render in place** via segment `error.tsx` boundaries — no redirect to
  dedicated `/error/[status]` routes. URL is preserved; refresh retries.
- **401 shows the 401 page** (no automatic redirect to login). The page's
  home/login button leads the user out.
- **App-wide** — all `(home)` group segments, not just settings.
- **Portuguese copy**, matching the rest of the app.
- **Mutations are out of scope** — client-side mutations (invite user,
  add roles, …) keep their existing toast-based error handling. Only
  initial page-load fetches throw to the error boundary.

## Architecture

Flow:

```
SDK throws { status, details, message }
  → action catch: { success: false, error: string, status?: number }
  → server page: if (!result.success) throw new HttpStatusError(status, error)
  → segment error.tsx → StatusAwareError
  → status found in digest? → StatusErrorPage (status copy + API message)
  → otherwise → existing IGRPSegmentError fallback
```

### 1. Propagate status from server actions

- `ActionResult<T>` failure arm (src/actions/types.ts) becomes
  `{ success: false; error: string; status?: number }`. Additive — no
  existing caller breaks.
- New helper `toActionError(error)` in `src/lib/utilities.ts`:
  returns `{ error: extractApiError(error), status: (error as ApiErrorLike).status }`.
- Every `catch` block in `src/actions/*` changes from
  `return { success: false, error: extractApiError(error) }` to
  `return { success: false, ...toActionError(error) }`. Mechanical sweep.

### 2. `HttpStatusError` — survives production serialization

Next.js redacts `error.message` across the server→client boundary in
production but leaves `error.digest` untouched (same trick as the
framework's `AppError`).

- New class in `src/lib/errors.ts`:
  `HttpStatusError(status?: number, publicMessage?: string)` sets
  `this.digest = `HTTP_${status}|${publicMessage}``.
- New parser `parseHttpStatusDigest(digest)` → `{ status, message } | null`.
  Returns `null` for digests not produced by `HttpStatusError` so the
  boundary can fall through to existing handling (`AppError`, `IgrpError`).

### 3. `StatusErrorPage` component

`src/components/errors/status-error-page.tsx` (client component):

- Layout per the approved screenshots: large status number, bold title,
  muted description, two buttons — "Voltar" (router.back()) and
  "Início" (link to home). Uses IGRP design-system components
  (`IGRPButton`) and Tailwind, consistent with existing error UIs.
- Props: `status?: number`, `message?: string` (API message overrides the
  default description when present).

Copy lives in `src/config/error-messages.ts`:

```ts
STATUS_ERROR_COPY: Record<number, ErrorCopy> = {
  401: { title: "Acesso não autorizado", description: "Inicie sessão com as credenciais adequadas para aceder a este recurso." },
  403: { title: "Acesso negado", description: "Não tem permissões para ver este recurso." },
  404: { title: "Página não encontrada", description: "A página que procura não existe ou foi removida." },
  500: { title: "Ocorreu um erro", description: "Pedimos desculpa pelo incómodo. Tente novamente mais tarde." },
  503: { title: "Serviço em manutenção", description: "O serviço não está disponível de momento. Voltaremos em breve." },
}
```

Unknown/missing status → generic fallback copy with no number, or "Erro".

### 4. Shared boundary logic

- New client component `StatusAwareError` (e.g.
  `src/components/errors/status-aware-error.tsx`):
  takes the standard `{ error, reset }` boundary props, calls
  `parseHttpStatusDigest(error.digest)`. Status found → render
  `StatusErrorPage`; otherwise → render the existing `IGRPSegmentError`
  with `resolveErrorCopy` (current behavior preserved).
- Existing `error.tsx` files in the `(home)` group (settings/users,
  settings/applications, settings/applications/[code],
  settings/departments, and the `(igrp)` group boundary) delegate to
  `StatusAwareError` instead of duplicating logic. Error reporting
  (`reportError` / console) stays in each boundary as today.

### 5. Pages throw on failure

Server pages in the `(home)` group stop swallowing failures. Pattern:

```ts
const result = await getUsers();
if (!result.success) throw new HttpStatusError(result.status, result.error);
```

For pages that fetch multiple resources in parallel (e.g. users +
invitations), throw on the primary resource's failure; secondary
resources may degrade gracefully (documented per page during planning).

## Error handling

- SDK error without a `status` field → `HttpStatusError(undefined, msg)`
  → boundary renders the generic fallback page with the message.
- Non-HTTP errors (bugs, config errors) → digest doesn't match →
  existing `IGRPSegmentError` path unchanged.

## Testing

- Unit: `parseHttpStatusDigest` round-trip with `HttpStatusError`
  (status present, absent, malformed digest).
- Unit: `toActionError` extracts message + status from SDK-shaped errors.
- Component: `StatusErrorPage` renders correct copy per status and
  prefers the API message when given.
- Manual: force a 401/403/500 from the access-manager (expired token /
  removed permission / stopped backend) and verify each page renders in
  place in the settings segments.
