# Profile Page Polish & A11y Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply accessibility hardening, status-toggle UX relocation, lazy tab content, page metadata, and dead-markup cleanup to the profile page — surgical follow-up to the predecessor plan.

**Architecture:** Seven small, mostly independent tasks targeting the components extracted by Tasks 7–8 of the predecessor plan (`UserProfileHeader`, `UserProfileAvatar`, `UserProfileEditableName`, `UserProfileTabs`, `UserProfileStatusDialog`). One new component (`UserProfileActionsMenu`), one new tiny utility (`TabLoading`), no new state stores.

**Tech Stack:** Next.js 15 App Router (RSC), React 19, TanStack Query v5, `@igrp/igrp-framework-react-design-system` (Radix-based wrappers), Vitest + React Testing Library, `@igrp/platform-access-management-client-ts`.

**Precondition:** Tasks 7–12 of `docs/superpowers/plans/2026-05-26-profile-page-review-fixes.md` MUST be complete before this plan starts. This plan assumes the following files exist:

- `src/features/users/components/user-profile-avatar.tsx`
- `src/features/users/components/user-profile-header.tsx`
- `src/features/users/components/user-profile-tabs.tsx`
- `src/features/users/components/user-profile-editable-name.tsx`
- `src/features/users/components/user-profile-status-dialog.tsx`
- `src/features/users/components/user-profile.tsx` (slimmed orchestrator: contains `UserProfile` for gating + `UserProfileView` for the authenticated render path)
- `src/features/users/hooks/use-user-profile-actions.ts` (extracts `saveName`, `uploadAvatar`, `setStatus` mutation handlers)

If any of those are missing, STOP and finish the predecessor plan first.

**Note on Task 8 deviation:** The predecessor plan's Task 8 was executed with a deviation — mutation handlers were extracted into a hook (`useUserProfileActions`) rather than living inline in the container. This plan accommodates that: Task 3 below extends the hook to expose `isUpdating` and reads it from `UserProfileView` instead of destructuring `useUpdateUser()` directly.

---

## File Structure

**Modify**

- `src/app/(igrp)/(home)/profile/page.tsx` — add `metadata`, drop `force-dynamic`.
- `src/features/users/components/user-profile-header.tsx` — accept `actions` prop; render actions slot in name row; delete dead `<div className="relative">` + `<div className="absolute inset-0 …" />` wrappers; drop inline status button.
- `src/features/users/components/user-profile.tsx` — compose `<UserProfileActionsMenu />` into `<UserProfileHeader actions={…} />` inside `UserProfileView`; read `isUpdating` from `useUserProfileActions`.
- `src/features/users/hooks/use-user-profile-actions.ts` — additionally return `isUpdating` (mapped from `useUpdateUser().isPending`).
- `src/features/users/components/user-profile-avatar.tsx` — `aria-label="Alterar avatar"`, `alt` fallback chain, `disabled={isUploading || isResolvingUrl}` on trigger + file input.
- `src/features/users/components/user-profile-editable-name.tsx` — `maxLength` prop, internal `saving` and `error` state, inline `aria-live` error, re-throw to parent.
- `src/features/users/components/user-profile-tabs.tsx` — each tab content wrapped in `next/dynamic({ ssr: false, loading: TabLoading })`.

**Create**

- `src/features/users/components/user-profile-actions-menu.tsx`
- `src/features/users/components/tab-loading.tsx`
- `src/__tests__/users/components/user-profile-actions-menu.test.tsx`

---

## Phase 1 — Status toggle relocation

### Task 1: Verify `DropdownMenu` primitives are exported by the design system

**Files:** investigation only

The plan assumes `DropdownMenu`, `DropdownMenuTrigger`, `DropdownMenuContent`, `DropdownMenuItem` are exported from `@igrp/igrp-framework-react-design-system`. Verify before building Task 2 on that assumption.

- [ ] **Step 1:** Confirm exports

Run:

```powershell
node -e "console.log(Object.keys(require('@igrp/igrp-framework-react-design-system')).filter(k => k.toLowerCase().includes('dropdown')))"
```

