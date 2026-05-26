# Profile Page Review Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Resolve all P0–P3 issues identified in the review of `src/app/(igrp)/(home)/profile/page.tsx` and `src/features/users/components/user-profile.tsx`: fix bugs, eliminate derived-state effects, decompose the 400-line client component, optionally migrate the page to a server component with TanStack Query hydration, and apply small design-system / a11y / i18n polish.

**Architecture:** The current `UserProfile` is a single client component that owns four unrelated concerns (header card, avatar upload, inline name edit, status toggle dialog) and a 4-tab body. This plan splits it into focused child components, removes two `useEffect`s that re-derive state, makes mutation cache invalidation consistent at the hook layer (`useUpdateUser`), and adds a server component shell that prefetches the current user via `HydrationBoundary`.

**Tech Stack:** Next.js 15 App Router (RSC), React 19, TanStack Query v5, `@igrp/igrp-framework-react-design-system`, Vitest + React Testing Library, `@igrp/platform-access-management-client-ts`.

---

## File Structure

**Modify**
- `src/features/users/components/user-profile.tsx` — becomes a thin container that composes the new child components (≤ 80 lines).
- `src/features/users/use-users.ts` — `useUpdateUser` invalidates `["current-user"]` in addition to `["users"]`.
- `src/app/(igrp)/(home)/profile/page.tsx` — server component that prefetches the current user; wraps the client tree in `<HydrationBoundary>`.
- `src/providers/query-provider.tsx` — export a server-only `getQueryClient()` helper used by the page.

**Create**
- `src/features/users/components/user-profile-header.tsx` — layout card; receives `user` as prop.
- `src/features/users/components/user-profile-avatar.tsx` — owns the file input and upload mutation.
- `src/features/users/components/user-profile-editable-name.tsx` — owns the inline-edit state.
- `src/features/users/components/user-profile-status-dialog.tsx` — owns the confirm-dialog state.
- `src/features/users/components/user-profile-tabs.tsx` — extracts the tab section.
- `src/__tests__/users/components/user-profile-editable-name.test.tsx`
- `src/__tests__/users/components/user-profile-status-dialog.test.tsx`
- `src/__tests__/users/components/user-profile-avatar.test.tsx`

Each new file has one responsibility. Tests cover only the units with behavior worth pinning (state machines and async flows); the pure layout pieces are exercised indirectly.

---

## Phase 1 — P0 bug fixes (no behavioral changes beyond the bug)

These three fixes are independent and each lands as its own commit so they can be cherry-picked into release branches if needed.

### Task 1: Reorder error / loading / not-found guards

**Files:**
- Modify: `src/features/users/components/user-profile.tsx:70-83`

The `if (userError) throw userError` line is currently unreachable because `if (!user) return …` short-circuits first whenever a query errors (TanStack Query yields `data: undefined` + `error: <Error>` after `retry: false`). The error boundary above never sees the throw.

- [ ] **Step 1: Write the failing test**

Create `src/__tests__/users/components/user-profile-error-guard.test.tsx`:

```tsx
import { render } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { vi } from "vitest";
import { UserProfile } from "@/features/users/components/user-profile";

vi.mock("@/features/users/use-users", () => ({
  useCurrentUser: () => ({
    data: undefined,
    isLoading: false,
    error: new Error("boom"),
    refetch: vi.fn(),
  }),
  useUpdateUser: () => ({ mutateAsync: vi.fn() }),
}));
vi.mock("@/features/files/use-files", () => ({
  useFiles: () => ({ data: undefined, isLoading: false }),
  useUploadPublicFiles: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

it("throws when the current-user query errors", () => {
  const client = new QueryClient();
  const spy = vi.spyOn(console, "error").mockImplementation(() => {});
  expect(() =>
    render(
      <QueryClientProvider client={client}>
        <UserProfile />
      </QueryClientProvider>,
    ),
  ).toThrow("boom");
  spy.mockRestore();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/__tests__/users/components/user-profile-error-guard.test.tsx`
Expected: FAIL — the component renders `AppCenterNotFound` instead of throwing.

- [ ] **Step 3: Reorder guards**

Replace the block at lines 70-83 with:

```tsx
  if (userError) throw userError;

  if (isLoading) {
    return <AppCenterLoading description="Carregando utilizador..." />;
  }

  if (!user) {
    return (
      <AppCenterNotFound
        iconName="User"
        title="Nenhum utilizador encontrado."
      />
    );
  }
```

(Note: also fixes the gender typo "encontrada" → "encontrado".)

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run src/__tests__/users/components/user-profile-error-guard.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add src/features/users/components/user-profile.tsx src/__tests__/users/components/user-profile-error-guard.test.tsx
git commit -m "fix(profile): throw user query error before not-found guard"
```

---

### Task 2: Fix `cn` precedence bug on avatar overlay spinner

**Files:**
- Modify: `src/features/users/components/user-profile.tsx:278-289`

Currently:

```tsx
className={cn(
  "w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors",
  isLoadingFile || (uploadFile.isPending && "animate-spin"),
)}
```

`||` has lower precedence than `&&`, so this evaluates to `isLoadingFile || (pendingClass-or-false)`. When `isLoadingFile` is `true`, the second `cn` argument is just `true` — no spin class is applied even though the icon is `LoaderCircle`. The icon shows static.

- [ ] **Step 1: Apply the fix**

Replace the block at lines 278-289 with:

```tsx
<IGRPIcon
  iconName={
    isLoadingFile || uploadFile.isPending
      ? "LoaderCircle"
      : "Camera"
  }
  className={cn(
    "w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors",
    (isLoadingFile || uploadFile.isPending) && "animate-spin",
  )}
