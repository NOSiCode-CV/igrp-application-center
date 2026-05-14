# Users Feature Redesign — Design Spec

**Date:** 2026-05-14  
**Author:** Fidel da Luz  
**Scope:** `src/app/(igrp)/(home)/settings/users` + `src/features/users` + related actions/hooks  
**Approach chosen:** B — Refactor + Feature Expansion

---

## Context

The users management feature (`/settings/users`) works but has three classes of problems:

1. **Architecture**: Every page uses `force-dynamic` and renders an empty RSC shell that immediately hands off to a client component. All data is fetched client-side via React Query, producing loading spinners on every navigation.
2. **Component quality**: `user-list.tsx` and `user-details.tsx` are large client components that mix data-fetching, state management, and rendering. Role diff logic is inlined in `UserRoleDialog`. No utility extraction.
3. **SDK gaps**: `@igrp/platform-access-management-client-ts` v0.2.0-beta.6 exposes `AdminSessionClient`, `AuthAuditClient`, user metadata endpoints, and `AddRolesToUserRequestDTO` with `expiresAt` — none of which the current feature uses.

This spec covers the users feature only. The pattern established here will be replicated to roles, departments, and applications settings pages in a follow-up.

---

## Goals

- Initial page load renders data immediately (no spinner on first navigation)
- Components have single, clear responsibilities
- Three new admin capabilities: session management, audit log, user metadata
- Temporary role assignments (time-limited roles via `expiresAt`)
- No regressions in existing invite, role assignment, or status toggle flows
- Type alignment between project code and SDK types

---

## Architecture

### RSC + `force-dynamic` pattern

`force-dynamic` is correct for authenticated admin pages — it means the page is rendered fresh on every server request, which is what you want for live data. The change is that the RSC page itself now fetches data before rendering, instead of delegating to a client component that fetches on mount.

**Data flow (target):**

```
Request
  → page.tsx (RSC, force-dynamic)
      → await getUsers()           ← server-side, no round-trip
      → <UserListTable initialData={users} />
          → React Query hydrates with initialData
          → mutations + refetch work as before
          → no spinner on first load
```

React Query remains the mutation layer. `initialData` is passed from the RSC page so the first render has data. Subsequent refetches (after mutations) still go through React Query normally.

### Where `"use client"` lives

| Server components | Client components |
|---|---|
| `page.tsx` files | All interactive components |
| Initial data fetch | Dialog open/close state |
| Static layout shells | Form inputs and validation |
| Error/Suspense boundaries | Mutation hooks |
| — | Table row actions |

---

## Component Decomposition

### `user-list.tsx` → 3 units

**Before:** One 400+ line client component managing invite/role/status dialog state, tab state, data fetching, column definitions, and row actions in a single file.

**After:**

| File | Type | Responsibility |
|---|---|---|
| `page.tsx` | RSC | `await getUsers()` + `await getUserInvitations()`, passes `initialData` |
| `user-list-table.tsx` | Client | Tab state, `IGRPDataTable` columns, row action dispatch, opens dialogs |
| `user-list-filters.tsx` | Client | Search input, status filter, department filter, Invite button |

`UserListFilters` drives filtering via **URL search params** (`useSearchParams` / `useRouter`). Filter changes update the URL; `page.tsx` (RSC) reads `searchParams` and passes the filtered `initialData` down. This keeps all filter state in the URL (shareable, bookmarkable) and avoids client-side state management entirely.

### `user-details.tsx` → shell + panels

**Before:** One client component fetching user, roles, departments, and applications; managing edit state, status toggle, tab rendering, and avatar display.

**After:**

| File | Type | Responsibility |
|---|---|---|
| `[id]/page.tsx` | RSC | `await getUser(id)`, passes user as prop |
| `user-details-header.tsx` | Client | Editable name, status toggle with confirm dialog, avatar |
| `user-details-tabs.tsx` | Client | Tab shell; each panel wrapped in `Suspense` + `ErrorBoundary` |

Each tab panel (`UserRoleList`, `UserApplications`, `UserDepartments`, `UserSignature`, plus the three new panels) is rendered lazily inside its own `Suspense` + `ErrorBoundary`. A failing tab does not break the rest of the page.

### Role diff utility

Role diff logic is extracted from `UserRoleDialog` into a pure function with no React dependencies:

```ts
// src/features/users/lib/role-diff.ts
export function computeRoleDiff(
  current: string[],
  selected: string[],
  expiresAt?: string
): { toAdd: AddRolesToUserRequestDTO; toRemove: string[] }
```

`UserRoleDialog` calls this function. The utility is independently testable.

---

## New Features

### 1. Temporary role assignments

`AddRolesToUserRequestDTO` supports an optional `expiresAt: string` (ISO-8601). The current codebase passes `string[]` directly, bypassing this field entirely.

**Changes:**
- `UserRoleDialog` gains an "Expires at" date column for each checked role. If left blank, the assignment is permanent (`expiresAt` omitted). If dated, the role expires automatically.
- Existing temporary roles display their current expiry in the column; the admin can edit in place to extend.
- The diff summary line shows expiry information: `"Adding 1 · SUPPORT_L1 expires 2026-06-30"`.
- `addRolesToUser` action signature changes from `roleCodes: string[]` to `request: AddRolesToUserRequestDTO`.
- `useAddUserRole` hook variables updated to match.

