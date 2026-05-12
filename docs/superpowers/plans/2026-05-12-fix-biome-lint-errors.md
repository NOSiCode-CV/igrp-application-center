# Fix Biome Lint Errors Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix all 17 Biome lint errors across 8 files so `pnpm lint` exits with code 0.

**Architecture:** Each fix is isolated to its file — no cross-file refactoring. Three categories of fixes: (1) static skeleton index keys → `biome-ignore` comment, (2) unstable `useEffect` dependency arrays → stabilize references with `useCallback`/module-level extraction/primitive inlining, (3) a11y interactive divs → add `role="button"`, `tabIndex`, and `onKeyDown`. All modified files are client components (`'use client'`) — no RSC boundary impact.

**Tech Stack:** React 19, Next.js 15, Biome (linter), TypeScript

**Applied Best Practices:**
- **`rerender-dependencies`** (Vercel): prefer primitive deps in effects over object deps — used to avoid memoizing `defaultValues` in `role-form-dialog` by inlining values directly.
- **`rerender-use-ref-transient-values`** / **`useCallback`** (Vercel): stabilize `getRowKey` function references with `useCallback(fn, [])` in both dialog files.
- **`react19-no-forwardref`** (Composition Patterns): no `forwardRef` introduced.
- **Next.js `rsc-boundaries`**: all files are client components — safe to add hooks.

---

## File Map

| File | Issue(s) | Fix Strategy |
|---|---|---|
| `src/features/departments/components/Modal/manage-apps-modal.tsx` | `noArrayIndexKey` line 210 | `biome-ignore` comment |
| `src/features/departments/components/dept-form-dialog.tsx` | `useExhaustiveDependencies` lines 75, 96 | Move `defaultValues` outside component |
| `src/features/menus/components/menu-form-dialog.tsx` | `noArrayIndexKey` line 498 | `biome-ignore` comment |
| `src/features/permissions/components/resource-manage-modal.tsx` | `noArrayIndexKey` line 310 | `biome-ignore` comment |
| `src/features/roles/components/role-form-dialog.tsx` | `useExhaustiveDependencies` line 79 | Wrap `defaultValues` in `useMemo` |
| `src/features/roles/components/role-permissions-dialog.tsx` | `useExhaustiveDependencies` lines 197, 208 | Wrap `getRowKey` in `useCallback` |
| `src/features/users/components/user-details.tsx` | `noStaticElementInteractions`, `useKeyWithClickEvents` line 191 | Add `role`, `tabIndex`, `onKeyDown` |
| `src/features/users/components/user-profile.tsx` | `noStaticElementInteractions`, `useKeyWithClickEvents` line 249 | Add `role`, `tabIndex`, `onKeyDown` |
| `src/features/users/components/user-role-dialog.tsx` | `useExhaustiveDependencies` lines 231, 257; `useButtonType` line 387 | `useCallback` for `getRowKey`; `type="button"` |
| `src/features/users/components/user-signature.tsx` | `noStaticElementInteractions`, `useKeyWithClickEvents` line 104 | Add `role`, `tabIndex`, `onKeyDown` |

---

### Task 1: Fix `noArrayIndexKey` in skeleton loaders (3 files)

**Context:** `Array.from({ length: N }).map((_, i) => <Skeleton key={i} />)` — these are static loading placeholders that never reorder, so using index as key is safe. Biome doesn't know this; suppress with `biome-ignore`.

**Files:**
- Modify: `src/features/departments/components/Modal/manage-apps-modal.tsx:209`
- Modify: `src/features/menus/components/menu-form-dialog.tsx:495`
- Modify: `src/features/permissions/components/resource-manage-modal.tsx:309`

- [ ] **Step 1: Fix manage-apps-modal.tsx**

In `src/features/departments/components/Modal/manage-apps-modal.tsx`, locate line 209 and add the ignore comment above the map:

```tsx
{Array.from({ length: 6 }).map((_, i) => (
  // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton loader
  <Skeleton key={i} className="h-20 rounded-lg" />
))}
```