/>
```

- [ ] **Step 2: Verify build**

Run: `pnpm typecheck`
Expected: no new errors.

- [ ] **Step 3: Commit**

```powershell
git add src/features/users/components/user-profile.tsx
git commit -m "fix(profile): apply spin animation when avatar is loading or uploading"
```

(No unit test — this is a pure CSS-class precedence fix; covered by visual inspection during the avatar refactor in Phase 3.)

---

### Task 3: Eliminate avatar state race

**Files:**
- Modify: `src/features/users/components/user-profile.tsx:44-62, 87-127`

The current avatar flow is racy:

```tsx
useFiles(user?.picture || uploadedAvatarPath || "")  // depends on either
useEffect(() => { if (avatarUrl) setAvatarPreview(avatarUrl.url); ... }, [avatarUrl])
```

After upload we set `uploadedAvatarPath`, the file query refires, `updateUser` runs with the new picture, `refetch()` updates `user.picture`, and the file query refires again with the new path. Two source-of-truth pointers (`user.picture` and `uploadedAvatarPath`) plus a derived-state effect.

Replace with a single source of truth (`user.picture`) plus an optional object-URL preview shown only while the upload is in flight.

- [ ] **Step 1: Write the failing test**

Create `src/__tests__/users/components/user-profile-avatar.test.tsx` with a scenario that uploads, then asserts the avatar URL is taken from `user.picture` (not the stale `uploadedAvatarPath`). Because Phase 3 extracts a real `UserProfileAvatar` component, this test is fleshed out there — for now create a placeholder that imports and renders the component once it exists:

```tsx
import { describe, it } from "vitest";

describe.todo("UserProfileAvatar", () => {
  it.todo("shows object URL preview while uploading");
  it.todo("shows user.picture URL after upload completes");
  it.todo("clears object URL preview on error");
});
```

- [ ] **Step 2: Apply minimum surgical fix in current file**

In `user-profile.tsx`:

1. Delete the `uploadedAvatarPath` state (lines 47-49) and the `avatarPreview` state (line 51) and the `useEffect` at lines 57-62.
2. Change the `useFiles` call to depend only on `user?.picture`:

```tsx
const { data: avatarFile, isLoading: isLoadingFile } = useFiles(user?.picture ?? "");
```

3. Introduce a local object-URL preview that is only set while the upload mutation is pending:

```tsx
const [localPreview, setLocalPreview] = useState<string | null>(null);
useEffect(() => () => { if (localPreview) URL.revokeObjectURL(localPreview); }, [localPreview]);

const currentAvatarUrl = localPreview ?? avatarFile?.url ?? null;
```

4. Update `handleAvatarChange`:

```tsx
const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;

  const preview = URL.createObjectURL(file);
  setLocalPreview(preview);

  try {
    const path = await uploadFile.mutateAsync({
      file,
      options: { folder: `users/${user.id}/avatar` },
    });

    const res = await updateUser({
      id: user.id,
      user: { ...user, picture: path },
    });

    if (!res.success) throw new Error(res.error);

    igrpToast({ type: "success", title: "Avatar atualizado com sucesso", duration: 4000 });
  } catch (err) {
    igrpToast({
      type: "error",
      title: "Erro ao atualizar avatar",
      description: (err as Error).message,
      duration: 4000,
    });
  } finally {
    URL.revokeObjectURL(preview);
    setLocalPreview(null);
  }
};
```

Note: do **not** add `refetch()` here. Phase 2 makes `useUpdateUser` invalidate `["current-user"]` automatically. Until Phase 2 lands, keep a single `await queryClient.invalidateQueries({ queryKey: ["current-user"] })` before `setLocalPreview(null)`.

- [ ] **Step 3: Run the type checker and the existing profile test suite**

Run: `pnpm typecheck && pnpm vitest run src/__tests__/users/components/user-profile-error-guard.test.tsx`
Expected: PASS.

- [ ] **Step 4: Commit**

```powershell
git add src/features/users/components/user-profile.tsx src/__tests__/users/components/user-profile-avatar.test.tsx
git commit -m "fix(profile): eliminate avatar state race; use object-URL preview during upload"
```

---

## Phase 2 — Mutation hook consolidation

### Task 4: `useUpdateUser` invalidates `["current-user"]`

**Files:**
- Modify: `src/features/users/use-users.ts:179-195`

Right now `useUpdateUser`'s `onSuccess` only refetches `["users"]`, so every caller that mutates the current user has to manually invalidate `["current-user"]`. Centralise it.

- [ ] **Step 1: Write the failing test**

Create `src/__tests__/users/hooks/use-update-user.test.tsx`:

```tsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import { useUpdateUser } from "@/features/users/use-users";