### 2. Sessions tab — `UserSessionsTab`

New tab in `UserDetails`. Uses `AdminSessionClient`.

**Data:** `AdminSessionClient.getUserSession(userExternalId)` → `SessionResponseDTO`  
**Note on `userExternalId`:** This is the OIDC subject identifier (Keycloak user ID), not the numeric `IGRPUserDTO.id`. It maps to `IGRPUserDTO.username`. The sessions tab passes `user.username` as the external ID. If `username` is absent on a user record, the Sessions tab shows an "unavailable" state rather than erroring.  
**Displays:** session ID (truncated), status badge, started at, last seen, client IP, device ID  
**Action:** Kill session button → prompts admin for a reason string → `AdminSessionClient.killSession(sessionId, { reason })` → invalidates `["userSession", externalId]`  
**Empty state:** "No active sessions" message when the user has no open session.

### 3. Audit log tab — `UserAuditLogTab`

New tab in `UserDetails`. Uses `AuthAuditClient`.

**Data:** `AuthAuditClient.getAuditLogsByUserId(userId, filters)` → `PageResponse<SecurityAuditLogDTO>`  
**Displays:** timestamp, event type (colour-coded badge), category, IP address  
**Pagination:** client-side page state, `size: 10` per page, uses `PageResponse.totalPages`  
**Read-only.** No actions.

### 4. Metadata panel — `UserMetadataPanel`

Rendered below the user header in `UserDetails` (always visible, not a tab).

**Data:** `UserClient.getUserMetadata(id)` → `UserMetadataDTO` (contains `metadata: Record<string, unknown>`)  
**UI:** key/value row editor. "Add field" appends a blank row. ✕ removes a row.  
**Save:** `UserClient.updateUserMetadata(id, { metadata })` → invalidates `["userMetadata", id]`  
**Collapse:** panel is collapsed by default if metadata is empty; expanded if it has entries.

---

## Type Corrections

| Location | Before | After |
|---|---|---|
| `actions/user.ts` — `addRolesToUser` | `roleCodes: string[]` | `request: AddRolesToUserRequestDTO` |
| `features/users/use-users.ts` — `useAddUserRole` variables | `{ id, departmentCode, roleCodes: string[] }` | `{ id, departmentCode, request: AddRolesToUserRequestDTO }` |
| `features/users/user-schema.ts` — `UserSchema` | missing `username` | `username: z.string().optional()` (display-only, not editable) |

---

## New Server Actions

### `actions/user.ts` additions
```ts
getUserMetadata(id: number): Promise<ActionResult<UserMetadataDTO>>
updateUserMetadata(id: number, metadata: Record<string, unknown>): Promise<ActionResult<UserMetadataDTO>>
```

### `actions/user-sessions.ts` (new file)
```ts
getUserSession(userExternalId: string): Promise<ActionResult<SessionResponseDTO>>
killUserSession(sessionId: string, reason: string): Promise<ActionResult<void>>
```

### `actions/user-audit.ts` (new file)
```ts
getUserAuditLogs(userId: string, filters?: AuditLogFilters): Promise<ActionResult<PageResponse<SecurityAuditLogDTO>>>
```

---

## New React Query Hooks

Added to `src/features/users/use-users.ts`:

| Hook | Query key | Invalidated by |
|---|---|---|
| `useUserSession(externalId)` | `["userSession", externalId]` | `useKillUserSession` |
| `useKillUserSession()` | — (mutation) | invalidates `["userSession", externalId]` |
| `useUserAuditLogs(userId, filters?)` | `["userAuditLogs", userId]` | read-only |
| `useUserMetadata(id)` | `["userMetadata", id]` | `useUpdateUserMetadata` |
| `useUpdateUserMetadata()` | — (mutation) | invalidates `["userMetadata", id]` |

---

## Error Handling

- All new server actions follow the existing `ActionResult<T>` pattern: `{ success: true; data: T } | { success: false; error: string }`.
- Each new tab panel is wrapped in `ErrorBoundary` with a `TabError` fallback showing the tab name and a Retry button that calls `queryClient.invalidateQueries`.
- Skeleton loaders (`TabSkeleton`) shown during Suspense — pulse-animated placeholder rows matching the panel's shape.
- Kill session prompts for a reason before executing — no accidental kills.
- Metadata save is optimistic-free (confirm on server response, not before) given the low frequency of updates.

---

## Testing

| Type | Target | What to verify |
|---|---|---|
| Unit | `role-diff.ts` — `computeRoleDiff` | add/remove/expiresAt combinations |
| Unit | `UserSchema` Zod | optional username, email format, name length |
| Component | `UserRoleDialog` | expiresAt toggle per row, diff summary text |
| Component | `UserSessionsTab` | kill flow — reason prompt, mutation called with correct args |
| Component | `UserMetadataPanel` | add row, remove row, save triggers mutation with merged metadata |

Existing tests for `UserInviteDialog`, `UserList`, and invite flow are unchanged.

---

## Out of Scope

- Server-side pagination for the user list (requires backend `PageResponse` support — deferred)
- Roles, departments, and applications settings pages (follow-up after users is complete)
- Design polish pass (colours, spacing, typography) — treated as incremental throughout implementation
- `OAuthClient` management UI
- Batch session kill (by role or department) — `AdminSessionClient` supports it but no UI planned here