Expected output: at least `DropdownMenu`, `DropdownMenuTrigger`, `DropdownMenuContent`, `DropdownMenuItem`.

- [ ] **Step 2:** Decide path forward

If all four are exported → continue to Task 2 with these imports.
If missing → stop and report. Two fallback options:
  (a) use `@radix-ui/react-dropdown-menu` directly with local styling
  (b) build via the shadcn `dropdown-menu` registry component

Do NOT proceed past Task 2 until this is settled. No commit needed for this task.

---

### Task 2: Create `UserProfileActionsMenu` (TDD)

**Files:**
- Create: `src/features/users/components/user-profile-actions-menu.tsx`
- Create: `src/__tests__/users/components/user-profile-actions-menu.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/__tests__/users/components/user-profile-actions-menu.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import { UserProfileActionsMenu } from "@/features/users/components/user-profile-actions-menu";

it("calls onToggleStatus with the destructive item when active", async () => {
  const onToggleStatus = vi.fn();
  render(
    <UserProfileActionsMenu
      isActive={true}
      isPending={false}
      onToggleStatus={onToggleStatus}
    />,
  );

  await userEvent.click(screen.getByRole("button", { name: /ações do utilizador/i }));
  await userEvent.click(screen.getByRole("menuitem", { name: /desativar/i }));

  expect(onToggleStatus).toHaveBeenCalledTimes(1);
});

it("calls onToggleStatus with the activate label when inactive", async () => {
  const onToggleStatus = vi.fn();
  render(
    <UserProfileActionsMenu
      isActive={false}
      isPending={false}
      onToggleStatus={onToggleStatus}
    />,
  );

  await userEvent.click(screen.getByRole("button", { name: /ações do utilizador/i }));
  await userEvent.click(screen.getByRole("menuitem", { name: /ativar/i }));

  expect(onToggleStatus).toHaveBeenCalledTimes(1);
});

it("disables the menu item while isPending", async () => {
  const onToggleStatus = vi.fn();
  render(
    <UserProfileActionsMenu
      isActive={true}
      isPending={true}
      onToggleStatus={onToggleStatus}
    />,
  );

  await userEvent.click(screen.getByRole("button", { name: /ações do utilizador/i }));
  const item = screen.getByRole("menuitem", { name: /desativar/i });
  expect(item).toHaveAttribute("data-disabled");
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```powershell
pnpm vitest run src/__tests__/users/components/user-profile-actions-menu.test.tsx
```

Expected: FAIL — module `@/features/users/components/user-profile-actions-menu` does not exist.

- [ ] **Step 3: Implement the component**

Create `src/features/users/components/user-profile-actions-menu.tsx`:

```tsx
"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  IGRPButton,
  IGRPIcon,
} from "@igrp/igrp-framework-react-design-system";

export interface UserProfileActionsMenuProps {
  isActive: boolean;
  isPending: boolean;
  onToggleStatus: () => void;
}