vi.mock("@/actions/user", () => ({
  updateUser: vi.fn().mockResolvedValue({ success: true, data: { id: "u1" } }),
}));

it("invalidates current-user after a successful update", async () => {
  const client = new QueryClient();
  const spy = vi.spyOn(client, "invalidateQueries");
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );

  const { result } = renderHook(() => useUpdateUser(), { wrapper });
  await act(async () => {
    await result.current.mutateAsync({ id: "u1", user: { id: "u1" } as never });
  });

  await waitFor(() =>
    expect(spy).toHaveBeenCalledWith({ queryKey: ["current-user"] }),
  );
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm vitest run src/__tests__/users/hooks/use-update-user.test.tsx`
Expected: FAIL — `invalidateQueries` not called with `["current-user"]`.

- [ ] **Step 3: Update the hook**

Replace lines 179-195 with:

```tsx
export const useUpdateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, user }: { id: string; user: IGRPUserDTO }) =>
      updateUser(id, user),
    onSuccess: async (result) => {
      if (result.success) {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ["current-user"] }),
          queryClient.refetchQueries({ queryKey: ["users"], type: "active" }),
        ]);
      }
    },
    retry: false,
  });
};
```

- [ ] **Step 4: Remove redundant invalidations in `user-profile.tsx`**

Delete every `await queryClient.invalidateQueries({ queryKey: ["current-user"] })` and the `useQueryClient()` import in the component. Also remove the `refetch()` call from `handleAvatarChange` (the hook handles it).

- [ ] **Step 5: Run tests**

Run: `pnpm vitest run src/__tests__/users src/features/users`
Expected: PASS.

- [ ] **Step 6: Commit**

```powershell
git add src/features/users/use-users.ts src/features/users/components/user-profile.tsx src/__tests__/users/hooks/use-update-user.test.tsx
git commit -m "refactor(users): centralize current-user invalidation in useUpdateUser"
```

---

## Phase 3 — Component decomposition

The container becomes a thin orchestrator. State that belongs to one section moves into that section so keystrokes in the name input don't re-render the avatar / dialog / tabs.

### Task 5: Extract `UserProfileEditableName`

**Files:**
- Create: `src/features/users/components/user-profile-editable-name.tsx`
- Create: `src/__tests__/users/components/user-profile-editable-name.test.tsx`
- Modify: `src/features/users/components/user-profile.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// src/__tests__/users/components/user-profile-editable-name.test.tsx
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import { UserProfileEditableName } from "@/features/users/components/user-profile-editable-name";

it("submits the trimmed name on Enter and exits edit mode", async () => {
  const onSave = vi.fn().mockResolvedValue(undefined);
  render(<UserProfileEditableName name="Old" onSave={onSave} />);

  await userEvent.click(screen.getByRole("button", { name: /editar nome/i }));
  const input = screen.getByRole("textbox");
  await userEvent.clear(input);
  await userEvent.type(input, "  New Name  ");
  fireEvent.keyDown(input, { key: "Enter" });

  expect(onSave).toHaveBeenCalledWith("New Name");
});

it("does not call onSave when the name is unchanged", async () => {
  const onSave = vi.fn();
  render(<UserProfileEditableName name="Same" onSave={onSave} />);
  await userEvent.click(screen.getByRole("button", { name: /editar nome/i }));
  fireEvent.keyDown(screen.getByRole("textbox"), { key: "Enter" });
  expect(onSave).not.toHaveBeenCalled();
});

it("cancels with Escape", async () => {
  render(<UserProfileEditableName name="Old" onSave={vi.fn()} />);
  await userEvent.click(screen.getByRole("button", { name: /editar nome/i }));
  fireEvent.keyDown(screen.getByRole("textbox"), { key: "Escape" });
  expect(screen.queryByRole("textbox")).toBeNull();
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm vitest run src/__tests__/users/components/user-profile-editable-name.test.tsx`
Expected: FAIL — module does not exist.

- [ ] **Step 3: Implement the component**

```tsx
// src/features/users/components/user-profile-editable-name.tsx
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
  onSave: (next: string) => Promise<void>;
}

export function UserProfileEditableName({
  name,
  fallback,
  onSave,
}: UserProfileEditableNameProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(name);

  const startEditing = () => {
    setDraft(name);
    setEditing(true);
  };

  const commit = async () => {
    const next = draft.trim();
    if (!next || next === name) {
      setEditing(false);
      return;
    }
    await onSave(next);
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="flex items-center gap-2 mb-1">
        <IGRPInputText
          value={draft}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setDraft(e.target.value)
          }
          onKeyDown={(e: React.KeyboardEvent) => {
            if (e.key === "Enter") void commit();
            if (e.key === "Escape") setEditing(false);
          }}
          className="text-2xl font-bold tracking-tight h-10"
          autoFocus
        />
        <IGRPButton size="sm" variant="ghost" onClick={() => void commit()} aria-label="Guardar nome">
          <IGRPIcon iconName="Check" className="w-4 h-4" />
        </IGRPButton>
        <IGRPButton size="sm" variant="ghost" onClick={() => setEditing(false)} aria-label="Cancelar edição">
          <IGRPIcon iconName="X" className="w-4 h-4" />
        </IGRPButton>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 mb-1 group">
      <h1 className="text-2xl font-bold tracking-tight">{name || fallback || "N/A"}</h1>
      <IGRPButton size="sm" variant="ghost" onClick={startEditing} aria-label="Editar nome">
        <IGRPIcon iconName="Pencil" className="w-4 h-4" />
      </IGRPButton>
    </div>
  );
}
```

- [ ] **Step 4: Run tests**

Run: `pnpm vitest run src/__tests__/users/components/user-profile-editable-name.test.tsx`
Expected: PASS.

- [ ] **Step 5: Wire into `user-profile.tsx`**

Remove `isEditingName`, `editedName`, the `useEffect` that syncs `editedName`, the `handleSaveName` function, and the inline edit JSX. Replace with:

```tsx
<UserProfileEditableName
  name={user.name || user.username || ""}
  fallback="N/A"
  onSave={async (next) => {
    const res = await updateUser({ id: user.id, user: { ...user, name: next } });
    if (!res.success) {
      igrpToast({ type: "error", title: "Erro ao atualizar nome", description: res.error, duration: 4000 });
      throw new Error(res.error);
    }
    igrpToast({ type: "success", title: "Nome atualizado com sucesso", duration: 4000 });
  }}
