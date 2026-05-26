# Users Flow Cleanup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix correctness bugs, dedupe state, split oversized components, and stream tab content across the `/settings/users` flow without changing user-visible behavior (except where the current behavior is a bug).

**Architecture:** All changes stay within `src/app/(igrp)/(home)/settings/users/**` and `src/features/users/**`. Server actions in `src/actions/user.ts` are not modified. Tests live in `src/__tests__/users/**` per the established pattern. Each task is independently testable and commits separately.

**Tech Stack:**
- Next.js 15 App Router (RSC + client components), React 19
- TanStack Query v5
- Vitest 4 + jsdom + Testing Library (already configured at [vitest.config.ts](../../../vitest.config.ts) and [src/test-setup.ts](../../../src/test-setup.ts))
- react-hook-form + zod
- IGRP design system (`@igrp/igrp-framework-react-design-system`)

**Note on testing setup:** Vitest is already installed and configured. Four reference tests exist under `src/__tests__/users/`. Follow the same conventions: mock the design system inline where needed, mock `@/features/users/use-users` for hook-driven UI, wrap components needing query client with a `QueryClientProvider` factory.

---

## File Structure

### Files modified
| Path | Reason |
|---|---|
| `src/app/(igrp)/(home)/settings/users/page.tsx` | Add `dynamic = "force-dynamic"` |
| `src/app/(igrp)/(home)/settings/users/[id]/page.tsx` | Stream tab fallbacks |
| `src/features/users/use-users.ts` | Include `params` in `useUsers` query key; invalidate both list + detail keys on status mutation |
| `src/features/users/components/user-list-table.tsx` | Discriminated dialog state, single-pass invite filter, dedupe columns, drop `useRouter`, gate resend on terminal statuses |
| `src/features/users/components/user-details-header.tsx` | Use `useUpdateUserStatus` for status toggle; thin shell composing three child components |
| `src/features/users/components/user-details-tabs.tsx` | Lazy-mount tab panels; remove no-op `refetch` |
| `src/features/users/components/user-signature.tsx` | Accept and call a proper refetch (router refresh) |
| `src/features/users/components/user-invite-dialog.tsx` | Remove commented-out role-assignment block; single `departmentCode` watch |

### Files created
| Path | Responsibility |
|---|---|
| `src/app/(igrp)/(home)/settings/users/error.tsx` | Error boundary specific to the users segment |
| `src/features/users/components/user-status-toggle.tsx` | Status toggle button + confirm dialog extracted from header |
| `src/features/users/components/user-name-editor.tsx` | Inline name editor extracted from header |
| `src/features/users/components/user-avatar-uploader.tsx` | Avatar click + upload extracted from header |
| `src/__tests__/users/use-users.test.ts` | Query key + invalidation behavior |
| `src/__tests__/users/components/user-list-table.test.tsx` | Dialog state + invite filtering behavior |
| `src/__tests__/users/components/user-status-toggle.test.tsx` | Status toggle invokes correct mutation + invalidations |
| `src/__tests__/users/components/user-name-editor.test.tsx` | Inline name editor save/cancel |
| `src/__tests__/users/components/user-details-tabs.test.tsx` | Tab panels mount lazily |

---

## Task 1: Add `useUsers` params to query key

**Why:** Today `useUsers(params)` uses `queryKey: ["users"]` regardless of `params` — calling with different filters returns stale cached data from a prior filter.

**Files:**
- Modify: `src/features/users/use-users.ts:60-74`
- Create: `src/__tests__/users/use-users.test.ts`

- [ ] **Step 1: Write the failing test**

```tsx
// src/__tests__/users/use-users.test.ts
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { useUsers } from "@/features/users/use-users";
import * as actions from "@/actions/user";

vi.mock("@/actions/user");

function wrapperWith(client: QueryClient) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };
}

describe("useUsers", () => {
  beforeEach(() => {
    vi.mocked(actions.getUsers).mockResolvedValue({
      success: true,
      data: [],
    } as Awaited<ReturnType<typeof actions.getUsers>>);
  });

  it("caches separately for different params", async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const wrapper = wrapperWith(client);

    const a = renderHook(() => useUsers({ status: "ACTIVE" }), { wrapper });
    const b = renderHook(() => useUsers({ status: "INACTIVE" }), { wrapper });

    await waitFor(() => {
      expect(a.result.current.isSuccess).toBe(true);
      expect(b.result.current.isSuccess).toBe(true);
    });

    expect(actions.getUsers).toHaveBeenCalledTimes(2);
    expect(actions.getUsers).toHaveBeenNthCalledWith(1, { status: "ACTIVE" });
    expect(actions.getUsers).toHaveBeenNthCalledWith(2, { status: "INACTIVE" });
  });
});
```

- [ ] **Step 2: Run test, expect fail**

Run: `pnpm vitest run src/__tests__/users/use-users.test.ts`
Expected: FAIL — `getUsers` called only once because both hooks share the `["users"]` key.

- [ ] **Step 3: Fix the query key**

```ts
// src/features/users/use-users.ts (replace useUsers definition)
export const useUsers = (
  params?: UserFilters,
  options?: { initialData?: IGRPUserDTO[] },
) => {
  return useQuery<IGRPUserDTO[], Error>({
    queryKey: ["users", params ?? null],
    queryFn: async () => {
      const result = await getUsers(params);
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    initialData: options?.initialData,
    retry: false,
  });
};
```

- [ ] **Step 4: Run test, expect pass**

Run: `pnpm vitest run src/__tests__/users/use-users.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/users/use-users.ts src/__tests__/users/use-users.test.ts
git commit -m "fix(users): include params in useUsers query key"
```

---

## Task 2: Status mutation invalidates both list and detail keys

**Why:** `useUpdateUserStatus` invalidates only `["users"]`. When called from the detail page (Task 5) the detail query `["user", id]` keeps the stale status.

**Files:**
- Modify: `src/features/users/use-users.ts:410-423`
- Modify: `src/__tests__/users/use-users.test.ts` (append)

- [ ] **Step 1: Write the failing test (append to existing file)**

```ts
// append to src/__tests__/users/use-users.test.ts
import { useUpdateUserStatus } from "@/features/users/use-users";

describe("useUpdateUserStatus", () => {
  it("invalidates both users list and individual user queries", async () => {
    vi.mocked(actions.updateUserStatus).mockResolvedValue({
      success: true,
      data: { id: "u1", status: "INACTIVE" },
    } as Awaited<ReturnType<typeof actions.updateUserStatus>>);

    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const spy = vi.spyOn(client, "invalidateQueries");
    const wrapper = wrapperWith(client);

    const { result } = renderHook(() => useUpdateUserStatus(), { wrapper });
    await result.current.mutateAsync({ id: "u1", value: "INACTIVE" });

    expect(spy).toHaveBeenCalledWith({ queryKey: ["users"] });
    expect(spy).toHaveBeenCalledWith({ queryKey: ["user", "u1"] });
  });
});
```

- [ ] **Step 2: Run, expect fail**