export function UserProfileActionsMenu({
  isActive,
  isPending,
  onToggleStatus,
}: UserProfileActionsMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <IGRPButton
          variant="ghost"
          size="icon"
          aria-label="Ações do utilizador"
          disabled={isPending}
        >
          <IGRPIcon iconName="MoreHorizontal" className="w-4 h-4" />
        </IGRPButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          disabled={isPending}
          onSelect={onToggleStatus}
          className={
            isActive
              ? "text-destructive focus:text-destructive"
              : undefined
          }
        >
          <IGRPIcon
            iconName={isActive ? "Ban" : "Check"}
            className="w-4 h-4 mr-2"
          />
          {isActive ? "Desativar" : "Ativar"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run:

```powershell
pnpm vitest run src/__tests__/users/components/user-profile-actions-menu.test.tsx
```

Expected: PASS (3 tests).

If the `data-disabled` attribute assertion fails because the design system uses a different disabled marker, change the assertion to `expect(item).toBeDisabled()` or inspect via `aria-disabled`. Don't bypass the test — verify the actual disabled behavior matches the DS.

- [ ] **Step 5: Commit**

```powershell
git add src/features/users/components/user-profile-actions-menu.tsx src/__tests__/users/components/user-profile-actions-menu.test.tsx
git commit -m "feat(profile): add UserProfileActionsMenu"
```

---

### Task 3: Wire actions menu into header; remove inline status button; delete dead wrappers

**Files:**
- Modify: `src/features/users/components/user-profile-header.tsx`
- Modify: `src/features/users/components/user-profile.tsx`

- [ ] **Step 1: Update `UserProfileHeader` to accept `actions` slot**

Open `src/features/users/components/user-profile-header.tsx`. Adjust the props interface:

```ts
export interface UserProfileHeaderProps {
  user: IGRPUserDTO;
  avatarUrl: string | null;
  isResolvingAvatar: boolean;
  isUploadingAvatar: boolean;
  onUploadAvatar: (file: File) => Promise<void>;
  onSaveName: (next: string) => Promise<void>;
  actions?: React.ReactNode;
}
```

Note: `isActive` and `onToggleStatus` props are REMOVED from the header. The status toggle now lives in the actions slot passed by the container.

- [ ] **Step 2: Rewrite the header body**

Replace the `UserProfileHeader` JSX with:

```tsx
export function UserProfileHeader(props: UserProfileHeaderProps) {
  const {
    user, avatarUrl, isResolvingAvatar, isUploadingAvatar,
    onUploadAvatar, onSaveName, actions,
  } = props;

  return (
    <Card className="py-2 border-0 shadow-sm">
      <CardContent className="px-4 py-1">
        <div className="flex items-center gap-6">
          <UserProfileAvatar
            user={user}
            resolvedUrl={avatarUrl}
            isResolvingUrl={isResolvingAvatar}
            isUploading={isUploadingAvatar}
            onUpload={onUploadAvatar}
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <UserProfileEditableName
                name={user.name || user.username || ""}
                fallback="N/A"
                onSave={onSaveName}
              />
              {actions ? <div className="ml-auto">{actions}</div> : null}
            </div>
            <p className="text-muted-foreground">{user.email}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
```

Note what changed:
- Outer `<div className="relative">` wrapper and the dead `<div className="absolute inset-0 rounded-xl -z-10" />` are GONE.
- The inline `<div className="flex items-center mb-2 justify-end gap-2">` block holding the destructive status button is GONE.
- The name row is now a flex container; `actions` renders right-aligned via `ml-auto`.

- [ ] **Step 3: Extend `useUserProfileActions` to expose `isUpdating`**

Open `src/features/users/hooks/use-user-profile-actions.ts`. Change the `useUpdateUser()` destructure and the return object so `isPending` from the update mutation is exposed:

```ts
const { mutateAsync: updateUser, isPending: isUpdating } = useUpdateUser();
// …existing handlers unchanged…
return {
  saveName,
  uploadAvatar,
  setStatus,
  isUploadingAvatar: uploadFile.isPending,
  isUpdating,
};
```

- [ ] **Step 4: Update `UserProfileView` to pass actions**

Open `src/features/users/components/user-profile.tsx`. Inside `UserProfileView` (the component that renders when `user` is non-null), import the new menu and read `isUpdating` from the hook:

```tsx
import { UserProfileActionsMenu } from "./user-profile-actions-menu";
```

```tsx
const { saveName, uploadAvatar, setStatus, isUploadingAvatar, isUpdating } =
  useUserProfileActions(user);
```

In the JSX, replace the current `<UserProfileHeader … onToggleStatus={…}>` call with the new shape (no `isActive`/`onToggleStatus` props on the header; the menu carries them):

```tsx
<UserProfileHeader
  user={user}
  avatarUrl={avatarFile?.url ?? null}
  isResolvingAvatar={isLoadingAvatar}
  isUploadingAvatar={isUploadingAvatar}
  onUploadAvatar={uploadAvatar}
  onSaveName={saveName}
  actions={
    <UserProfileActionsMenu
      isActive={isActive}
      isPending={isUpdating}
      onToggleStatus={() => setShowStatusDialog(true)}
    />
  }
/>
```

- [ ] **Step 5: Verify**

Run:

```powershell
pnpm exec tsc --noEmit
pnpm vitest run src/__tests__/users
```

Expected: typecheck clean for the changed files; users test suite passes (modulo pre-existing failures unrelated to this change).

- [ ] **Step 6: Manual smoke**

Run `pnpm dev`. Visit `/profile`. Confirm:
- No top-right inline button anymore.
- Three-dot menu appears next to the name; clicking it shows "Desativar" (or "Ativar") with destructive coloring when active.
- Selecting the menu item opens the existing `UserProfileStatusDialog`.

- [ ] **Step 7: Commit**

```powershell
git add src/features/users/components/user-profile-header.tsx src/features/users/components/user-profile.tsx src/features/users/hooks/use-user-profile-actions.ts
git commit -m "refactor(profile): relocate status toggle into actions menu; remove dead header wrappers"
```

---

## Phase 2 — Accessibility

### Task 4: Avatar accessibility patch

**Files:**
- Modify: `src/features/users/components/user-profile-avatar.tsx`
- Modify: `src/__tests__/users/components/user-profile-avatar.test.tsx`

- [ ] **Step 1: Add the new test cases**

Open `src/__tests__/users/components/user-profile-avatar.test.tsx`. Add at the end of the file (alongside existing tests):

```tsx
it("exposes aria-label and disables trigger while resolving URL", () => {
  render(
    <UserProfileAvatar
      user={baseUser}
      resolvedUrl={null}
      isResolvingUrl={true}
      isUploading={false}
      onUpload={vi.fn()}
    />,
  );

  const trigger = screen.getByRole("button", { name: /alterar avatar/i });
  expect(trigger).toBeDisabled();
});

it("falls back to username then email for alt text when name is empty", () => {
  const userNoName = { ...baseUser, name: "", username: "ana_u" } as never;
  render(
    <UserProfileAvatar
      user={userNoName}
      resolvedUrl="https://example.com/a.png"
      isResolvingUrl={false}
      isUploading={false}
      onUpload={vi.fn()}
    />,
  );

  const img = screen.getByRole("img", { hidden: true });
  expect(img).toHaveAttribute("alt", "ana_u");
});
```

If the existing test file does not already define `baseUser`, add at top:

```tsx
const baseUser = {
  id: "u1",
  name: "Ana",
  username: "ana",
  email: "a@x.cv",
  picture: null,
} as never;
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```powershell
pnpm vitest run src/__tests__/users/components/user-profile-avatar.test.tsx
```

Expected: FAIL — trigger not disabled when resolving, and alt text doesn't fall back.

- [ ] **Step 3: Patch `UserProfileAvatar`**

Open `src/features/users/components/user-profile-avatar.tsx`. Find the trigger `<button>` and the hidden `<input>`. Adjust:

```tsx
const disabled = isUploading || isResolvingUrl;
const altText = user.name || user.username || user.email || "Utilizador";

return (
  <button
    type="button"
    aria-label="Alterar avatar"
    disabled={disabled}
    className="relative group cursor-pointer p-0 border-0 bg-transparent disabled:opacity-60 disabled:cursor-not-allowed"
    onClick={() => inputRef.current?.click()}
  >
    <IGRPUserAvatar
      alt={altText}
      image={currentUrl}
      …
    />
    …
    <input
      ref={inputRef}
      type="file"
      accept="image/*"
      aria-label="Alterar avatar"
      onChange={handleChange}
      className="hidden"
      disabled={disabled}
    />
  </button>
);
```

Notes:
- The `aria-label` on the `<input>` exists already (per the predecessor plan's Task 7). If it's missing, add it.
- The `disabled={disabled}` change extends what was previously `disabled={isUploading}` only.

- [ ] **Step 4: Run test to verify it passes**

Run:

```powershell
pnpm vitest run src/__tests__/users/components/user-profile-avatar.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add src/features/users/components/user-profile-avatar.tsx src/__tests__/users/components/user-profile-avatar.test.tsx
git commit -m "fix(profile): a11y polish on avatar trigger (label, alt fallback, disabled)"
```

---

### Task 5: Editable name hardening (`maxLength`, `saving`, inline error)

**Files:**
- Modify: `src/features/users/components/user-profile-editable-name.tsx`
- Modify: `src/__tests__/users/components/user-profile-editable-name.test.tsx`

- [ ] **Step 1: Add the new test cases**

Open `src/__tests__/users/components/user-profile-editable-name.test.tsx`. Add at the end:

```tsx
it("respects maxLength on the input (default 120)", async () => {
  render(<UserProfileEditableName name="Old" onSave={vi.fn()} />);
  await userEvent.click(screen.getByRole("button", { name: /editar nome/i }));
  expect(screen.getByRole("textbox")).toHaveAttribute("maxLength", "120");
});

it("disables save while onSave is in flight", async () => {
  let resolveSave: () => void = () => {};
  const onSave = vi.fn().mockImplementation(
    () => new Promise<void>((r) => { resolveSave = r; }),
  );

  render(<UserProfileEditableName name="Old" onSave={onSave} />);
  await userEvent.click(screen.getByRole("button", { name: /editar nome/i }));
  const input = screen.getByRole("textbox");
  await userEvent.clear(input);
  await userEvent.type(input, "New");

  fireEvent.keyDown(input, { key: "Enter" });

  // While the promise is pending the save button should be disabled
  const save = await screen.findByRole("button", { name: /guardar nome/i });
  expect(save).toBeDisabled();

  resolveSave();
});

it("shows inline error when onSave rejects and stays in edit mode", async () => {
  const onSave = vi.fn().mockRejectedValue(new Error("nope"));
  render(<UserProfileEditableName name="Old" onSave={onSave} />);

  await userEvent.click(screen.getByRole("button", { name: /editar nome/i }));
  const input = screen.getByRole("textbox");
  await userEvent.clear(input);
  await userEvent.type(input, "New");
  fireEvent.keyDown(input, { key: "Enter" });

  const alert = await screen.findByRole("alert");
  expect(alert).toHaveTextContent("nope");
  expect(screen.getByRole("textbox")).toBeInTheDocument();
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run:

```powershell
pnpm vitest run src/__tests__/users/components/user-profile-editable-name.test.tsx
```

Expected: 3 new tests FAIL.

- [ ] **Step 3: Update the component**

Replace `src/features/users/components/user-profile-editable-name.tsx` with:

```tsx
"use client";

import {
  IGRPButton,
  IGRPIcon,
  IGRPInputText,
} from "@igrp/igrp-framework-react-design-system";
import { useState } from "react";

export interface UserProfileEditableNameProps {
  name: string;
  fallback?: string;
  maxLength?: number;
  onSave: (next: string) => Promise<void>;
}

export function UserProfileEditableName({
  name,
  fallback,
  maxLength = 120,
  onSave,
}: UserProfileEditableNameProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(name);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startEditing = () => {
    setDraft(name);
    setError(null);
    setEditing(true);
  };

  const cancel = () => {
    if (saving) return;
    setError(null);
    setEditing(false);
  };

  const commit = async () => {
    if (saving) return;
    const next = draft.trim();
    if (!next || next === name) {
      setEditing(false);
      setError(null);
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await onSave(next);
      setEditing(false);
    } catch (err) {
      setError((err as Error).message || "Erro ao guardar");
      throw err;
    } finally {
      setSaving(false);
    }
  };

  if (editing) {
    return (
      <div className="flex flex-col gap-1 mb-1">
        <div className="flex items-center gap-2">
          <IGRPInputText
            value={draft}
            maxLength={maxLength}
            disabled={saving}
            aria-invalid={!!error}
            aria-describedby={error ? "user-profile-name-error" : undefined}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setDraft(e.target.value)
            }
            onKeyDown={(e: React.KeyboardEvent) => {
              if (e.key === "Enter") void commit().catch(() => {});
              if (e.key === "Escape") cancel();
            }}
            className="text-2xl font-bold tracking-tight h-12"
            autoFocus
          />
          <IGRPButton
            size="sm"
            variant="ghost"
            onClick={() => void commit().catch(() => {})}
            disabled={saving}
            aria-label="Guardar nome"
          >
            <IGRPIcon
              iconName={saving ? "LoaderCircle" : "Check"}
              className={saving ? "w-4 h-4 animate-spin" : "w-4 h-4"}
            />
          </IGRPButton>
          <IGRPButton
            size="sm"
            variant="ghost"
            onClick={cancel}
            disabled={saving}
            aria-label="Cancelar edição"
          >
            <IGRPIcon iconName="X" className="w-4 h-4" />
          </IGRPButton>
        </div>
        {error ? (
          <p
            id="user-profile-name-error"
            role="alert"
            aria-live="polite"
            className="text-sm text-destructive"
          >
            {error}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 mb-1 group">
      <h1 className="text-2xl font-bold tracking-tight">
        {name || fallback || "N/A"}
      </h1>
      <IGRPButton
        size="sm"
        variant="ghost"
        onClick={startEditing}
        aria-label="Editar nome"
      >
        <IGRPIcon iconName="Pencil" className="w-4 h-4" />
      </IGRPButton>
    </div>
  );
}
```

Behavior notes for reviewers:
- `commit` re-throws on failure, so the container's `onSave` toast still fires (unchanged contract).
- Both the on-click and on-Enter paths swallow the re-thrown error with `.catch(() => {})` to avoid unhandled-rejection noise; the error is captured in component state via the catch block.
- Escape and Cancel are no-ops while `saving` — the user cannot exit a pending mutation.
- Input height bumped from `h-10` to `h-12` to fit the 2xl text (addresses a visual-polish item from the review).

- [ ] **Step 4: Run tests to verify they pass**

Run:

```powershell
pnpm vitest run src/__tests__/users/components/user-profile-editable-name.test.tsx
```

Expected: all tests (including the original three) PASS.

- [ ] **Step 5: Commit**

```powershell
git add src/features/users/components/user-profile-editable-name.tsx src/__tests__/users/components/user-profile-editable-name.test.tsx
git commit -m "feat(profile): editable name maxLength, saving state, inline error"
```

---

## Phase 3 — Lazy tab content

### Task 6: Create `TabLoading` and lazy-load tab content

**Files:**
- Create: `src/features/users/components/tab-loading.tsx`
- Modify: `src/features/users/components/user-profile-tabs.tsx`

- [ ] **Step 1: Create the loading shim**

Create `src/features/users/components/tab-loading.tsx`:

```tsx
import { AppCenterLoading } from "@/components/loading";

export function TabLoading() {
  return <AppCenterLoading description="Carregando..." />;
}
```

- [ ] **Step 2: Rewrite `user-profile-tabs.tsx` with `next/dynamic`**

Replace `src/features/users/components/user-profile-tabs.tsx` with:

```tsx
"use client";

import {
  type IGRPTabItem,
  IGRPTabs,
} from "@igrp/igrp-framework-react-design-system";
import type { IGRPUserDTO } from "@igrp/platform-access-management-client-ts";
import dynamic from "next/dynamic";
import { useMemo } from "react";
import { TabLoading } from "./tab-loading";

const DepartmentListSimple = dynamic(
  () =>
    import("@/features/departments/components/dept-list-simple-container").then(
      (m) => m.DepartmentListSimple,
    ),
  { ssr: false, loading: () => <TabLoading /> },
);

const UserApplications = dynamic(() => import("./user-applications"), {
  ssr: false,
  loading: () => <TabLoading />,
});

const ProfileRoleList = dynamic(
  () => import("@/features/profile/components/profile-role-list"),
  { ssr: false, loading: () => <TabLoading /> },
);

const UserSignature = dynamic(() => import("./user-signature"), {
  ssr: false,
  loading: () => <TabLoading />,
});

export interface UserProfileTabsProps {
  user: IGRPUserDTO;
  onUserChange: () => void;
}

export function UserProfileTabs({ user, onUserChange }: UserProfileTabsProps) {
  const tabs = useMemo<IGRPTabItem[]>(
    () => [
      { label: "Departamentos", value: "departments", content: <DepartmentListSimple /> },
      { label: "Aplicações", value: "applications", content: <UserApplications /> },
      { label: "Roles", value: "roles", content: <ProfileRoleList /> },
      {
        label: "Assinatura",
        value: "signature",
        content: <UserSignature refetch={onUserChange} user={user} />,
      },
    ],
    [user, onUserChange],
  );

  return (
    <IGRPTabs
      defaultValue="departments"
      items={tabs}
      className="min-w-0"
      tabContentClassName="px-0"
      orientation="horizontal"
    />
  );
}
```

Watchpoints:
- `UserApplications` and `UserSignature` were `default` exports in the predecessor codebase — confirm with `grep "export default" src/features/users/components/user-applications.tsx`. If they are NAMED exports, change `import("./user-applications")` to `import("./user-applications").then(m => m.UserApplications)`.
- `ProfileRoleList`'s export shape: if `export default`, the snippet above works as-is. If named, adjust similarly.
- `DepartmentListSimple` is a named export per the predecessor plan — already handled.

- [ ] **Step 3: Typecheck and smoke**

Run:

```powershell
pnpm exec tsc --noEmit
pnpm vitest run src/__tests__/users
```

Expected: no new TS errors for `user-profile-tabs.tsx`; users tests pass.

Then `pnpm dev` → visit `/profile` → click each tab. Each tab should briefly show the `TabLoading` indicator on first activation, then render the tab content.

- [ ] **Step 4: Commit**

```powershell
git add src/features/users/components/tab-loading.tsx src/features/users/components/user-profile-tabs.tsx
git commit -m "perf(profile): lazy-load tab content via next/dynamic"
```

---

## Phase 4 — Page polish

### Task 7: Add `metadata`, drop `force-dynamic`

**Files:**
- Modify: `src/app/(igrp)/(home)/profile/page.tsx`

**Precondition for this task specifically:** Task 10 of the predecessor plan must be complete (the page is already an RSC with `HydrationBoundary`-wrapped prefetch). If `page.tsx` is still the simple client wrapper, finish predecessor Task 10 first.

- [ ] **Step 1: Add metadata, drop force-dynamic**

Open `src/app/(igrp)/(home)/profile/page.tsx`.

Remove the line:

```ts
export const dynamic = "force-dynamic";
```

(It will not be present if predecessor Task 10 has landed — in that case this step is a no-op for that line, just verify it's gone.)

Add above the default export:

```ts
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Perfil",
};
```

- [ ] **Step 2: Verify**

Run:

```powershell
pnpm exec tsc --noEmit
pnpm dev
```

Visit `/profile`. The browser tab title should show "Perfil" (or whatever your root `layout.tsx` template formats it to).

- [ ] **Step 3: Commit**

```powershell
git add src/app/(igrp)/(home)/profile/page.tsx
git commit -m "feat(profile): add metadata title; drop force-dynamic"
```

---

## Self-Review

- [ ] **Spec coverage:** Every spec section maps to tasks:
  - `UserProfileActionsMenu` (spec) → Tasks 1, 2, 3
  - `UserProfileHeader` modify + dead-markup deletion → Task 3
  - `UserProfileAvatar` a11y patch → Task 4
  - `UserProfileEditableName` hardening → Task 5
  - `UserProfileTabs` + `TabLoading` lazy load → Task 6
  - `page.tsx` metadata + `force-dynamic` removal → Task 7
  - Testing additions (3 in editable-name, 1+1 in avatar, 3 new in actions-menu) all covered
  - Risks documented in spec (DropdownMenu availability, SSR-off, sequencing) → Task 1 verifies DS exports; Task 7 calls out predecessor-Task-10 precondition

- [ ] **Placeholder scan:** No `TBD`/`TODO`/`implement later`/`similar to Task N` strings. Every step shows the actual code or command.

- [ ] **Type consistency:** `UserProfileActionsMenuProps.{isActive, isPending, onToggleStatus}` used identically in Tasks 2 and 3. `UserProfileHeaderProps.actions: React.ReactNode` defined in Task 3 step 1 and consumed in step 3. `UserProfileEditableNameProps.maxLength?: number` defined in Task 5 step 3 and asserted in test step 1.

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-05-26-profile-page-polish-and-a11y.md`. Two execution options:

1. **Subagent-Driven (recommended)** — Fresh subagent per task with two-stage review.
2. **Inline Execution** — Execute in this session via executing-plans.

Which approach?