- [ ] **Step 2: Fix resource-manage-modal.tsx**

In `src/features/permissions/components/resource-manage-modal.tsx`, locate line 309 and apply the same pattern:

```tsx
{Array.from({ length: 6 }).map((_, i) => (
  // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton loader
  <Skeleton key={i} className="h-20 rounded-lg" />
))}
```

- [ ] **Step 3: Fix menu-form-dialog.tsx**

In `src/features/menus/components/menu-form-dialog.tsx`, locate line 495 and apply to the loading div:

```tsx
{Array.from({ length: 10 }).map(
  (_, i) => (
    <div
      // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton loader
      key={i}
      className="h-9 animate-pulse rounded-sm bg-foreground/5 mx-2 my-1"
    />
  ),
)}
```

- [ ] **Step 4: Verify lint passes for these files**

Run: `pnpm exec biome check src/features/departments/components/Modal/manage-apps-modal.tsx src/features/permissions/components/resource-manage-modal.tsx src/features/menus/components/menu-form-dialog.tsx`

Expected: `Checked 3 files` with no errors for `noArrayIndexKey`.

- [ ] **Step 5: Commit**

```bash
git add src/features/departments/components/Modal/manage-apps-modal.tsx src/features/menus/components/menu-form-dialog.tsx src/features/permissions/components/resource-manage-modal.tsx
git commit -m "fix(lint): suppress noArrayIndexKey on static skeleton loaders"
```

---

### Task 2: Fix `useExhaustiveDependencies` in `dept-form-dialog.tsx`

**Context:** `defaultValues` is defined inside the component but its values are all compile-time constants (empty strings and a status enum). Moving it outside the component gives it a stable reference across renders, satisfying the exhaustive deps rule.

**Files:**
- Modify: `src/features/departments/components/dept-form-dialog.tsx`

- [ ] **Step 1: Move `defaultValues` outside the component**

Find the `defaultValues` object (currently around line 61, inside the component function body) and move it to module scope — place it just before the component's `export` or `function` declaration:

```tsx
const defaultValues = {
  name: "",
  code: "",
  description: "",
  status: statusSchema.enum.ACTIVE,
  parentCode: "",
};
```

Remove the same declaration from inside the component.

- [ ] **Step 2: Add `defaultValues` to the first `useEffect` dependency array (line ~92)**

Change:
```tsx
}, [open, department, parentDeptId, form]);
```
To:
```tsx
}, [open, department, parentDeptId, form, defaultValues]);
```

- [ ] **Step 3: Add `defaultValues` to the second `useEffect` dependency array (line ~101)**

Change:
```tsx
}, [open, form]);
```
To:
```tsx
}, [open, form, defaultValues]);
```

- [ ] **Step 4: Verify**

Run: `pnpm exec biome check src/features/departments/components/dept-form-dialog.tsx`

Expected: No `useExhaustiveDependencies` errors.

- [ ] **Step 5: Commit**

```bash
git add src/features/departments/components/dept-form-dialog.tsx
git commit -m "fix(lint): stabilize defaultValues reference in dept-form-dialog"
```

---

### Task 3: Fix `useExhaustiveDependencies` in `role-form-dialog.tsx`

**Context:** `defaultValues` depends on the `departmentCode` prop, so it can't be moved to module scope. The Vercel `rerender-dependencies` rule says to prefer primitive deps over object deps in effects. Since `departmentCode` is already in the dep array, the simplest fix is to **remove the `defaultValues` variable entirely from the `else` branch** and inline the primitive field values directly — this keeps object creation out of the deps list.

**Files:**
- Modify: `src/features/roles/components/role-form-dialog.tsx`

- [ ] **Step 1: Remove `defaultValues` from the `else` branch and inline values**

Find the `useEffect` (around line 79). The `else` branch currently does:
```tsx
} else {
  form.reset({
    ...defaultValues,
    parentCode: parentRoleName ?? "",
  } as CreateRoleArgs);
}
```