Run: `pnpm vitest run src/__tests__/users/use-users.test.ts`
Expected: FAIL — only `["users"]` invalidated.

- [ ] **Step 3: Update mutation onSuccess**

```ts
// src/features/users/use-users.ts (replace useUpdateUserStatus)
export function useUpdateUserStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, value }: { id: string; value: string }) =>
      updateUserStatus(id, value),
    onSuccess: async (result, variables) => {
      if (result.success) {
        await queryClient.invalidateQueries({ queryKey: ["users"] });
        await queryClient.invalidateQueries({ queryKey: ["user", variables.id] });
      }
    },
    retry: false,
  });
}
```

- [ ] **Step 4: Run, expect pass**

Run: `pnpm vitest run src/__tests__/users/use-users.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/users/use-users.ts src/__tests__/users/use-users.test.ts
git commit -m "fix(users): invalidate detail key on status mutation"
```

---

## Task 3: Mark `users/page.tsx` dynamic

**Why:** An admin user list must reflect live data. The current commented-out `dynamic = "force-dynamic"` at [src/app/(igrp)/(home)/settings/users/page.tsx:4](../../../src/app/(igrp)/(home)/settings/users/page.tsx#L4) means Next will try to statically cache the page.

**Files:**
- Modify: `src/app/(igrp)/(home)/settings/users/page.tsx`

- [ ] **Step 1: Enable dynamic rendering**

```tsx
// src/app/(igrp)/(home)/settings/users/page.tsx
import { getUsers, getUserInvitations } from "@/actions/user";
import { UserListTable } from "@/features/users/components/user-list-table";

export const dynamic = "force-dynamic";

export default async function UserPage() {
  const [usersResult, invitationsResult] = await Promise.all([
    getUsers(),
    getUserInvitations(),
  ]);

  const initialUsers = usersResult.success ? usersResult.data : [];
  const initialInvitations = invitationsResult.success
    ? invitationsResult.data
    : [];

  return (
    <UserListTable
      initialUsers={initialUsers}
      initialInvitations={initialInvitations}
    />
  );
}
```

- [ ] **Step 2: Verify build**

Run: `pnpm build`
Expected: Build succeeds with no warnings about caching this route.

- [ ] **Step 3: Commit**

```bash
git add src/app/(igrp)/(home)/settings/users/page.tsx
git commit -m "fix(users): force dynamic rendering on users list page"
```

---

## Task 4: Add users segment error boundary

**Why:** [user-list-table.tsx:474](../../../src/features/users/components/user-list-table.tsx#L474) does `if (error) throw error`, but there's no `error.tsx` between this component and the root one. Add a per-segment boundary.

**Files:**
- Create: `src/app/(igrp)/(home)/settings/users/error.tsx`

- [ ] **Step 1: Create the error component**

```tsx
// src/app/(igrp)/(home)/settings/users/error.tsx
"use client";

import { IGRPButton, IGRPIcon } from "@igrp/igrp-framework-react-design-system";
import { useEffect } from "react";

export default function UsersError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[users-segment] error:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center gap-4 p-10 text-center">
      <IGRPIcon iconName="AlertTriangle" className="size-10 text-destructive" />
      <h2 className="text-lg font-semibold">
        Não foi possível carregar os utilizadores
      </h2>
      <p className="text-sm text-muted-foreground max-w-md">{error.message}</p>
      <IGRPButton onClick={reset}>Tentar novamente</IGRPButton>
    </div>
  );
}
```

- [ ] **Step 2: Smoke-check**

Run: `pnpm tsc --noEmit`
Expected: PASS — no type errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/(igrp)/(home)/settings/users/error.tsx
git commit -m "feat(users): add error boundary for users segment"
```

---

## Task 5: Unify status toggle in detail header to use `useUpdateUserStatus`

**Why:** [user-details-header.tsx:53](../../../src/features/users/components/user-details-header.tsx#L53) spreads the full `IGRPUserDTO` into `updateUser`, risking stale-field round-trips and bypassing the dedicated status endpoint. Cache invalidation also diverges from the list page.

**Files:**
- Modify: `src/features/users/components/user-details-header.tsx` (status section only — `handleToggleStatus`)

- [ ] **Step 1: Replace status handler**

In `user-details-header.tsx` replace the `useUpdateUser` usage *for status* (keep `useUpdateUser` for name editing — that's Task 7) with `useUpdateUserStatus`:

```tsx
// near other imports
import { useUpdateUserStatus, useUpdateUser } from "@/features/users/use-users";

// inside UserDetailsHeader, replace existing destructure and handler
const { mutateAsync: updateUser } = useUpdateUser();
const { mutateAsync: updateStatus, isPending: isUpdatingStatus } =
  useUpdateUserStatus();

const handleToggleStatus = async () => {
  const newStatus = isActive ? "INACTIVE" : "ACTIVE";
  try {
    const res = await updateStatus({ id: user.id, value: newStatus });
    if (!res.success) throw new Error(res.error);
    setShowStatusDialog(false);
    igrpToast({
      type: "success",
      title: `Utilizador ${isActive ? "desativado" : "ativado"} com sucesso`,
      duration: 4000,
    });
  } catch (err) {
    igrpToast({
      type: "error",
      title: "Erro ao alterar estado",
      description: (err as Error).message,
      duration: 4000,
    });
  }
};
```

Delete the now-unused local `isUpdatingStatus` state and `setIsUpdatingStatus` calls — use `isUpdatingStatus` from the mutation.

Delete the manual `queryClient.invalidateQueries({ queryKey: ["user", user.id] })` call in `handleToggleStatus` (Task 2's onSuccess covers it).

- [ ] **Step 2: Type-check**

Run: `pnpm tsc --noEmit`
Expected: PASS.

- [ ] **Step 3: Manual verification**

Run: `pnpm dev`
- Open `/settings/users`, switch a user INACTIVE → ACTIVE from the list, then open `/settings/users/<id>`; the detail page shows the new status without manual refresh.
- Reverse: change status from the detail header, return to list — list reflects the change.

- [ ] **Step 4: Commit**

```bash
git add src/features/users/components/user-details-header.tsx
git commit -m "fix(users): use dedicated status endpoint in detail header"
```

---

## Task 6: Gate "Reenviar Convite" on terminal invite states

**Why:** [user-list-table.tsx:186-189](../../../src/features/users/components/user-list-table.tsx#L186) shows "Reenviar Convite" even for `CANCELED`/`REJECTED` invites. The other two actions ("Copiar URL", "Cancelar Convite") are correctly hidden in those states.

**Files:**
- Modify: `src/features/users/components/user-list-table.tsx:172-204` (the `PendingRowActionsCell` JSX)

- [ ] **Step 1: Write the failing test (new file)**

```tsx
// src/__tests__/users/components/user-list-table.test.tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { UserListTable } from "@/features/users/components/user-list-table";

vi.mock("@/features/users/use-users", () => ({
  useUsers: () => ({ data: [], error: null }),
  useGetUserInvitations: () => ({
    data: [
      { id: 1, email: "pending@x.cv", status: "PENDING", invitationDate: "2026-05-01" },
      { id: 2, email: "canceled@x.cv", status: "CANCELED", invitationDate: "2026-05-01" },
    ],
    isLoading: false,
  }),
  useUpdateUserStatus: () => ({ mutate: vi.fn(), isPending: false }),
  useCancelUserInvitation: () => ({ mutate: vi.fn(), isPending: false }),
  useResendUserInvitation: () => ({ mutate: vi.fn(), isPending: false }),
}));

function wrapper({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={new QueryClient()}>
      {children}
    </QueryClientProvider>
  );
}

describe("UserListTable invite actions", () => {
  it("hides Reenviar on canceled invites", async () => {
    render(<UserListTable initialUsers={[]} initialInvitations={[]} />, {
      wrapper,
    });

    // switch to "Convites Cancelados" tab
    await userEvent.click(screen.getByRole("tab", { name: /cancelados/i }));

    // open the row actions menu
    const triggers = screen.getAllByRole("button", { name: "" });
    await userEvent.click(triggers[triggers.length - 1]);

    expect(screen.queryByText(/Reenviar Convite/i)).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run, expect fail**

Run: `pnpm vitest run src/__tests__/users/components/user-list-table.test.tsx`
Expected: FAIL — Reenviar is still rendered.

- [ ] **Step 3: Gate the JSX**

In `PendingRowActionsCell`, wrap the Reenviar item in the same status check used by the other actions:

```tsx
{String(row.original.status) !== "CANCELED" &&
  String(row.original.status) !== "REJECTED" && (
    <DropdownMenuItem onSelect={handleResend}>
      <IGRPIcon iconName="Mail" />
      Reenviar Convite
    </DropdownMenuItem>
  )}
```

Hoist the terminal-status check into a module-level helper to avoid the triple repetition:

```ts
// near the top, with other module-level helpers
const isTerminalInviteStatus = (s: string) => s === "CANCELED" || s === "REJECTED";
```

Then use `!isTerminalInviteStatus(String(row.original.status))` in all three places inside `PendingRowActionsCell`.

- [ ] **Step 4: Run, expect pass**

Run: `pnpm vitest run src/__tests__/users/components/user-list-table.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/users/components/user-list-table.tsx src/__tests__/users/components/user-list-table.test.tsx
git commit -m "fix(users): hide resend action on canceled/rejected invites"
```

---

## Task 7: Dedupe invitation column memos

**Why:** [user-list-table.tsx:426-433](../../../src/features/users/components/user-list-table.tsx#L426) computes `pendingColumns` and `canceledColumns` identically.

**Files:**
- Modify: `src/features/users/components/user-list-table.tsx`

- [ ] **Step 1: Collapse the two memos**

Delete `pendingColumns` and `canceledColumns`. Replace with a single `inviteColumns`:

```tsx
const inviteColumns = useMemo(
  () => getInvitationColumns(handleCancelClick),
  [handleCancelClick],
);
```

Update both `<TabsContent>` usages to pass `columns={inviteColumns}`.

- [ ] **Step 2: Type-check and re-run prior test**

Run: `pnpm tsc --noEmit && pnpm vitest run src/__tests__/users/components/user-list-table.test.tsx`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/features/users/components/user-list-table.tsx
git commit -m "refactor(users): share invite column definitions"
```

---

## Task 8: Single-pass invite filtering

**Why:** Two separate `useMemo`s walk `invites` to filter by status. One pass is enough.

**Files:**
- Modify: `src/features/users/components/user-list-table.tsx:400-407`

- [ ] **Step 1: Combine into one memo**

```tsx
const { pendingData, canceledData } = useMemo(() => {
  const pending: InvitationDTO[] = [];
  const canceled: InvitationDTO[] = [];
  for (const inv of invites ?? []) {
    if (inv.status === "PENDING") pending.push(inv);
    else if (inv.status === "CANCELED") canceled.push(inv);
  }
  return { pendingData: pending, canceledData: canceled };
}, [invites]);
```

Delete the previous `pendingData` and `canceledData` memos.

Also remove the dead `data` memo at line 399 — `users` is never nullish thanks to `initialData`. Inline `data={users}` in the `<IGRPDataTable>` JSX.

- [ ] **Step 2: Re-run tests**

Run: `pnpm vitest run src/__tests__/users/components/user-list-table.test.tsx`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/features/users/components/user-list-table.tsx
git commit -m "perf(users): filter invites in a single pass"
```

---

## Task 9: Drop `useRouter` from `ActiveRowActionsCell`

**Why:** [user-list-table.tsx:73-112](../../../src/features/users/components/user-list-table.tsx#L73) calls `useRouter()` and uses it in `onClick`, while the inner `<Link>` already navigates. Double-trigger + extra subscription per row.

**Files:**
- Modify: `src/features/users/components/user-list-table.tsx:65-116`

- [ ] **Step 1: Remove the router**

Replace the entire `ActiveRowActionsCell` with:

```tsx
function ActiveRowActionsCell({
  row,
  onStatusClick,
}: {
  row: Row<IGRPUserDTO>;
  onStatusClick: (user: IGRPUserDTO, newStatus: "ACTIVE" | "INACTIVE") => void;
}) {
  const state = String(row.getValue("status"));

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="p-1 rounded-sm">
        <IGRPIcon iconName="Ellipsis" />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="min-w-44">
        {state === "ACTIVE" ? (
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onSelect={() => onStatusClick(row.original, "INACTIVE")}
            variant="destructive"
          >
            <IGRPIcon iconName="CircleOff" />
            Desativar
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem
            onSelect={() => onStatusClick(row.original, "ACTIVE")}
            variant="default"
          >
            <IGRPIcon iconName="CircleCheck" />
            Ativar
          </DropdownMenuItem>
        )}

        <DropdownMenuItem variant="default" asChild>
          <Link
            className="flex gap-2"
            href={`/settings/users/${row.original.id}`}
          >
            <IGRPIcon iconName="UserCog" />
            Gerir
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

Remove the `useRouter` import if no other consumer remains in this file.

- [ ] **Step 2: Manual smoke check**

Run: `pnpm dev`
- From the active users tab, click the row menu → "Gerir". The browser navigates exactly once to the detail page (no transient state, no double navigation).

- [ ] **Step 3: Commit**

```bash
git add src/features/users/components/user-list-table.tsx
git commit -m "refactor(users): use Link asChild in row action menu"
```

---

## Task 10: Collapse dialog state to a discriminated union

**Why:** [user-list-table.tsx:379-386](../../../src/features/users/components/user-list-table.tsx#L379) tracks five booleans/objects for two mutually exclusive dialogs. One state field is cleaner and prevents impossible states (e.g. both dialogs open).

**Files:**
- Modify: `src/features/users/components/user-list-table.tsx`

- [ ] **Step 1: Introduce the union and replace state**

Near the top of `UserListTable`, replace the four useState lines with:

```tsx
type DialogState =
  | { kind: "none" }
  | { kind: "status"; user: IGRPUserDTO; newStatus: "ACTIVE" | "INACTIVE" }
  | { kind: "cancel"; invitation: InvitationDTO };

const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
const [dialog, setDialog] = useState<DialogState>({ kind: "none" });
const closeDialog = useCallback(() => setDialog({ kind: "none" }), []);
```

- [ ] **Step 2: Update handlers and dialog props**

```tsx
const handleStatusClick = useCallback(
  (user: IGRPUserDTO, newStatus: "ACTIVE" | "INACTIVE") => {
    setDialog({ kind: "status", user, newStatus });
  },
  [],
);

const handleCancelClick = useCallback((invitation: InvitationDTO) => {
  setDialog({ kind: "cancel", invitation });
}, []);

const handleConfirmStatusChange = () => {
  if (dialog.kind !== "status") return;
  updateStatusMutation.mutate(
    { id: dialog.user.id, value: dialog.newStatus },
    {
      onSuccess: () => {
        igrpToast({
          type: "success",
          title: "Estado alterado",
          description: "O estado do utilizador foi alterado com sucesso",
          duration: 4000,
        });
        closeDialog();
      },
      onError: () => {
        igrpToast({
          type: "error",
          title: "Erro",
          description: "Não foi possível alterar o estado do utilizador",
          duration: 4000,
        });
      },
    },
  );
};

const handleConfirmCancel = () => {
  if (dialog.kind !== "cancel") return;
  cancelUserInvitationMutation.mutate(dialog.invitation.id, {
    onSuccess: () => {
      igrpToast({
        type: "success",
        title: "Convite cancelado",
        description: "O convite foi cancelado com sucesso",
        duration: 4000,
      });
      closeDialog();
    },
    onError: () => {
      igrpToast({
        type: "error",
        title: "Erro",
        description: "Não foi possível cancelar o convite",
        duration: 4000,
      });
    },
  });
};
```

And replace the two `<ConfirmDialog>` JSX blocks:

```tsx
<ConfirmDialog
  open={dialog.kind === "status"}
  onOpenChange={(open) => !open && closeDialog()}
  title={
    dialog.kind === "status" && dialog.newStatus === "INACTIVE"
      ? "Desativar Utilizador"
      : "Ativar Utilizador"
  }
  description={
    dialog.kind === "status" ? (
      <>
        Tem certeza que deseja{" "}
        {dialog.newStatus === "INACTIVE" ? "desativar" : "ativar"}{" "}
        <strong>{dialog.user.name || dialog.user.email}</strong>?
      </>
    ) : null
  }
  onConfirm={handleConfirmStatusChange}
  confirmText={
    dialog.kind === "status" && dialog.newStatus === "INACTIVE"
      ? "Desativar"
      : "Ativar"
  }
  loadingText={
    dialog.kind === "status" && dialog.newStatus === "INACTIVE"
      ? "Desativando..."
      : "Ativando..."
  }
  iconName={
    dialog.kind === "status" && dialog.newStatus === "INACTIVE"
      ? "CircleOff"
      : "CircleCheck"
  }
  variant={
    dialog.kind === "status" && dialog.newStatus === "INACTIVE"
      ? "destructive"
      : "default"
  }
  isLoading={updateStatusMutation.isPending}
/>

<ConfirmDialog
  open={dialog.kind === "cancel"}
  onOpenChange={(open) => !open && closeDialog()}
  title="Cancelar Convite"
  description={
    dialog.kind === "cancel" ? (
      <>
        Tem certeza que deseja cancelar o convite para{" "}
        <strong>{dialog.invitation.email}</strong>? Esta ação não pode ser
        desfeita.
      </>
    ) : null
  }
  onConfirm={handleConfirmCancel}
  confirmText="Confirmar"
  loadingText="Cancelando..."
  iconName="Trash"
  variant="destructive"
  isLoading={cancelUserInvitationMutation.isPending}
/>
```

- [ ] **Step 3: Re-run tests, manual smoke check**

Run: `pnpm vitest run src/__tests__/users/components/user-list-table.test.tsx && pnpm tsc --noEmit`
Expected: PASS.

Manual: open active tab, click row → Desativar → confirm. Click row → Ativar. Switch to pending tab, click row → Cancelar Convite → confirm.

- [ ] **Step 4: Commit**

```bash
git add src/features/users/components/user-list-table.tsx
git commit -m "refactor(users): collapse dialog state to discriminated union"
```

---

## Task 11: Clean up `UserInviteDialog` dead code and duplicate watches

**Why:** Two `form.watch("departmentCode")` calls (lines 86, 99) and a ~13-line commented-out role-assignment block.

**Files:**
- Modify: `src/features/users/components/user-invite-dialog.tsx`

- [ ] **Step 1: Remove duplicate watch and dead code**

In `UserInviteDialog`:
- Delete the second `const parentValue = form.watch("departmentCode");` (line ~99). Replace `parentValue` references with `departmentCode`.
- Delete the commented-out role assignment block (lines 122-134) and the now-stale `// const finalId = created.data?.id;` comment.
- Delete the commented-out `name` `FormField` block (lines 176-188).

- [ ] **Step 2: Type-check**

Run: `pnpm tsc --noEmit && pnpm lint`
Expected: PASS.

- [ ] **Step 3: Smoke check**

Run: `pnpm dev`
- Open the invite dialog, select a department, pick roles, send. Toast appears, dialog closes.

- [ ] **Step 4: Commit**

```bash
git add src/features/users/components/user-invite-dialog.tsx
git commit -m "refactor(users): drop dead code in invite dialog"
```

---

## Task 12: Extract `UserStatusToggle` from header

**Why:** Step 1 of splitting `UserDetailsHeader` per finding #9. The status toggle + its confirm dialog are self-contained.

**Files:**
- Create: `src/features/users/components/user-status-toggle.tsx`
- Create: `src/__tests__/users/components/user-status-toggle.test.tsx`
- Modify: `src/features/users/components/user-details-header.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// src/__tests__/users/components/user-status-toggle.test.tsx
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { UserStatusToggle } from "@/features/users/components/user-status-toggle";

const mutateAsync = vi.fn().mockResolvedValue({ success: true });

vi.mock("@/features/users/use-users", () => ({
  useUpdateUserStatus: () => ({ mutateAsync, isPending: false }),
}));

vi.mock("@igrp/igrp-framework-react-design-system", async () => ({
  IGRPButton: ({ children, onClick }: any) => (
    <button onClick={onClick}>{children}</button>
  ),
  IGRPIcon: () => null,
  AlertDialog: ({ open, children }: any) => (open ? <div>{children}</div> : null),
  AlertDialogContent: ({ children }: any) => <div>{children}</div>,
  AlertDialogHeader: ({ children }: any) => <div>{children}</div>,
  AlertDialogTitle: ({ children }: any) => <h2>{children}</h2>,
  AlertDialogDescription: ({ children }: any) => <p>{children}</p>,
  AlertDialogFooter: ({ children }: any) => <div>{children}</div>,
  useIGRPToast: () => ({ igrpToast: vi.fn() }),
  cn: (...c: string[]) => c.filter(Boolean).join(" "),
}));

function wrapper({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={new QueryClient()}>
      {children}
    </QueryClientProvider>
  );
}

describe("UserStatusToggle", () => {
  it("invokes updateStatus with INACTIVE when toggling an active user", async () => {
    render(
      <UserStatusToggle
        user={{ id: "u1", name: "A", status: "ACTIVE" } as any}
      />,
      { wrapper },
    );

    await userEvent.click(screen.getByRole("button", { name: /desativar/i }));
    await userEvent.click(
      screen.getByRole("button", { name: /confirmar desativar/i }),
    );

    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalledWith({ id: "u1", value: "INACTIVE" });
    });
  });
});
```

- [ ] **Step 2: Run, expect fail**

Run: `pnpm vitest run src/__tests__/users/components/user-status-toggle.test.tsx`
Expected: FAIL — module does not exist.

- [ ] **Step 3: Create the component**

```tsx
// src/features/users/components/user-status-toggle.tsx
"use client";

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  cn,
  IGRPButton,
  IGRPIcon,
  useIGRPToast,
} from "@igrp/igrp-framework-react-design-system";
import type { IGRPUserDTO } from "@igrp/platform-access-management-client-ts";
import { useState } from "react";
import { useUpdateUserStatus } from "@/features/users/use-users";

interface UserStatusToggleProps {
  user: IGRPUserDTO;
}

export function UserStatusToggle({ user }: UserStatusToggleProps) {
  const { igrpToast } = useIGRPToast();
  const { mutateAsync: updateStatus, isPending } = useUpdateUserStatus();
  const [open, setOpen] = useState(false);
  const isActive = user.status === "ACTIVE";

  const handleConfirm = async () => {
    const value = isActive ? "INACTIVE" : "ACTIVE";
    try {
      const res = await updateStatus({ id: user.id, value });
      if (!res.success) throw new Error(res.error);
      setOpen(false);
      igrpToast({
        type: "success",
        title: `Utilizador ${isActive ? "desativado" : "ativado"} com sucesso`,
        duration: 4000,
      });
    } catch (err) {
      igrpToast({
        type: "error",
        title: "Erro ao alterar estado",
        description: (err as Error).message,
        duration: 4000,
      });
    }
  };

  return (
    <>
      <IGRPButton
        showIcon
        variant={isActive ? "destructive" : "default"}
        iconName={isActive ? "Ban" : "Check"}
        size="sm"
        onClick={() => setOpen(true)}
      >
        {isActive ? "Desativar" : "Ativar"}
      </IGRPButton>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <IGRPIcon
                iconName="AlertTriangle"
                className="w-5 h-5 text-destructive"
                strokeWidth={2}
              />
              {isActive ? "Desativar" : "Ativar"} Utilizador
            </AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja {isActive ? "desativar" : "ativar"} o
              utilizador <strong className="text-foreground">{user.name}</strong>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <IGRPButton
              disabled={isPending}
              variant="outline"
              onClick={() => setOpen(false)}
              type="button"
              showIcon
              iconPlacement="start"
              iconName="X"
            >
              Cancelar
            </IGRPButton>
            <IGRPButton
              onClick={handleConfirm}
              disabled={isPending}
              className={cn(
                isActive
                  ? "bg-destructive hover:bg-destructive/90"
                  : "bg-primary hover:bg-primary/90",
                "gap-2 text-white",
              )}
            >
              {isPending ? (
                <IGRPIcon iconName="LoaderCircle" className="animate-spin" />
              ) : (
                <IGRPIcon iconName={isActive ? "Ban" : "Check"} />
              )}
              {isActive ? "Confirmar Desativar" : "Confirmar Ativar"}
            </IGRPButton>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
```

- [ ] **Step 4: Run, expect pass**

Run: `pnpm vitest run src/__tests__/users/components/user-status-toggle.test.tsx`
Expected: PASS.

- [ ] **Step 5: Wire into header (replace inline status block)**

In `user-details-header.tsx`:
- Add: `import { UserStatusToggle } from "./user-status-toggle";`
- Remove: `showStatusDialog` state, `isUpdatingStatus` state, `handleToggleStatus`, and the entire `<AlertDialog>` JSX block at the bottom.
- Remove: `useUpdateUserStatus`/`useUpdateUser`-status-related code introduced in Task 5.
- Replace the existing status `<IGRPButton ...>` in the header with `<UserStatusToggle user={user} />`.

- [ ] **Step 6: Commit**

```bash
git add src/features/users/components/user-status-toggle.tsx \
        src/features/users/components/user-details-header.tsx \
        src/__tests__/users/components/user-status-toggle.test.tsx
git commit -m "refactor(users): extract UserStatusToggle from details header"
```

---

## Task 13: Extract `UserNameEditor` from header

**Why:** Inline name edit is independent UI with its own state machine.

**Files:**
- Create: `src/features/users/components/user-name-editor.tsx`
- Create: `src/__tests__/users/components/user-name-editor.test.tsx`
- Modify: `src/features/users/components/user-details-header.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// src/__tests__/users/components/user-name-editor.test.tsx
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { UserNameEditor } from "@/features/users/components/user-name-editor";

const mutateAsync = vi.fn().mockResolvedValue({ success: true });

vi.mock("@/features/users/use-users", () => ({
  useUpdateUser: () => ({ mutateAsync }),
}));

vi.mock("@igrp/igrp-framework-react-design-system", async () => ({
  IGRPButton: ({ children, onClick }: any) => (
    <button onClick={onClick}>{children}</button>
  ),
  IGRPIcon: () => null,
  IGRPInputText: (props: any) => <input {...props} />,
  useIGRPToast: () => ({ igrpToast: vi.fn() }),
}));

function wrapper({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={new QueryClient()}>
      {children}
    </QueryClientProvider>
  );
}

describe("UserNameEditor", () => {
  it("calls updateUser with trimmed new name", async () => {
    render(<UserNameEditor user={{ id: "u1", name: "Old", email: "a@b" } as any} />, {
      wrapper,
    });

    await userEvent.click(screen.getByRole("button", { name: "" }));
    const input = screen.getByDisplayValue("Old");
    await userEvent.clear(input);
    await userEvent.type(input, "  New name  ");
    await userEvent.keyboard("{Enter}");

    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          id: "u1",
          user: expect.objectContaining({ name: "New name" }),
        }),
      );
    });
  });

  it("does not call updateUser when name is unchanged", async () => {
    mutateAsync.mockClear();
    render(<UserNameEditor user={{ id: "u1", name: "Same", email: "a@b" } as any} />, {
      wrapper,
    });

    await userEvent.click(screen.getByRole("button", { name: "" }));
    await userEvent.keyboard("{Enter}");
    expect(mutateAsync).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run, expect fail**

Run: `pnpm vitest run src/__tests__/users/components/user-name-editor.test.tsx`
Expected: FAIL — module does not exist.

- [ ] **Step 3: Create the component**

```tsx
// src/features/users/components/user-name-editor.tsx
"use client";

import {
  IGRPButton,
  IGRPIcon,
  IGRPInputText,
  useIGRPToast,
} from "@igrp/igrp-framework-react-design-system";
import type { IGRPUserDTO } from "@igrp/platform-access-management-client-ts";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useUpdateUser } from "@/features/users/use-users";

interface UserNameEditorProps {
  user: IGRPUserDTO;
}

export function UserNameEditor({ user }: UserNameEditorProps) {
  const { mutateAsync: updateUser } = useUpdateUser();
  const { igrpToast } = useIGRPToast();
  const queryClient = useQueryClient();

  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState("");

  const open = () => {
    setValue(user.name || "");
    setEditing(true);
  };

  const save = async () => {
    const trimmed = value.trim();
    if (!trimmed || trimmed === user.name) {
      setEditing(false);
      return;
    }
    try {
      const res = await updateUser({
        id: user.id,
        user: { ...user, name: trimmed },
      });
      if (!res.success) throw new Error(res.error);
      await queryClient.invalidateQueries({ queryKey: ["user", user.id] });
      await queryClient.invalidateQueries({ queryKey: ["users"] });
      setEditing(false);
      igrpToast({
        type: "success",
        title: "Nome atualizado com sucesso",
        duration: 4000,
      });
    } catch (err) {
      igrpToast({
        type: "error",
        title: "Erro ao atualizar nome",
        description: (err as Error).message,
        duration: 4000,
      });
    }
  };

  if (editing) {
    return (
      <div className="flex items-center gap-2 mb-1">
        <IGRPInputText
          value={value}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setValue(e.target.value)
          }
          onKeyDown={(e: React.KeyboardEvent) => {
            if (e.key === "Enter") save();
            if (e.key === "Escape") setEditing(false);
          }}
          className="text-2xl font-bold tracking-tight h-10"
          autoFocus
        />
        <IGRPButton size="sm" variant="ghost" onClick={save}>
          <IGRPIcon iconName="Check" className="w-4 h-4" />
        </IGRPButton>
        <IGRPButton size="sm" variant="ghost" onClick={() => setEditing(false)}>
          <IGRPIcon iconName="X" className="w-4 h-4" />
        </IGRPButton>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 mb-1 group">
      <h1 className="text-2xl font-bold tracking-tight">
        {user.name || "N/A"}
      </h1>
      <IGRPButton
        size="sm"
        variant="ghost"
        className="opacity-100 transition-opacity"
        onClick={open}
      >
        <IGRPIcon iconName="Pencil" className="w-4 h-4" />
      </IGRPButton>
    </div>
  );
}
```

- [ ] **Step 4: Run, expect pass**

Run: `pnpm vitest run src/__tests__/users/components/user-name-editor.test.tsx`
Expected: PASS.

- [ ] **Step 5: Wire into header**

In `user-details-header.tsx`:
- Add: `import { UserNameEditor } from "./user-name-editor";`
- Remove: `isEditingName`, `editedName` state, `handleSaveName`, the whole `isEditingName ? ... : ...` JSX block.
- Replace with: `<UserNameEditor user={user} />`.

- [ ] **Step 6: Commit**

```bash
git add src/features/users/components/user-name-editor.tsx \
        src/features/users/components/user-details-header.tsx \
        src/__tests__/users/components/user-name-editor.test.tsx
git commit -m "refactor(users): extract UserNameEditor from details header"
```

---

## Task 14: Extract `UserAvatarUploader` from header and shrink the header

**Why:** Final step of finding #9. Avatar upload (which today is just a click target — there is no `onChange` handler on the hidden `<input ref={avatarInputRef}>` at all, suggesting half-finished work) becomes its own component. The remaining `UserDetailsHeader` becomes a thin composition shell.

**Files:**
- Create: `src/features/users/components/user-avatar-uploader.tsx`
- Modify: `src/features/users/components/user-details-header.tsx`

> Note: the original header references `avatarInputRef` but **never renders an `<input type="file" ref={avatarInputRef} />`** — clicking the avatar currently throws on `current.click()` because `current` is `null`. This task fixes that by adding a real hidden file input wired to `useUploadPublicFiles` + `updateUser({ picture })`. If product wants the upload to remain disabled, replace the body with `onClick={undefined}` instead.

- [ ] **Step 1: Create the component**

```tsx
// src/features/users/components/user-avatar-uploader.tsx
"use client";

import {
  cn,
  IGRPIcon,
  IGRPUserAvatar,
  useIGRPToast,
} from "@igrp/igrp-framework-react-design-system";
import type { IGRPUserDTO } from "@igrp/platform-access-management-client-ts";
import { useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { useFiles, useUploadPublicFiles } from "@/features/files/use-files";
import { useUpdateUser } from "@/features/users/use-users";
import { getInitials } from "@/lib/utils";

interface UserAvatarUploaderProps {
  user: IGRPUserDTO;
}

export function UserAvatarUploader({ user }: UserAvatarUploaderProps) {
  const { data: avatarUrl, isLoading: isLoadingFile } = useFiles(
    user?.picture || "",
  );
  const { mutateAsync: updateUser } = useUpdateUser();
  const uploadFile = useUploadPublicFiles();
  const queryClient = useQueryClient();
  const { igrpToast } = useIGRPToast();

  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setUploading] = useState(false);

  const currentAvatarUrl = avatarUrl?.url || null;

  const handlePick = () => inputRef.current?.click();

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    try {
      const uploaded = await uploadFile.mutateAsync(file);
      if (!uploaded?.path) throw new Error("Upload sem caminho");
      const res = await updateUser({
        id: user.id,
        user: { ...user, picture: uploaded.path },
      });
      if (!res.success) throw new Error(res.error);
      await queryClient.invalidateQueries({ queryKey: ["user", user.id] });
      igrpToast({ type: "success", title: "Foto atualizada", duration: 4000 });
    } catch (err) {
      igrpToast({
        type: "error",
        title: "Erro ao atualizar foto",
        description: (err as Error).message,
        duration: 4000,
      });
    } finally {
      setUploading(false);
    }
  };

  const busy = isLoadingFile || isUploading;

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFile}
      />
      <button
        type="button"
        className="relative group cursor-pointer p-0 border-0 bg-transparent"
        onClick={handlePick}
      >
        <div className="absolute -inset-1 rounded-full blur opacity-75 group-hover:opacity-100 transition" />
        <IGRPUserAvatar
          alt={user?.name}
          image={currentAvatarUrl}
          fallbackContent={
            busy ? (
              <div className="flex items-center justify-center w-full h-full bg-muted/50 animate-pulse">
                <IGRPIcon
                  iconName="LoaderCircle"
                  className="w-8 h-8 text-muted-foreground animate-spin"
                />
              </div>
            ) : (
              getInitials(user?.name || user?.email || "")
            )
          }
          className="relative size-28 bg-background border-4 border-background shadow-lg transition-transform duration-300 group-hover:scale-105"
          fallbackClass="text-3xl"
        />
        <div className="absolute -bottom-1 -right-1 bg-background rounded-full p-2 shadow-md border border-border group-hover:border-primary transition-colors">
          <IGRPIcon
            iconName={busy ? "LoaderCircle" : "Camera"}
            className={cn(
              "w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors",
              busy && "animate-spin",
            )}
          />
        </div>
      </button>
    </>
  );
}
```

- [ ] **Step 2: Rewrite the now-thin header**

```tsx
// src/features/users/components/user-details-header.tsx
"use client";

import { Card, CardContent } from "@igrp/igrp-framework-react-design-system";
import type { IGRPUserDTO } from "@igrp/platform-access-management-client-ts";
import { UserAvatarUploader } from "./user-avatar-uploader";
import { UserNameEditor } from "./user-name-editor";
import { UserStatusToggle } from "./user-status-toggle";

interface UserDetailsHeaderProps {
  user: IGRPUserDTO;
}

export function UserDetailsHeader({ user }: UserDetailsHeaderProps) {
  return (
    <div className="relative">
      <div className="absolute inset-0 rounded-xl -z-10" />
      <Card className="py-2 border-0 shadow-sm">
        <CardContent className="px-4 py-1">
          <div className="flex items-center mb-2 justify-end">
            <UserStatusToggle user={user} />
          </div>
          <div className="flex items-center gap-6">
            <UserAvatarUploader user={user} />
            <div className="flex-1">
              <UserNameEditor user={user} />
              <p className="text-muted-foreground">{user.email}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

- [ ] **Step 3: Type-check and smoke check**

Run: `pnpm tsc --noEmit && pnpm vitest run src/__tests__/users`
Expected: PASS.

Manual: load `/settings/users/<id>`, click avatar, choose a small image. New picture appears within seconds. Toast confirms.

- [ ] **Step 4: Commit**

```bash
git add src/features/users/components/user-avatar-uploader.tsx \
        src/features/users/components/user-details-header.tsx
git commit -m "refactor(users): extract UserAvatarUploader and slim down header"
```

---

## Task 15: Wire a real refetch for `UserSignature`

**Why:** [user-details-tabs.tsx:90](../../../src/features/users/components/user-details-tabs.tsx#L90) passes `refetch={() => undefined}`. [user-signature.tsx:64](../../../src/features/users/components/user-signature.tsx#L64) actually calls `refetch()` after upload — so after saving, the parent is never re-rendered to reflect the new `user.signature` path. The user-visible bug: signature shows old preview until full page reload.

**Files:**
- Modify: `src/features/users/components/user-details-tabs.tsx:87-91`
- Modify: `src/features/users/components/user-signature.tsx` (remove `refetch` from public API)

- [ ] **Step 1: Change `UserSignature` to invalidate the detail query directly**

In `user-signature.tsx`:
- Remove the `refetch` prop entirely from the component signature.
- Add `const queryClient = useQueryClient();` (import from `@tanstack/react-query`).
- Replace `refetch();` (line ~64) with:
  ```ts
  await queryClient.invalidateQueries({ queryKey: ["user", user.id] });
  ```

- [ ] **Step 2: Update tabs**

In `user-details-tabs.tsx` change the signature panel JSX to:

```tsx
<TabsContent value="signature">
  <TabPanel>
    <UserSignature user={user} />
  </TabPanel>
</TabsContent>
```

- [ ] **Step 3: Type-check + manual**

Run: `pnpm tsc --noEmit`
Expected: PASS.

Manual: upload a new signature image on the detail page → preview updates without reload.

- [ ] **Step 4: Commit**

```bash
git add src/features/users/components/user-signature.tsx \
        src/features/users/components/user-details-tabs.tsx
git commit -m "fix(users): refresh detail query after signature upload"
```

---

## Task 16: Lazy-mount tab panels

**Why:** Radix `Tabs` keeps inactive panels mounted; combined with seven tabs each running their own query (roles, departments, applications, signature, sessions, audit, metadata), every tab's data fetches on the first render of the page even though only `roles` is visible.

**Files:**
- Modify: `src/features/users/components/user-details-tabs.tsx`
- Create: `src/__tests__/users/components/user-details-tabs.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// src/__tests__/users/components/user-details-tabs.test.tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { UserDetailsTabs } from "@/features/users/components/user-details-tabs";

vi.mock("@/features/users/components/user-role-list", () => ({
  default: () => <div data-testid="role-list" />,
}));
vi.mock("@/features/departments/components/dept-list-simple-container", () => ({
  DepartmentListSimple: () => <div data-testid="dept-list" />,
}));
vi.mock("@/features/users/components/user-applications", () => ({
  default: () => <div data-testid="apps" />,
}));
vi.mock("@/features/users/components/user-signature", () => ({
  default: () => <div data-testid="signature" />,
}));
vi.mock("@/features/users/components/user-audit-tab", () => ({
  UserAuditLogTab: () => <div data-testid="audit" />,
}));
vi.mock("@/features/users/components/user-metadata-panel", () => ({
  UserMetadataPanel: () => <div data-testid="metadata" />,
}));
vi.mock("@/features/users/components/user-sessions-tab", () => ({
  UserSessionsTab: () => <div data-testid="sessions" />,
}));

function wrapper({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={new QueryClient()}>
      {children}
    </QueryClientProvider>
  );
}

describe("UserDetailsTabs lazy mounting", () => {
  const user = { id: "u1", username: "u1" } as any;

  it("mounts only the active tab on initial render", () => {
    render(<UserDetailsTabs user={user} />, { wrapper });
    expect(screen.getByTestId("role-list")).toBeInTheDocument();
    expect(screen.queryByTestId("audit")).not.toBeInTheDocument();
    expect(screen.queryByTestId("metadata")).not.toBeInTheDocument();
  });

  it("mounts a tab when it is clicked", async () => {
    render(<UserDetailsTabs user={user} />, { wrapper });
    await userEvent.click(screen.getByRole("tab", { name: /auditoria/i }));
    expect(screen.getByTestId("audit")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run, expect fail**

Run: `pnpm vitest run src/__tests__/users/components/user-details-tabs.test.tsx`
Expected: FAIL — all panels mount eagerly.

- [ ] **Step 3: Track the active tab and gate panel rendering**

Rewrite `UserDetailsTabs` to track the active tab and only render the active panel's body. Other `<TabsContent>` slots render empty `null` so Radix still owns tab keyboard behavior.

```tsx
// src/features/users/components/user-details-tabs.tsx
"use client";

import type { IGRPUserDTO } from "@igrp/platform-access-management-client-ts";
import { Suspense, useState } from "react";
import { ErrorBoundary, type FallbackProps } from "react-error-boundary";
import {
  IGRPButton,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@igrp/igrp-framework-react-design-system";
import { DepartmentListSimple } from "@/features/departments/components/dept-list-simple-container";
import UserApplications from "./user-applications";
import UserRoleList from "./user-role-list";
import UserSignature from "./user-signature";
import { UserAuditLogTab } from "./user-audit-tab";
import { UserMetadataPanel } from "./user-metadata-panel";
import { UserSessionsTab } from "./user-sessions-tab";

type TabValue =
  | "roles"
  | "departments"
  | "applications"
  | "signature"
  | "sessions"
  | "audit"
  | "metadata";

function TabSkeleton() {
  return (
    <div className="flex flex-col gap-3 p-4 animate-pulse">
      <div className="h-4 w-3/4 rounded bg-muted" />
      <div className="h-4 w-1/2 rounded bg-muted" />
      <div className="h-4 w-2/3 rounded bg-muted" />
    </div>
  );
}

function TabError({ error, resetErrorBoundary }: FallbackProps) {
  const message =
    error instanceof Error ? error.message : "Erro ao carregar dados";
  return (
    <div className="flex flex-col items-center gap-3 p-6 text-sm text-destructive">
      <p>{message}</p>
      <IGRPButton size="sm" onClick={resetErrorBoundary}>
        Tentar novamente
      </IGRPButton>
    </div>
  );
}

function TabPanel({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary FallbackComponent={TabError}>
      <Suspense fallback={<TabSkeleton />}>{children}</Suspense>
    </ErrorBoundary>
  );
}

interface UserDetailsTabsProps {
  user: IGRPUserDTO;
}

export function UserDetailsTabs({ user }: UserDetailsTabsProps) {
  const [active, setActive] = useState<TabValue>("roles");

  return (
    <Tabs value={active} onValueChange={(v) => setActive(v as TabValue)}>
      <TabsList>
        <TabsTrigger value="roles">Perfis</TabsTrigger>
        <TabsTrigger value="departments">Departamentos</TabsTrigger>
        <TabsTrigger value="applications">Aplicações</TabsTrigger>
        <TabsTrigger value="signature">Assinatura</TabsTrigger>
        <TabsTrigger value="sessions">Sessões</TabsTrigger>
        <TabsTrigger value="audit">Auditoria</TabsTrigger>
        <TabsTrigger value="metadata">Metadados</TabsTrigger>
      </TabsList>

      <TabsContent value="roles">
        {active === "roles" && (
          <TabPanel>
            <UserRoleList user={user} />
          </TabPanel>
        )}
      </TabsContent>
      <TabsContent value="departments">
        {active === "departments" && (
          <TabPanel>
            <DepartmentListSimple user={user} />
          </TabPanel>
        )}
      </TabsContent>
      <TabsContent value="applications">
        {active === "applications" && (
          <TabPanel>
            <UserApplications user={user} />
          </TabPanel>
        )}
      </TabsContent>
      <TabsContent value="signature">
        {active === "signature" && (
          <TabPanel>
            <UserSignature user={user} />
          </TabPanel>
        )}
      </TabsContent>
      <TabsContent value="sessions">
        {active === "sessions" && user.username && (
          <TabPanel>
            <UserSessionsTab username={user.username} />
          </TabPanel>
        )}
      </TabsContent>
      <TabsContent value="audit">
        {active === "audit" && (
          <TabPanel>
            <UserAuditLogTab userId={String(user.id)} />
          </TabPanel>
        )}
      </TabsContent>
      <TabsContent value="metadata">
        {active === "metadata" && (
          <TabPanel>
            <UserMetadataPanel userId={user.id} />
          </TabPanel>
        )}
      </TabsContent>
    </Tabs>
  );
}
```

- [ ] **Step 4: Run, expect pass**

Run: `pnpm vitest run src/__tests__/users/components/user-details-tabs.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/users/components/user-details-tabs.tsx \
        src/__tests__/users/components/user-details-tabs.test.tsx
git commit -m "perf(users): lazy-mount tab panels on user detail page"
```

---

## Task 17: Final verification pass

**Files:** none (verification only).

- [ ] **Step 1: Full test run**

Run: `pnpm vitest run`
Expected: All tests pass.

- [ ] **Step 2: Type-check + lint**

Run: `pnpm tsc --noEmit && pnpm lint`
Expected: PASS.

- [ ] **Step 3: Manual end-to-end smoke**

Run: `pnpm dev`
Walk through this checklist in a browser:
- `/settings/users` loads with active users tab populated.
- Switch to "Convites Pendentes": pending invites show; row menu shows Copiar URL, Reenviar, Cancelar.
- Switch to "Convites Cancelados": row menu shows ONLY a (currently empty) menu — or if Reenviar was kept disabled for canceled (per Task 6), exactly that.
- Invite a new user; toast confirms; pending count increments.
- Toggle active user → inactive from the list. Detail page reflects the change.
- Open a user; click avatar; upload image; new image appears.
- Inline edit the user's name; saves and persists across reload.
- Click each tab; only the active one fires network requests (check devtools Network).
- Force an error (e.g., point `getUsers` action to a bad URL temporarily): the new `users/error.tsx` boundary renders.

- [ ] **Step 4: Final commit if any docs need updating, otherwise stop**

If [AGENTS.md](../../../AGENTS.md) lists the users feature components, refresh the list. Otherwise no commit.

---

## Self-Review

**Spec coverage** — all 15 findings mapped:
- #1 (waterfalls in detail page) → addressed via Task 16 (lazy mount removes the all-tabs fetch problem). Full streaming via server-rendering a fetched-promise was not added because it requires a server-side `roles` fetch that does not currently exist; revisit in a follow-up plan if needed.
- #2 (status flow unified) → Task 5 + Task 12.
- #3 (dedupe invite columns) → Task 7.
- #4 (gate resend) → Task 6.
- #5 (query key) → Task 1.
- #6 (single-pass filter) → Task 8.
- #7 (dialog state) → Task 10.
- #8 (split header) → Tasks 12–14.
- #9 (DTO spread risk) → Task 5 removes the status path; name-edit still spreads, but that's the only field that legitimately needs the full payload through the current `updateUser` action; called out in Task 13.
- #10 (double navigation from useRouter) → Task 9.
- #11 (mutation per row) — left intentionally; documented as accepted trade-off in review.
- #12 (no error boundary) → Task 4.
- #13 (eager tab mounts) → Task 16.
- #14 (no-op refetch) → Task 15.
- #15 (dead code in invite dialog) → Task 11.

**Placeholder scan** — no TBDs, no "implement later", every step has either complete code or a concrete command with expected output.

**Type consistency** — `useUpdateUserStatus`, `UserStatusToggle`, `UserNameEditor`, `UserAvatarUploader`, `useUsers(params)` signatures match across tasks. `DialogState` type used consistently. Query keys `["user", id]` and `["users"]` consistent across Tasks 1, 2, 5, 13, 15.

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-05-25-users-flow-cleanup.md`. Two execution options:

**1. Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** — Execute tasks in this session using executing-plans, batch execution with checkpoints

Which approach?
