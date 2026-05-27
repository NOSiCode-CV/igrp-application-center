# Profile Page Polish & A11y Follow-up — Design

**Status:** Draft
**Date:** 2026-05-26
**Author:** Fidel da Luz (with Claude)
**Predecessor:** `docs/superpowers/plans/2026-05-26-profile-page-review-fixes.md` (Tasks 1–12). This design applies *after* Tasks 7–12 land.

## Goal

Apply a focused round of polish to the profile page that the predecessor plan did not address: accessibility hardening, status-toggle UX relocation, lazy-loaded tab content, page metadata, and dead-markup cleanup. No new features; no architectural changes beyond extracting one small actions-menu component.

## Non-Goals

- Renaming or re-keying existing tests beyond the additions listed under *Testing*.
- Replacing the parent toast pattern with inline-only feedback (we keep both).
- Adding an error boundary per tab; chunk-load failures keep `next/dynamic`'s default behavior.
- Any work on admin-views-other-user variants (header just gets a `ReactNode` slot that enables it later).

## Files

**Modify**

- `src/app/(igrp)/(home)/profile/page.tsx` — add `metadata`, drop `force-dynamic`.
- `src/features/users/components/user-profile-header.tsx` — accept `actions` slot prop; render slot adjacent to the name row; delete dead `<div className="relative">` + `<div className="absolute inset-0 rounded-xl -z-10" />` wrapper.
- `src/features/users/components/user-profile-avatar.tsx` — `aria-label` on trigger; `alt` fallback chain; disable trigger when `isResolvingUrl || isUploading`.
- `src/features/users/components/user-profile-editable-name.tsx` — add `maxLength` (default 120), internal `saving` and `error` state, inline `aria-live` error; re-throw to parent.
- `src/features/users/components/user-profile-tabs.tsx` — wrap each tab content with `next/dynamic({ ssr: false, loading: TabLoading })`.
- `src/features/users/components/user-profile.tsx` — compose `<UserProfileActionsMenu />` into `<UserProfileHeader actions={...} />`; drop the inline status button.

**Create**

- `src/features/users/components/user-profile-actions-menu.tsx` — `DropdownMenu`-based actions menu; one item (status toggle); designed to grow.
- `src/features/users/components/tab-loading.tsx` — tiny shared loading shim for lazy tabs (likely just `<AppCenterLoading description="Carregando..." />` or a skeleton).
- `src/__tests__/users/components/user-profile-actions-menu.test.tsx`

## Components

### `UserProfileActionsMenu` (new)

```ts
export interface UserProfileActionsMenuProps {
  isActive: boolean;
  isPending: boolean;
  onToggleStatus: () => void;
}
```

- Renders a `DropdownMenu` (from the IGRP design system) with a ghost `IGRPButton` trigger using `MoreHorizontal` icon and `aria-label="Ações do utilizador"`.
- Single `DropdownMenuItem`:
  - Label: `isActive ? "Desativar" : "Ativar"`.
  - When `isActive`: destructive class (`text-destructive focus:text-destructive`).
  - Icon: `Ban` when active, `Check` when inactive.
  - `disabled={isPending}` (closes the dropdown if `isPending` becomes true mid-render).
- On select: calls `onToggleStatus()`. The actual mutation still runs through `UserProfileStatusDialog`; the menu only opens the dialog.

### `UserProfileHeader` (modified)

Add prop:

```ts
actions?: React.ReactNode;
```

- Render `actions` inside the same flex row that contains `UserProfileEditableName` and the email — right-aligned via `ml-auto` on the actions wrapper.
- Remove the existing inline status button (it moves into the actions menu, owned by the container).
- Delete the `<div className="relative">` + `<div className="absolute inset-0 rounded-xl -z-10" />` wrappers around the `Card`.

### `UserProfileAvatar` (modified)

- Trigger `<button>` gets `aria-label="Alterar avatar"`.
- `IGRPUserAvatar alt={user.name || user.username || user.email || "Utilizador"}`.
- Disable the trigger button (and the hidden `<input>`) when `isResolvingUrl || isUploading`.

### `UserProfileEditableName` (modified)

Add optional prop:

```ts
maxLength?: number; // default 120
```

Internal state additions:

```ts
const [saving, setSaving] = useState(false);
const [error, setError] = useState<string | null>(null);
```

`commit` flow:

1. Trim draft. If empty or unchanged → exit edit mode, clear `error`.
2. Set `saving = true`, clear `error`.
3. Try `await onSave(next)` → on success: exit edit mode, clear state.
4. Catch: set `error = (err as Error).message || "Erro ao guardar"`. Re-throw so parent's `onSave` toast still fires.
5. Finally: set `saving = false`.