Replace it with inlined values (matching the `defaultValues` object fields):
```tsx
} else {
  form.reset({
    name: "",
    description: null,
    departmentCode: departmentCode ?? "",
    parentCode: parentRoleName ?? "",
    code: "",
    status: statusSchema.enum.ACTIVE,
  } as CreateRoleArgs);
}
```

- [ ] **Step 2: Delete the `defaultValues` declaration**

Remove the plain object declaration (around line 65):
```tsx
const defaultValues = {
  name: "",
  description: null,
  departmentCode: departmentCode,
  parentCode: "",
  code: "",
  status: statusSchema.enum.ACTIVE,
};
```

Also remove it from `useForm`'s `defaultValues` prop — use the inline object directly:
```tsx
const form = useForm<CreateRoleArgs>({
  resolver: zodResolver(createRoleSchema),
  defaultValues: {
    name: "",
    description: null,
    departmentCode: departmentCode ?? "",
    parentCode: "",
    code: "",
    status: statusSchema.enum.ACTIVE,
  },
});
```

- [ ] **Step 3: Verify**

Run: `pnpm exec biome check src/features/roles/components/role-form-dialog.tsx`

Expected: No `useExhaustiveDependencies` errors.

- [ ] **Step 4: Commit**

```bash
git add src/features/roles/components/role-form-dialog.tsx
git commit -m "fix(lint): inline defaultValues in role-form-dialog to remove object dep"
```

---

### Task 4: Fix `useExhaustiveDependencies` for `getRowKey` in `role-permissions-dialog.tsx`

**Context:** `getRowKey` is a plain function defined inside the component — it gets a new reference on every render. When listed as a `useMemo`/`useEffect` dependency it creates infinite loop potential. Wrapping it in `useCallback` with `[]` deps gives it a stable reference (the function body has no external deps).

**Files:**
- Modify: `src/features/roles/components/role-permissions-dialog.tsx`

- [ ] **Step 1: Wrap `getRowKey` in `useCallback`**

Find the declaration (around line 192):
```tsx
const getRowKey = (r: PermissionLike) => String(r.id ?? r.name);
```

Replace with:
```tsx
const getRowKey = useCallback((r: PermissionLike) => String(r.id ?? r.name), []);
```

Make sure `useCallback` is imported from `"react"` (check existing imports — add if missing).

- [ ] **Step 2: Verify**

Run: `pnpm exec biome check src/features/roles/components/role-permissions-dialog.tsx`

Expected: No `useExhaustiveDependencies` errors.

- [ ] **Step 3: Commit**

```bash
git add src/features/roles/components/role-permissions-dialog.tsx
git commit -m "fix(lint): stabilize getRowKey with useCallback in role-permissions-dialog"
```

---

### Task 5: Fix `useExhaustiveDependencies` and `useButtonType` in `user-role-dialog.tsx`

**Context:** Same `getRowKey` problem as Task 4 (lines 231, 257). Additionally, a bare `<button>` at line 387 is missing an explicit `type` prop — browsers default to `type="submit"` which submits forms unexpectedly.

**Files:**
- Modify: `src/features/users/components/user-role-dialog.tsx`

- [ ] **Step 1: Wrap `getRowKey` in `useCallback`**

Find the declaration (around line 217):
```tsx
const getRowKey = (r: RoleDTO) => String(r.id ?? r.name);
```

Replace with:
```tsx
const getRowKey = useCallback((r: RoleDTO) => String(r.id ?? r.name), []);
```

Make sure `useCallback` is imported from `"react"`.

- [ ] **Step 2: Add `type="button"` to the clear-filter button (line ~387)**

Find:
```tsx
<button
  className="text-muted-foreground/80 hover:text-foreground ..."
  aria-label="Clear filter"
  onClick={() => {
```

Add `type="button"`:
```tsx
<button
  type="button"
  className="text-muted-foreground/80 hover:text-foreground ..."
  aria-label="Clear filter"
  onClick={() => {
```

- [ ] **Step 3: Verify**