/>
```

- [ ] **Step 6: Commit**

```powershell
git add src/features/users/components/user-profile-editable-name.tsx src/features/users/components/user-profile.tsx src/__tests__/users/components/user-profile-editable-name.test.tsx
git commit -m "refactor(profile): extract UserProfileEditableName"
```

---

### Task 6: Extract `UserProfileStatusDialog`

**Files:**
- Create: `src/features/users/components/user-profile-status-dialog.tsx`
- Create: `src/__tests__/users/components/user-profile-status-dialog.test.tsx`
- Modify: `src/features/users/components/user-profile.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// src/__tests__/users/components/user-profile-status-dialog.test.tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import { UserProfileStatusDialog } from "@/features/users/components/user-profile-status-dialog";

it("calls onConfirm with INACTIVE when active user confirms", async () => {
  const onConfirm = vi.fn().mockResolvedValue(undefined);
  render(<UserProfileStatusDialog open isActive userName="Ana" onOpenChange={() => {}} onConfirm={onConfirm} />);
  await userEvent.click(screen.getByRole("button", { name: /confirmar desativar/i }));
  expect(onConfirm).toHaveBeenCalledWith("INACTIVE");
});

it("calls onConfirm with ACTIVE when inactive user confirms", async () => {
  const onConfirm = vi.fn().mockResolvedValue(undefined);
  render(<UserProfileStatusDialog open isActive={false} userName="Ana" onOpenChange={() => {}} onConfirm={onConfirm} />);
  await userEvent.click(screen.getByRole("button", { name: /confirmar ativar/i }));
  expect(onConfirm).toHaveBeenCalledWith("ACTIVE");
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm vitest run src/__tests__/users/components/user-profile-status-dialog.test.tsx`
Expected: FAIL — module does not exist.

- [ ] **Step 3: Implement**

```tsx
// src/features/users/components/user-profile-status-dialog.tsx
"use client";

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  IGRPButton,
  IGRPIcon,
} from "@igrp/igrp-framework-react-design-system";
import type { Status } from "@igrp/platform-access-management-client-ts";
import { useState } from "react";

export interface UserProfileStatusDialogProps {
  open: boolean;
  isActive: boolean;
  userName: string;
  onOpenChange: (open: boolean) => void;
  onConfirm: (next: Status) => Promise<void>;
}

export function UserProfileStatusDialog({
  open,
  isActive,
  userName,
  onOpenChange,
  onConfirm,
}: UserProfileStatusDialogProps) {
  const [pending, setPending] = useState(false);
  const next: Status = isActive ? "INACTIVE" : "ACTIVE";

  const handleConfirm = async () => {
    setPending(true);
    try {
      await onConfirm(next);
    } finally {
      setPending(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <IGRPIcon iconName="AlertTriangle" className="w-5 h-5 text-destructive" strokeWidth={2} />
            {isActive ? "Desativar" : "Ativar"} Utilizador
          </AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja {isActive ? "desativar" : "ativar"} o utilizador{" "}
            <strong className="text-foreground">{userName}</strong>?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <IGRPButton
            disabled={pending}
            variant="outline"
            onClick={() => onOpenChange(false)}
            type="button"
            showIcon
            iconPlacement="start"
            iconName="X"
          >
            Cancelar
          </IGRPButton>
          <IGRPButton
            onClick={handleConfirm}
            disabled={pending}
            variant={isActive ? "destructive" : "default"}
            className="gap-2"
          >
            {pending ? (
              <IGRPIcon iconName="LoaderCircle" className="animate-spin" />
            ) : (
              <IGRPIcon iconName={isActive ? "Ban" : "Check"} />
            )}
            {isActive ? "Confirmar Desativar" : "Confirmar Ativar"}
          </IGRPButton>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
```

- [ ] **Step 4: Run tests**

Run: `pnpm vitest run src/__tests__/users/components/user-profile-status-dialog.test.tsx`
Expected: PASS.

- [ ] **Step 5: Wire into `user-profile.tsx`**

Remove `showStatusDialog`, `isUpdatingStatus` state and `handleToggleStatus`. Replace the inline `AlertDialog` JSX with:

```tsx
<UserProfileStatusDialog
  open={showStatusDialog}
  isActive={isActive}
  userName={user.name}
  onOpenChange={setShowStatusDialog}
  onConfirm={async (next) => {
    const res = await updateUser({ id: user.id, user: { ...user, status: next } });
    if (!res.success) {
      igrpToast({ type: "error", title: "Erro ao alterar estado", description: res.error, duration: 4000 });
      throw new Error(res.error);
    }
    setShowStatusDialog(false);
    igrpToast({
      type: "success",
      title: `Utilizador ${next === "ACTIVE" ? "ativado" : "desativado"} com sucesso`,
      duration: 4000,
    });
  }}
/>
```

Keep just `const [showStatusDialog, setShowStatusDialog] = useState(false)` in the container.

- [ ] **Step 6: Commit**

```powershell
git add src/features/users/components/user-profile-status-dialog.tsx src/features/users/components/user-profile.tsx src/__tests__/users/components/user-profile-status-dialog.test.tsx
git commit -m "refactor(profile): extract UserProfileStatusDialog"
```

---

### Task 7: Extract `UserProfileAvatar`

**Files:**
- Create: `src/features/users/components/user-profile-avatar.tsx`
- Modify: `src/features/users/components/user-profile.tsx`
- Modify: `src/__tests__/users/components/user-profile-avatar.test.tsx`

- [ ] **Step 1: Flesh out the `describe.todo` placeholder from Task 3**

Replace `src/__tests__/users/components/user-profile-avatar.test.tsx` with:

```tsx
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import { UserProfileAvatar } from "@/features/users/components/user-profile-avatar";

const baseUser = { id: "u1", name: "Ana", username: "ana", email: "a@x.cv", picture: null } as never;

const fakeUrl = "blob:fake";
beforeEach(() => {
  vi.stubGlobal("URL", {
    createObjectURL: vi.fn(() => fakeUrl),
    revokeObjectURL: vi.fn(),
  });
});

it("shows the object-URL preview while uploading and clears it after success", async () => {
  const onUpload = vi.fn().mockResolvedValue("/files/new.png");
  render(<UserProfileAvatar user={baseUser} resolvedUrl={null} isResolvingUrl={false} isUploading={false} onUpload={onUpload} />);

  const input = screen.getByLabelText(/alterar avatar/i, { selector: "input" });
  const file = new File(["x"], "x.png", { type: "image/png" });
  fireEvent.change(input, { target: { files: [file] } });

  await waitFor(() => expect(onUpload).toHaveBeenCalledWith(file));
  await waitFor(() => expect(URL.revokeObjectURL).toHaveBeenCalledWith(fakeUrl));
});

it("clears object URL when upload errors", async () => {
  const onUpload = vi.fn().mockRejectedValue(new Error("nope"));
  render(<UserProfileAvatar user={baseUser} resolvedUrl={null} isResolvingUrl={false} isUploading={false} onUpload={onUpload} />);

  const input = screen.getByLabelText(/alterar avatar/i, { selector: "input" });
  fireEvent.change(input, { target: { files: [new File(["x"], "x.png", { type: "image/png" })] } });

  await waitFor(() => expect(URL.revokeObjectURL).toHaveBeenCalledWith(fakeUrl));
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm vitest run src/__tests__/users/components/user-profile-avatar.test.tsx`
Expected: FAIL — module not exported.

- [ ] **Step 3: Implement**

```tsx
// src/features/users/components/user-profile-avatar.tsx
"use client";

import {
  cn,
  IGRPIcon,
  IGRPUserAvatar,
} from "@igrp/igrp-framework-react-design-system";
import type { IGRPUserDTO } from "@igrp/platform-access-management-client-ts";
import { useEffect, useRef, useState } from "react";
import { getInitials } from "@/lib/utils";

export interface UserProfileAvatarProps {
  user: IGRPUserDTO;
  resolvedUrl: string | null;
  isResolvingUrl: boolean;
  isUploading: boolean;
  onUpload: (file: File) => Promise<void>;
}

export function UserProfileAvatar({
  user,
  resolvedUrl,
  isResolvingUrl,
  isUploading,
  onUpload,
}: UserProfileAvatarProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [localPreview, setLocalPreview] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (localPreview) URL.revokeObjectURL(localPreview);
    };
  }, [localPreview]);

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const preview = URL.createObjectURL(file);
    setLocalPreview(preview);
    try {
      await onUpload(file);
    } finally {
      URL.revokeObjectURL(preview);
      setLocalPreview(null);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const currentUrl = localPreview ?? resolvedUrl;
  const spinning = isResolvingUrl || isUploading;

  return (
    <button
      type="button"
      aria-label="Alterar avatar"
      className="relative group cursor-pointer p-0 border-0 bg-transparent"
      onClick={() => inputRef.current?.click()}
    >
      <IGRPUserAvatar
        alt={user.name}
        image={currentUrl}
        fallbackContent={
          isResolvingUrl ? (
            <div className="flex items-center justify-center w-full h-full bg-muted/50 animate-pulse">
              <IGRPIcon iconName="LoaderCircle" className="w-8 h-8 text-muted-foreground animate-spin" />
            </div>
          ) : (
            getInitials(user.name || user.username || user.email || "")
          )
        }
        className="relative size-28 bg-background border-4 border-background shadow-lg transition-transform duration-300 group-hover:scale-105"
        fallbackClass="text-3xl"
      />

      <div className="absolute -bottom-1 -right-1 bg-background rounded-full p-2 shadow-md border border-border group-hover:border-primary transition-colors">
        <IGRPIcon
          iconName={spinning ? "LoaderCircle" : "Camera"}
          className={cn(
            "w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors",
            spinning && "animate-spin",
          )}
        />
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        aria-label="Alterar avatar"
        onChange={handleChange}
        className="hidden"
        disabled={isUploading}
      />
    </button>
  );
}
```

- [ ] **Step 4: Wire into `user-profile.tsx`**

Replace the giant `<button>` block (lines ~249-299) with:

```tsx
<UserProfileAvatar
  user={user}
  resolvedUrl={avatarFile?.url ?? null}
  isResolvingUrl={isLoadingFile}
  isUploading={uploadFile.isPending}
  onUpload={async (file) => {
    const path = await uploadFile.mutateAsync({
      file,
      options: { folder: `users/${user.id}/avatar` },
    });
    const res = await updateUser({ id: user.id, user: { ...user, picture: path } });
    if (!res.success) {
      igrpToast({ type: "error", title: "Erro ao atualizar avatar", description: res.error, duration: 4000 });
      throw new Error(res.error);
    }
    igrpToast({ type: "success", title: "Avatar atualizado com sucesso", duration: 4000 });
  }}
/>
```

Remove the `avatarInputRef`, `localPreview` state, and the cleanup effect from the container — they live in the child now.

- [ ] **Step 5: Run tests**

Run: `pnpm vitest run src/__tests__/users/components/user-profile-avatar.test.tsx`
Expected: PASS.

- [ ] **Step 6: Commit**

```powershell
git add src/features/users/components/user-profile-avatar.tsx src/features/users/components/user-profile.tsx src/__tests__/users/components/user-profile-avatar.test.tsx
git commit -m "refactor(profile): extract UserProfileAvatar with isolated upload state"
```

---

### Task 8: Extract `UserProfileTabs` and `UserProfileHeader`

**Files:**
- Create: `src/features/users/components/user-profile-tabs.tsx`
- Create: `src/features/users/components/user-profile-header.tsx`
- Modify: `src/features/users/components/user-profile.tsx`

- [ ] **Step 1: Implement the tabs wrapper**

```tsx
// src/features/users/components/user-profile-tabs.tsx
"use client";

import {
  type IGRPTabItem,
  IGRPTabs,
} from "@igrp/igrp-framework-react-design-system";
import type { IGRPUserDTO } from "@igrp/platform-access-management-client-ts";
import { useMemo } from "react";
import { DepartmentListSimple } from "@/features/departments/components/dept-list-simple-container";
import ProfileRoleList from "@/features/profile/components/profile-role-list";
import UserApplications from "./user-applications";
import UserSignature from "./user-signature";

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
      { label: "Assinatura", value: "signature", content: <UserSignature refetch={onUserChange} user={user} /> },
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

- [ ] **Step 2: Implement the header card**

```tsx
// src/features/users/components/user-profile-header.tsx
"use client";

import {
  Card,
  CardContent,
  IGRPButton,
} from "@igrp/igrp-framework-react-design-system";
import type { IGRPUserDTO } from "@igrp/platform-access-management-client-ts";
import { UserProfileAvatar } from "./user-profile-avatar";
import { UserProfileEditableName } from "./user-profile-editable-name";

export interface UserProfileHeaderProps {
  user: IGRPUserDTO;
  isActive: boolean;
  avatarUrl: string | null;
  isResolvingAvatar: boolean;
  isUploadingAvatar: boolean;
  onToggleStatus: () => void;
  onUploadAvatar: (file: File) => Promise<void>;
  onSaveName: (next: string) => Promise<void>;
}

export function UserProfileHeader(props: UserProfileHeaderProps) {
  const {
    user, isActive, avatarUrl, isResolvingAvatar, isUploadingAvatar,
    onToggleStatus, onUploadAvatar, onSaveName,
  } = props;

  return (
    <Card className="py-2 border-0 shadow-sm">
      <CardContent className="px-4 py-1">
        <div className="flex items-center mb-2 justify-end gap-2">
          <IGRPButton
            showIcon
            variant={isActive ? "destructive" : "default"}
            iconName={isActive ? "Ban" : "Check"}
            size="sm"
            className="cursor-pointer"
            onClick={onToggleStatus}
          >
            {isActive ? "Desativar" : "Ativar"}
          </IGRPButton>
        </div>
        <div className="flex items-center gap-6">
          <UserProfileAvatar
            user={user}
            resolvedUrl={avatarUrl}
            isResolvingUrl={isResolvingAvatar}
            isUploading={isUploadingAvatar}
            onUpload={onUploadAvatar}
          />
          <div className="flex-1">
            <UserProfileEditableName
              name={user.name || user.username || ""}
              fallback="N/A"
              onSave={onSaveName}
            />
            <p className="text-muted-foreground">{user.email}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 3: Slim down the container**

`user-profile.tsx` should now look like (≤ 80 lines):

```tsx
"use client";

import { useIGRPToast } from "@igrp/igrp-framework-react-design-system";
import { useState } from "react";
import { AppCenterLoading } from "@/components/loading";
import { AppCenterNotFound } from "@/components/not-found";
import { useFiles, useUploadPublicFiles } from "@/features/files/use-files";
import { useCurrentUser, useUpdateUser } from "@/features/users/use-users";
import { UserProfileHeader } from "./user-profile-header";
import { UserProfileStatusDialog } from "./user-profile-status-dialog";
import { UserProfileTabs } from "./user-profile-tabs";

export function UserProfile() {
  const { data: user, isLoading, error, refetch } = useCurrentUser();
  const { mutateAsync: updateUser } = useUpdateUser();
  const uploadFile = useUploadPublicFiles();
  const { igrpToast } = useIGRPToast();

  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const { data: avatarFile, isLoading: isLoadingAvatar } = useFiles(user?.picture ?? "");

  if (error) throw error;
  if (isLoading) return <AppCenterLoading description="Carregando utilizador..." />;
  if (!user) return <AppCenterNotFound iconName="User" title="Nenhum utilizador encontrado." />;

  const isActive = user.status === "ACTIVE";

  const saveName = async (next: string) => {
    const res = await updateUser({ id: user.id, user: { ...user, name: next } });
    if (!res.success) {
      igrpToast({ type: "error", title: "Erro ao atualizar nome", description: res.error, duration: 4000 });
      throw new Error(res.error);
    }
    igrpToast({ type: "success", title: "Nome atualizado com sucesso", duration: 4000 });
  };

  const uploadAvatar = async (file: File) => {
    const path = await uploadFile.mutateAsync({ file, options: { folder: `users/${user.id}/avatar` } });
    const res = await updateUser({ id: user.id, user: { ...user, picture: path } });
    if (!res.success) {
      igrpToast({ type: "error", title: "Erro ao atualizar avatar", description: res.error, duration: 4000 });
      throw new Error(res.error);
    }
    igrpToast({ type: "success", title: "Avatar atualizado com sucesso", duration: 4000 });
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <UserProfileHeader
        user={user}
        isActive={isActive}
        avatarUrl={avatarFile?.url ?? null}
        isResolvingAvatar={isLoadingAvatar}
        isUploadingAvatar={uploadFile.isPending}
        onToggleStatus={() => setShowStatusDialog(true)}
        onUploadAvatar={uploadAvatar}
        onSaveName={saveName}
      />
      <UserProfileTabs user={user} onUserChange={refetch} />
      <UserProfileStatusDialog
        open={showStatusDialog}
        isActive={isActive}
        userName={user.name}
        onOpenChange={setShowStatusDialog}
        onConfirm={async (next) => {
          const res = await updateUser({ id: user.id, user: { ...user, status: next } });
          if (!res.success) {
            igrpToast({ type: "error", title: "Erro ao alterar estado", description: res.error, duration: 4000 });
            throw new Error(res.error);
          }
          setShowStatusDialog(false);
          igrpToast({
            type: "success",
            title: `Utilizador ${next === "ACTIVE" ? "ativado" : "desativado"} com sucesso`,
            duration: 4000,
          });
        }}
      />
    </div>
  );
}
```

- [ ] **Step 4: Run typecheck and full profile-related tests**

Run: `pnpm typecheck && pnpm vitest run src/__tests__/users`
Expected: PASS.

- [ ] **Step 5: Manual smoke**

Run: `pnpm dev`
Visit `/profile`. Verify: edit name, upload avatar, toggle status, switch tabs.

- [ ] **Step 6: Commit**

```powershell
git add src/features/users/components/user-profile-header.tsx src/features/users/components/user-profile-tabs.tsx src/features/users/components/user-profile.tsx
git commit -m "refactor(profile): extract header and tabs; shrink UserProfile container to orchestrator"
```

---

## Phase 4 — RSC migration (optional but recommended)

### Task 9: Add `getQueryClient()` server helper

**Files:**
- Modify: `src/providers/query-provider.tsx`

- [ ] **Step 1: Add the server helper**

Append to `src/providers/query-provider.tsx`:

```tsx
import { QueryClient as ServerQueryClient } from "@tanstack/react-query";
import { cache } from "react";

// Per-request server-side QueryClient. Memoized with React's cache() so all
// server components in the same request share one instance.
export const getQueryClient = cache(() => new ServerQueryClient());
```

(If TypeScript complains about the duplicate `QueryClient` symbol, rename the import alias as shown.)

- [ ] **Step 2: Commit**

```powershell
git add src/providers/query-provider.tsx
git commit -m "feat(query): add server-only getQueryClient helper for RSC prefetch"
```

---

### Task 10: Convert `profile/page.tsx` to an RSC that prefetches the user

**Files:**
- Modify: `src/app/(igrp)/(home)/profile/page.tsx`

- [ ] **Step 1: Replace the page**

```tsx
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { getCurrentUser } from "@/actions/user";
import { UserProfile } from "@/features/users/components/user-profile";
import { getQueryClient } from "@/providers/query-provider";

export default async function UserProfilePage() {
  const queryClient = getQueryClient();

  await queryClient.prefetchQuery({
    queryKey: ["current-user"],
    queryFn: async () => {
      const result = await getCurrentUser();
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
  });

  return (
    <div className="container mx-auto max-w-7xl">
      <HydrationBoundary state={dehydrate(queryClient)}>
        <UserProfile />
      </HydrationBoundary>
    </div>
  );
}
```

Notes:
- Drop `export const dynamic = "force-dynamic"`. The page is implicitly dynamic because `getCurrentUser()` reads cookies/headers via the server action.
- Do not pass props into `UserProfile`; it still consumes its own `useCurrentUser()` query — the prefetch just removes the loading flash.

- [ ] **Step 2: Verify**

Run: `pnpm dev`. Open `/profile` with throttled network. The header card should render instantly without the "Carregando utilizador..." skeleton flash.

Run: `pnpm typecheck`
Expected: PASS.

- [ ] **Step 3: Commit**

```powershell
git add src/app/(igrp)/(home)/profile/page.tsx
git commit -m "feat(profile): prefetch current user in RSC and hydrate client query cache"
```

---

## Phase 5 — Polish (a11y, i18n, design system cleanups)

### Task 11: Audit and remove the dead `.absolute -inset-1 …` background blur

**Files:**
- Modify: `src/features/users/components/user-profile-avatar.tsx`

The original markup contained:

```tsx
<div className="absolute -inset-1 rounded-full blur opacity-75 group-hover:opacity-100 transition" />
```

with no background color — visually a no-op. Confirm via DevTools that it has no computed `background`/`box-shadow`. If true, delete it. If it was intended as a subtle hover halo, give it `bg-primary/30` instead.

- [ ] **Step 1: Inspect in the running app**

Run: `pnpm dev` → `/profile` → DevTools, select that div, check Computed → Background.

- [ ] **Step 2: Decide and apply**

If empty: delete the line. If intentional: change to `bg-primary/30 blur opacity-0 group-hover:opacity-100 transition`.

- [ ] **Step 3: Commit**

```powershell
git add src/features/users/components/user-profile-avatar.tsx
git commit -m "style(profile): remove (or restore) avatar hover halo"
```

---

### Task 12: Audit barrel import from the IGRP design system

**Files:** investigation only

The component imports 10+ symbols from `@igrp/igrp-framework-react-design-system`. Whether this bloats the client bundle depends on the package's tree-shaking config.

- [ ] **Step 1: Check the package's `package.json`**

Run: `cat node_modules/@igrp/igrp-framework-react-design-system/package.json`
Look for: `"sideEffects": false`, `"exports"` map with subpath entries, ESM build.

- [ ] **Step 2: Decide**

- If `sideEffects: false` is set → no action needed; document in `AGENTS.md` that barrel imports from this package are safe.
- If not set → file an issue against the design system package and leave a TODO in `AGENTS.md`. **Do not** introduce per-component imports unilaterally — the package may not expose them.

- [ ] **Step 3: Commit any doc change**

```powershell
git add AGENTS.md
git commit -m "docs: note tree-shaking status of @igrp design-system package"
```

(Skip the commit if no doc change.)

---

## Self-Review

- [ ] All review items mapped to tasks:
  - P0 #1 unreachable throw → Task 1
  - P0 #2 cn precedence → Task 2
  - P0 #7 avatar race → Tasks 3 + 7
  - P1 #3 gender typo → Task 1
  - P1 #4 a11y label → Task 7
  - P1 #5 derived state effect → Task 3
  - P1 #6 effect-driven editedName init → Task 5
  - P1 #8 over-broad update payloads → addressed by keeping `{...user, field}` (constrained by current `useUpdateUser` signature requiring `IGRPUserDTO`); narrower payload would require changing the action's signature — out of scope.
  - P1 #9 inconsistent invalidation → Task 4
  - P2 #10 component split → Tasks 5–8
  - P2 #12 RSC migration → Tasks 9–10
  - P3 #11 `IGRPTabs` children-API → not actionable without changing the design system; left as-is, noted in Task 8 (`useMemo` mitigation).
  - P3 #13 barrel imports → Task 12
  - P3 #14 destructive button override → Task 6 (uses `variant={isActive ? "destructive" : "default"}`)
  - P3 #15 dead blur div → Task 11

- [ ] No placeholders: every step contains either the full code, the exact command, or both.

- [ ] Type/name consistency: `UserProfileAvatar` props (`user`, `resolvedUrl`, `isResolvingUrl`, `isUploading`, `onUpload`) match between Tasks 3, 7, and 8. `UserProfileEditableName.onSave: (next: string) => Promise<void>` matches between Tasks 5 and 8. `UserProfileStatusDialog.onConfirm: (next: Status) => Promise<void>` matches between Tasks 6 and 8.

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-05-26-profile-page-review-fixes.md`. Two execution options:

1. **Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review between tasks, fast iteration.
2. **Inline Execution** — Execute tasks in this session using executing-plans, batch execution with checkpoints.

Which approach?