Render:

- `IGRPInputText` gets `maxLength={maxLength ?? 120}`, `disabled={saving}`, `aria-invalid={!!error}`, `aria-describedby={error ? "name-error" : undefined}`.
- Both action buttons (`Guardar nome`, `Cancelar edição`) get `disabled={saving}`. Cancel is allowed during saving? No — disable both; the user cannot escape mid-mutation. (Escape key likewise no-ops while `saving`.)
- After the action buttons, when `error`:

  ```tsx
  <p id="name-error" role="alert" aria-live="polite" className="text-sm text-destructive">
    {error}
  </p>
  ```

### `UserProfileTabs` (modified)

Replace each direct import with a `dynamic` factory:

```ts
const DepartmentListSimple = dynamic(
  () => import("@/features/departments/components/dept-list-simple-container").then(m => m.DepartmentListSimple),
  { ssr: false, loading: () => <TabLoading /> },
);
```

Same pattern for `UserApplications`, `ProfileRoleList`, `UserSignature`. The `tabs` array in `useMemo` is unchanged — it just references the lazy wrappers.

### `page.tsx` (modified)

- Remove `export const dynamic = "force-dynamic"`.
- Add `export const metadata = { title: "Perfil" }`.

## Data Flow & State Ownership

- Container (`UserProfile`) continues to own `showStatusDialog`, `updateUser` mutation, and the avatar/name `onSave` handlers.
- The `<UserProfileActionsMenu />` is composed into `<UserProfileHeader actions={...} />` by the container. The header is purely layout; the container injects the action set. This positions the codebase for future admin views (different `actions` content per role).
- Editable-name `saving` and `error` are fully internal to `UserProfileEditableName`. Parent toast continues firing from the container's `onSave` catch — `UserProfileEditableName.commit` re-throws so the existing pattern keeps working.
- Lazy-tab state lives in `next/dynamic`'s runtime; no app-level state added.

## Testing

**Modify**

- `src/__tests__/users/components/user-profile-editable-name.test.tsx` — add:
  - `it("disables save while onSave is in flight")` — mock `onSave` returns an unresolved promise, click save, assert button is `disabled`.
  - `it("shows inline error when onSave rejects and stays in edit mode")` — mock `onSave` rejects with `Error("nope")`, assert `screen.getByRole("alert")` contains "nope" and input remains in DOM.
  - `it("respects maxLength")` — assert `input` has `maxLength="120"`.
- `src/__tests__/users/components/user-profile-avatar.test.tsx` — add:
  - `it("disables trigger while isResolvingUrl")` — render with `isResolvingUrl`, assert the trigger button is `disabled` and `aria-label` reads "Alterar avatar".

**Create**

- `src/__tests__/users/components/user-profile-actions-menu.test.tsx`:
  - `it("calls onToggleStatus when the menu item is selected")` — open menu, click "Desativar", assert spy called.
  - `it("disables the menu item while isPending")` — open menu, assert item is `aria-disabled`.

**Not tested**

- `next/dynamic` lazy wiring (mechanical, framework-owned).
- `metadata` export on `page.tsx`.
- Dead-markup deletion (pure subtraction, no behavior).

## Error Handling

- `UserProfileEditableName` catches `onSave` rejection internally, surfaces inline `aria-live` error, and **re-throws** so the container's toast handler still runs.
- `UserProfileActionsMenu` does no async work — all error paths remain in `UserProfileStatusDialog` → container.
- Lazy tabs: chunk-load failure falls back to `next/dynamic`'s default behavior (renders nothing). Out of scope to add an error boundary per tab.

## Risks & Mitigations

| Risk | Mitigation |
|---|---|
| The IGRP design system may not export `DropdownMenu*` primitives | First task in the plan verifies imports work; fall back to local shadcn `DropdownMenu` if needed. |
| `next/dynamic({ ssr: false })` is not allowed in some Next.js 15 server boundaries | `UserProfileTabs` is already `"use client"`, so SSR-off is fine. Smoke test in dev. |
| Removing `force-dynamic` before Task 10 lands could leak stale data | This design ships *after* Task 10 (RSC prefetch). Sequencing locked. |
| Re-throw in editable-name causes double-toast (inline + parent toast) | Inline is a destructive-styled `<p>` near the input; parent toast is a system snackbar. Different surfaces; acceptable redundancy. |

## Out of Scope

- Replacing the toast pattern.
- Adding rate-limit handling for rapid mutations.
- Server-side validation for the name (length, profanity, etc.).
- Re-styling the avatar's hover halo beyond Task 11's audit.
- Admin views of other users.