Run: `pnpm exec biome check src/features/users/components/user-role-dialog.tsx`

Expected: No `useExhaustiveDependencies` or `useButtonType` errors.

- [ ] **Step 4: Commit**

```bash
git add src/features/users/components/user-role-dialog.tsx
git commit -m "fix(lint): useCallback for getRowKey and add button type in user-role-dialog"
```

---

### Task 6: Fix a11y interactive div issues (3 files)

**Context:** `user-details.tsx:191`, `user-profile.tsx:249`, and `user-signature.tsx:104` all have `<div onClick={...}>` without keyboard support. This breaks keyboard-only navigation. Fix by adding `role="button"`, `tabIndex={0}`, and an `onKeyDown` handler that fires on `Enter` or `Space`.

> **Note (Composition Patterns skill):** The semantically ideal pattern for a file-upload trigger is `<label htmlFor="hidden-input-id">` wrapping the styled area — this gives native keyboard + screen-reader behavior for free. That's a UI refactor out of scope for this lint fix; the `role="button"` approach is correct and sufficient here.

**Files:**
- Modify: `src/features/users/components/user-details.tsx:191`
- Modify: `src/features/users/components/user-profile.tsx:249`
- Modify: `src/features/users/components/user-signature.tsx:104`

- [ ] **Step 1: Fix `user-details.tsx` avatar div (line 191)**

Find:
```tsx
<div
  className="relative group cursor-pointer"
  onClick={() => avatarInputRef.current?.click()}
>
```

Replace with:
```tsx
<div
  role="button"
  tabIndex={0}
  className="relative group cursor-pointer"
  onClick={() => avatarInputRef.current?.click()}
  onKeyDown={(e) => {
    if (e.key === "Enter" || e.key === " ") avatarInputRef.current?.click();
  }}
>
```

- [ ] **Step 2: Fix `user-profile.tsx` avatar div (line 249)**

Find:
```tsx
<div
  className="relative group cursor-pointer"
  onClick={() => avatarInputRef.current?.click()}
>
```

Replace with:
```tsx
<div
  role="button"
  tabIndex={0}
  className="relative group cursor-pointer"
  onClick={() => avatarInputRef.current?.click()}
  onKeyDown={(e) => {
    if (e.key === "Enter" || e.key === " ") avatarInputRef.current?.click();
  }}
>
```

- [ ] **Step 3: Fix `user-signature.tsx` signature div (line 104)**

Find:
```tsx
<div
  className="relative group cursor-pointer overflow-hidden rounded-lg border-2 border-dashed border-border hover:border-primary/50 transition-all bg-muted/20 hover:bg-muted/30"
  onClick={() => signatureInputRef.current?.click()}
>
```

Replace with:
```tsx
<div
  role="button"
  tabIndex={0}
  className="relative group cursor-pointer overflow-hidden rounded-lg border-2 border-dashed border-border hover:border-primary/50 transition-all bg-muted/20 hover:bg-muted/30"
  onClick={() => signatureInputRef.current?.click()}
  onKeyDown={(e) => {
    if (e.key === "Enter" || e.key === " ") signatureInputRef.current?.click();
  }}
>
```

- [ ] **Step 4: Verify all three files**

Run: `pnpm exec biome check src/features/users/components/user-details.tsx src/features/users/components/user-profile.tsx src/features/users/components/user-signature.tsx`

Expected: No `noStaticElementInteractions` or `useKeyWithClickEvents` errors.

- [ ] **Step 5: Commit**

```bash
git add src/features/users/components/user-details.tsx src/features/users/components/user-profile.tsx src/features/users/components/user-signature.tsx
git commit -m "fix(a11y): add keyboard support to interactive divs in user components"
```

---

### Task 7: Final verification

- [ ] **Step 1: Run full lint**

Run: `pnpm lint`

Expected: `Checked N files` with `Found 0 errors.` and exit code 0.

- [ ] **Step 2: Confirm TypeScript still compiles**

Run: `pnpm exec tsc --noEmit`

Expected: No type errors.
