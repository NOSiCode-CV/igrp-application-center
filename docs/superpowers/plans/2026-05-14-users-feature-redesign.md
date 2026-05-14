# Users Feature Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor `/settings/users` to RSC-first architecture, decompose large components, and add four new SDK-powered admin features: temporary roles, sessions tab, audit log tab, and user metadata panel.

**Architecture:** RSC pages (`page.tsx`) fetch initial data server-side and pass it as `initialData` to client components. React Query retains ownership of mutations and background refetches. Each `UserDetails` tab panel is isolated in its own `Suspense` + `ErrorBoundary` so a failing tab doesn't break the page.

**Tech Stack:** Next.js 15, React 19, TypeScript, `@igrp/platform-access-management-client-ts`, `@igrp/igrp-framework-react-design-system`, `@tanstack/react-query`, `react-hook-form`, `zod`, Vitest + Testing Library (added in Task 1).

**Spec:** `docs/superpowers/specs/2026-05-14-users-feature-redesign-design.md`

---

## File Map

| File | Status | Responsibility |
|---|---|---|
| `vitest.config.ts` | Create | Vitest + jsdom config |
| `src/test-setup.ts` | Create | Testing Library matchers + server-only mock |
| `src/features/users/lib/role-diff.ts` | Create | Pure role diff utility |
| `src/__tests__/users/lib/role-diff.test.ts` | Create | Unit tests for role-diff |
| `src/__tests__/users/components/user-role-dialog.test.tsx` | Create | Component test for expiresAt |
| `src/__tests__/users/components/user-metadata-panel.test.tsx` | Create | Component test for metadata CRUD |
| `src/__tests__/users/components/user-sessions-tab.test.tsx` | Create | Component test for kill flow |
| `src/actions/user.ts` | Modify | Add metadata actions; fix `addRolesToUser` signature |
| `src/actions/user-sessions.ts` | Create | `getUserSession`, `killUserSession` |
| `src/actions/user-audit.ts` | Create | `getUserAuditLogs` |
| `src/features/users/use-users.ts` | Modify | Update `useAddUserRole`; update `useUsers` for `initialData`; add 5 new hooks |
| `src/app/(igrp)/(home)/settings/users/page.tsx` | Modify | RSC: reads `searchParams`, fetches users, passes `initialData` |
| `src/features/users/components/user-list-filters.tsx` | Create | Search + filter bar; pushes URL search params |
| `src/features/users/components/user-list-table.tsx` | Create | Extracted interactive table from `user-list.tsx` |
| `src/app/(igrp)/(home)/settings/users/[id]/page.tsx` | Modify | RSC: fetches user server-side, passes to shell |
| `src/features/users/components/user-details-header.tsx` | Create | Extracted header: avatar, editable name, status toggle |
| `src/features/users/components/user-details-tabs.tsx` | Create | Tab shell with `Suspense` + `ErrorBoundary` per panel |
| `src/features/users/components/user-role-dialog.tsx` | Modify | Add `expiresAt` date column; use `computeRoleDiff` |
| `src/features/users/components/user-metadata-panel.tsx` | Create | Key/value metadata editor |
| `src/features/users/components/user-sessions-tab.tsx` | Create | Session list + kill action |
| `src/features/users/components/user-audit-tab.tsx` | Create | Paginated audit log table |
| `src/features/users/user-schema.ts` | Modify | Add `username?: string` |
| `.gitignore` | Modify | Add `.superpowers/` |

---

## Task 1: Set Up Vitest + Testing Library

**Files:**
- Create: `vitest.config.ts`
- Create: `src/test-setup.ts`
- Modify: `package.json` (add `test` script)

- [ ] **Step 1: Install dependencies**

```bash
npm install -D vitest @vitejs/plugin-react @testing-library/react @testing-library/user-event @testing-library/jest-dom jsdom
```

Expected: packages installed, no peer-dep errors.

- [ ] **Step 2: Create `vitest.config.ts`**

```ts
import path from "path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test-setup.ts"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
```

- [ ] **Step 3: Create `src/test-setup.ts`**

```ts
import "@testing-library/jest-dom";
import { vi } from "vitest";

// Next.js server-only guard — not meaningful in tests
vi.mock("server-only", () => ({}));

// next/navigation — prevent errors in component tests
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/settings/users",
}));
```

- [ ] **Step 4: Add test script to `package.json`**

In the `"scripts"` block add:

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 5: Smoke test — verify setup works**

Create `src/__tests__/smoke.test.ts`:

```ts
import { describe, expect, it } from "vitest";

describe("vitest setup", () => {
  it("runs", () => {
    expect(1 + 1).toBe(2);
  });
});
```

Run: `npm test`
Expected: `1 passed`.

- [ ] **Step 6: Commit**

```bash
git add vitest.config.ts src/test-setup.ts src/__tests__/smoke.test.ts package.json
git commit -m "chore: add vitest + testing-library setup"
```

---

## Task 2: `role-diff` Utility (TDD)

**Files:**
- Create: `src/features/users/lib/role-diff.ts`
- Create: `src/__tests__/users/lib/role-diff.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `src/__tests__/users/lib/role-diff.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { computeRoleDiff } from "@/features/users/lib/role-diff";

describe("computeRoleDiff", () => {
  it("adds roles not in current", () => {
    const { toAdd, toRemove } = computeRoleDiff(["A"], ["A", "B"]);
    expect(toAdd.roles).toEqual(["B"]);
    expect(toRemove).toEqual([]);
  });

  it("removes roles not in selected", () => {
    const { toAdd, toRemove } = computeRoleDiff(["A", "B"], ["A"]);
    expect(toAdd.roles).toEqual([]);
    expect(toRemove).toEqual(["B"]);
  });

  it("handles add and remove simultaneously", () => {
    const { toAdd, toRemove } = computeRoleDiff(["A", "B"], ["B", "C"]);
    expect(toAdd.roles).toEqual(["C"]);
    expect(toRemove).toEqual(["A"]);
  });

  it("includes expiresAt when provided", () => {
    const { toAdd } = computeRoleDiff([], ["A"], "2026-12-31");
    expect(toAdd.expiresAt).toBe("2026-12-31");
  });

  it("omits expiresAt when not provided", () => {
    const { toAdd } = computeRoleDiff([], ["A"]);
    expect("expiresAt" in toAdd).toBe(false);
  });

  it("returns empty diff when nothing changes", () => {
    const { toAdd, toRemove } = computeRoleDiff(["A", "B"], ["A", "B"]);
    expect(toAdd.roles).toEqual([]);
    expect(toRemove).toEqual([]);
  });
});
```

- [ ] **Step 2: Run — verify tests fail**

```bash
npm test -- role-diff
```

Expected: FAIL — `Cannot find module '@/features/users/lib/role-diff'`.

- [ ] **Step 3: Create `src/features/users/lib/role-diff.ts`**

```ts
import type { AddRolesToUserRequestDTO } from "@igrp/platform-access-management-client-ts";

export interface RoleDiffResult {
  toAdd: AddRolesToUserRequestDTO;
  toRemove: string[];
}

export function computeRoleDiff(
  current: string[],
  selected: string[],
  expiresAt?: string,
): RoleDiffResult {
  const currentSet = new Set(current);
  const selectedSet = new Set(selected);

  const rolesToAdd = selected.filter((r) => !currentSet.has(r));
  const toRemove = current.filter((r) => !selectedSet.has(r));

  return {
    toAdd: {
      roles: rolesToAdd,
      ...(expiresAt !== undefined ? { expiresAt } : {}),
    },
    toRemove,
  };
}
```

- [ ] **Step 4: Run — verify tests pass**

```bash
npm test -- role-diff
```

Expected: `6 passed`.

- [ ] **Step 5: Commit**

```bash
git add src/features/users/lib/role-diff.ts src/__tests__/users/lib/role-diff.test.ts
git commit -m "feat(users): add computeRoleDiff utility with expiresAt support"
```

---

## Task 3: Fix `addRolesToUser` Type (Action + Hook)

**Files:**
- Modify: `src/actions/user.ts` (lines 59–77)
- Modify: `src/features/users/use-users.ts` (lines 88–109)

- [ ] **Step 1: Update action in `src/actions/user.ts`**

Replace the `addRolesToUser` function (currently lines 59–77):

```ts
export async function addRolesToUser(
  id: number,
  departmentCode: string,
  request: AddRolesToUserRequestDTO,
): Promise<ActionResult<RoleDTO>> {
  const client = await getClientAccess();

  try {
    const result = await client.users.addRolesToUser(
      id,
      departmentCode,
      request,
    );
    return { success: true, data: result.data };
  } catch (error: unknown) {
    console.error("[user-add-roles] Erro ao adicionar perfis:", error);
    return { success: false, error: extractApiError(error) };
  }
}
```

Add `AddRolesToUserRequestDTO` to the import at the top of the file:

```ts
import type {
  AddRolesToUserRequestDTO,
  ApplicationDTO,
  DepartmentDTO,
  IGRPUserDTO,
  InviteUserDTO,
  RoleDTO,
  UserFilters,
  UserInvitationResponseDTO,
} from "@igrp/platform-access-management-client-ts";
```

- [ ] **Step 2: Update hook in `src/features/users/use-users.ts`**

Replace `useAddUserRole` (currently lines 88–109):

```ts
export const useAddUserRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      departmentCode,
      request,
    }: {
      id: number;
      departmentCode: string;
      request: AddRolesToUserRequestDTO;
    }) => addRolesToUser(id, departmentCode, request),
    onSuccess: async (result) => {
      if (result.success) {
        await queryClient.invalidateQueries({ queryKey: ["users"] });
        await queryClient.refetchQueries({ queryKey: ["users"] });
      }
    },
    retry: false,
  });
};
```

Add `AddRolesToUserRequestDTO` to the import from the SDK at the top of `use-users.ts`.

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors on the modified files. Fix any call sites flagged by the compiler (search for `useAddUserRole` usages and update `roleCodes:` → `request:` at each call site).

- [ ] **Step 4: Commit**

```bash
git add src/actions/user.ts src/features/users/use-users.ts
git commit -m "fix(users): update addRolesToUser to accept AddRolesToUserRequestDTO"
```

---

## Task 4: New Server Actions (Metadata, Sessions, Audit)

**Files:**
- Modify: `src/actions/user.ts` (append metadata actions)
- Create: `src/actions/user-sessions.ts`
- Create: `src/actions/user-audit.ts`

- [ ] **Step 1: Add metadata actions to `src/actions/user.ts`**

Add these two imports to the SDK import block in `user.ts`:

```ts
import type {
  // ... existing imports ...
  UserMetadataDTO,
} from "@igrp/platform-access-management-client-ts";
```

Append to the bottom of `src/actions/user.ts`:

```ts
export async function getUserMetadata(
  id: number,
): Promise<ActionResult<UserMetadataDTO>> {
  const client = await getClientAccess();

  try {
    const result = await client.users.getUserMetadata(id);
    return { success: true, data: result.data };
  } catch (error) {
    console.error("[user-metadata] Erro ao carregar metadados:", error);
    return { success: false, error: extractApiError(error) };
  }
}

export async function updateUserMetadata(
  id: number,
  metadata: Record<string, unknown>,
): Promise<ActionResult<UserMetadataDTO>> {
  const client = await getClientAccess();

  try {
    const result = await client.users.updateUserMetadata(id, { metadata });
    return { success: true, data: result.data };
  } catch (error) {
    console.error("[user-metadata] Erro ao atualizar metadados:", error);
    return { success: false, error: extractApiError(error) };
  }
}
```

- [ ] **Step 2: Create `src/actions/user-sessions.ts`**

```ts
"use server";

import type {
  SessionResponseDTO,
} from "@igrp/platform-access-management-client-ts";
import { extractApiError } from "@/lib/utils";
import { getClientAccess } from "./access-client";
import type { ActionResult } from "./types";

export async function getUserSession(
  userExternalId: string,
): Promise<ActionResult<SessionResponseDTO>> {
  const client = await getClientAccess();

  try {
    const result = await client.adminSessions.getUserSession(userExternalId);
    return { success: true, data: result.data };
  } catch (error) {
    console.error("[user-session] Erro ao carregar sessão do utilizador:", error);
    return { success: false, error: extractApiError(error) };
  }
}

export async function killUserSession(
  sessionId: string,
  reason: string,
): Promise<ActionResult<void>> {
  const client = await getClientAccess();

  try {
    await client.adminSessions.killSession(sessionId, {
      reason,
      killedBy: "admin",
    });
    return { success: true, data: undefined };
  } catch (error) {
    console.error("[user-session] Erro ao terminar sessão:", error);
    return { success: false, error: extractApiError(error) };
  }
}
```

- [ ] **Step 3: Create `src/actions/user-audit.ts`**

```ts
"use server";

import type {
  AuditLogFilters,
  PageResponse,
  SecurityAuditLogDTO,
} from "@igrp/platform-access-management-client-ts";
import { extractApiError } from "@/lib/utils";
import { getClientAccess } from "./access-client";
import type { ActionResult } from "./types";

export async function getUserAuditLogs(
  userId: string,
  filters?: AuditLogFilters,
): Promise<ActionResult<PageResponse<SecurityAuditLogDTO>>> {
  const client = await getClientAccess();

  try {
    const result = await client.authAudit.getAuditLogsByUserId(userId, filters);
    return { success: true, data: result.data };
  } catch (error) {
    console.error("[user-audit] Erro ao carregar logs de auditoria:", error);
    return { success: false, error: extractApiError(error) };
  }
}
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors. If `PageResponse` is not exported by the SDK, check `dist/types/index.d.ts` — it may be `PageResponse<T>` under a different export name. Adjust the import accordingly.

- [ ] **Step 5: Commit**

```bash
git add src/actions/user.ts src/actions/user-sessions.ts src/actions/user-audit.ts
git commit -m "feat(users): add metadata, session, and audit server actions"
```

---

## Task 5: New React Query Hooks + Update `useUsers`

**Files:**
- Modify: `src/features/users/use-users.ts`

- [ ] **Step 1: Update `useUsers` to accept `initialData`**

Replace the `useUsers` hook at the top of `use-users.ts` (lines 49–59):

```ts
export const useUsers = (
  params?: UserFilters,
  options?: { initialData?: IGRPUserDTO[] },
) => {
  return useQuery<IGRPUserDTO[], Error>({
    queryKey: ["users"],
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

- [ ] **Step 2: Add new imports to `use-users.ts`**

Add to the SDK import block:

```ts
import type {
  // ... existing imports ...
  AuditLogFilters,
  PageResponse,
  SecurityAuditLogDTO,
  SessionResponseDTO,
  UserMetadataDTO,
} from "@igrp/platform-access-management-client-ts";
```

Add to the actions import block:

```ts
import {
  getUserAuditLogs,
} from "@/actions/user-audit";
import {
  getUserSession,
  killUserSession,
} from "@/actions/user-sessions";
import {
  getUserMetadata,
  updateUserMetadata,
} from "@/actions/user";
```

- [ ] **Step 3: Append new hooks to `use-users.ts`**

Add these five hooks at the bottom of the file:

```ts
export const useUserMetadata = (id: number) => {
  return useQuery<UserMetadataDTO, Error>({
    queryKey: ["userMetadata", id],
    queryFn: async () => {
      const result = await getUserMetadata(id);
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    enabled: !!id,
    retry: false,
  });
};

export const useUpdateUserMetadata = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      metadata,
    }: {
      id: number;
      metadata: Record<string, unknown>;
    }) => updateUserMetadata(id, metadata),
    onSuccess: async (result, variables) => {
      if (result.success) {
        await queryClient.invalidateQueries({
          queryKey: ["userMetadata", variables.id],
        });
      }
    },
    retry: false,
  });
};

export const useUserSession = (userExternalId: string | undefined) => {
  return useQuery<SessionResponseDTO, Error>({
    queryKey: ["userSession", userExternalId],
    queryFn: async () => {
      const result = await getUserSession(userExternalId!);
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    enabled: !!userExternalId,
    retry: false,
  });
};

export const useKillUserSession = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      sessionId,
      reason,
      userExternalId,
    }: {
      sessionId: string;
      reason: string;
      userExternalId: string;
    }) => killUserSession(sessionId, reason),
    onSuccess: async (result, variables) => {
      if (result.success) {
        await queryClient.invalidateQueries({
          queryKey: ["userSession", variables.userExternalId],
        });
      }
    },
    retry: false,
  });
};

export const useUserAuditLogs = (
  userId: string | undefined,
  filters?: AuditLogFilters,
) => {
  return useQuery<PageResponse<SecurityAuditLogDTO>, Error>({
    queryKey: ["userAuditLogs", userId, filters],
    queryFn: async () => {
      const result = await getUserAuditLogs(userId!, filters);
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    enabled: !!userId,
    retry: false,
  });
};
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/features/users/use-users.ts
git commit -m "feat(users): add metadata/session/audit hooks; update useUsers for initialData"
```

---

## Task 6: RSC User List Page + Filter Bar

**Files:**
- Modify: `src/app/(igrp)/(home)/settings/users/page.tsx`
- Create: `src/features/users/components/user-list-filters.tsx`

- [ ] **Step 1: Update `page.tsx` to fetch data server-side**

Replace the entire file:

```tsx
import { getUsers, getUserInvitations } from "@/actions/user";
import { UserListTable } from "@/features/users/components/user-list-table";
import { UserListFilters } from "@/features/users/components/user-list-filters";

export const dynamic = "force-dynamic";

export default async function UserPage({
  searchParams,
}: {
  searchParams: Promise<{
    name?: string;
    email?: string;
    departmentCode?: string;
  }>;
}) {
  const params = await searchParams;

  const [usersResult, invitationsResult] = await Promise.all([
    getUsers({
      name: params.name,
      email: params.email,
      departmentCode: params.departmentCode,
    }),
    getUserInvitations(),
  ]);

  const initialUsers = usersResult.success ? usersResult.data : [];
  const initialInvitations = invitationsResult.success
    ? invitationsResult.data
    : [];

  return (
    <div className="flex flex-col gap-4 p-6">
      <UserListFilters />
      <UserListTable
        initialUsers={initialUsers}
        initialInvitations={initialInvitations}
      />
    </div>
  );
}
```

- [ ] **Step 2: Create `src/features/users/components/user-list-filters.tsx`**

```tsx
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { Input } from "@igrp/igrp-framework-react-design-system";

export function UserListFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      router.push(`?${params.toString()}`);
    },
    [router, searchParams],
  );

  return (
    <div className="flex items-center gap-2">
      <Input
        placeholder="Pesquisar por nome..."
        defaultValue={searchParams.get("name") ?? ""}
        onChange={(e) => updateParam("name", e.target.value)}
        className="w-64"
      />
      <Input
        placeholder="Pesquisar por email..."
        defaultValue={searchParams.get("email") ?? ""}
        onChange={(e) => updateParam("email", e.target.value)}
        className="w-64"
      />
    </div>
  );
}
```

- [ ] **Step 3: Verify app still starts**

```bash
npm run dev
```

Navigate to `/settings/users`. The page will error because `UserListTable` does not exist yet — that is expected. Confirm the RSC page renders and `searchParams` are passed.

- [ ] **Step 4: Commit**

```bash
git add src/app/(igrp)/(home)/settings/users/page.tsx src/features/users/components/user-list-filters.tsx
git commit -m "feat(users): convert list page to RSC with searchParams + initialData"
```

---

## Task 7: Extract `UserListTable`

**Files:**
- Create: `src/features/users/components/user-list-table.tsx`
- Modify: `src/features/users/components/user-list.tsx` (delete or reduce to re-export)

- [ ] **Step 1: Create `user-list-table.tsx`**

Create `src/features/users/components/user-list-table.tsx`. Move the full contents of `user-list.tsx` into this file, then:

1. Rename the exported component from `UserList` to `UserListTable`.
2. Add props to the component signature:

```tsx
interface UserListTableProps {
  initialUsers: IGRPUserDTO[];
  initialInvitations: InvitationDTO[];
}

export function UserListTable({
  initialUsers,
  initialInvitations,
}: UserListTableProps) {
```

3. Update `useUsers()` call to pass `initialData`:

```tsx
const { data: users = initialUsers } = useUsers(undefined, {
  initialData: initialUsers,
});
```

4. Update `useGetUserInvitations()` to accept `initialData`. Find its definition in `use-users.ts`. Add an `options?: { initialData?: InvitationDTO[] }` parameter and pass `options?.initialData` to `useQuery`'s `initialData` field — the same pattern used for `useUsers` in Task 5. Then call it here as `useGetUserInvitations(undefined, { initialData: initialInvitations })`.

- [ ] **Step 2: Update `user-list.tsx` to re-export**

Replace the entire `user-list.tsx` with a re-export to avoid breaking any other imports:

```tsx
// Maintained for backwards-compat during migration
export { UserListTable as UserList } from "./user-list-table";
```

- [ ] **Step 3: Run type-check**

```bash
npx tsc --noEmit
```

Expected: no errors. Fix any type errors before continuing.

- [ ] **Step 4: Verify in browser**

```bash
npm run dev
```

Navigate to `/settings/users`. User list should display with data present on first render (no spinner). Search inputs should filter the list.

- [ ] **Step 5: Commit**

```bash
git add src/features/users/components/user-list-table.tsx src/features/users/components/user-list.tsx
git commit -m "refactor(users): extract UserListTable; list page now server-renders initial data"
```

---

## Task 8: RSC User Details Page + `UserDetailsHeader` + `UserDetailsTabs`

**Files:**
- Modify: `src/app/(igrp)/(home)/settings/users/[id]/page.tsx`
- Create: `src/features/users/components/user-details-header.tsx`
- Create: `src/features/users/components/user-details-tabs.tsx`
- Modify: `src/features/users/components/user-details.tsx` (reduce to re-export)

- [ ] **Step 1: Update `[id]/page.tsx` to fetch user server-side**

Replace entire file:

```tsx
import { getUser } from "@/actions/user";
import { UserDetailsHeader } from "@/features/users/components/user-details-header";
import { UserDetailsTabs } from "@/features/users/components/user-details-tabs";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function UserPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await getUser(Number(id));

  if (!result.success) notFound();

  const user = result.data;

  return (
    <div className="flex flex-col gap-6 p-6">
      <UserDetailsHeader user={user} />
      <UserDetailsTabs user={user} />
    </div>
  );
}
```

- [ ] **Step 2: Create `src/features/users/components/user-details-header.tsx`**

Extract the header section from `user-details.tsx` (avatar, name edit, status badge + toggle). The component signature:

```tsx
"use client";

import type { IGRPUserDTO } from "@igrp/platform-access-management-client-ts";
// ... other imports from existing user-details.tsx header section ...

interface UserDetailsHeaderProps {
  user: IGRPUserDTO;
}

export function UserDetailsHeader({ user }: UserDetailsHeaderProps) {
  // Move all avatar, name-edit, and status-toggle JSX and state from
  // user-details.tsx into here.
  // Keep: useUpdateUser, useUpdateUserStatus, useIGRPToast, edit state, confirm dialog.
}
```

- [ ] **Step 3: Create `src/features/users/components/user-details-tabs.tsx`**

This is the tab shell that wraps each panel in its own `Suspense` + `ErrorBoundary`.

Create a simple `TabError` component and `TabSkeleton` component inline in this file:

```tsx
"use client";

import type { IGRPUserDTO } from "@igrp/platform-access-management-client-ts";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import {
  IGRPButton,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@igrp/igrp-framework-react-design-system";
import { UserRoleList } from "./user-role-list";
import { UserApplications } from "./user-applications";
import { UserSignature } from "./user-signature";
import { UserMetadataPanel } from "./user-metadata-panel";
import { UserSessionsTab } from "./user-sessions-tab";
import { UserAuditLogTab } from "./user-audit-tab";

function TabSkeleton() {
  return (
    <div className="flex flex-col gap-3 p-4 animate-pulse">
      <div className="h-4 w-3/4 rounded bg-muted" />
      <div className="h-4 w-1/2 rounded bg-muted" />
      <div className="h-4 w-2/3 rounded bg-muted" />
    </div>
  );
}

function TabError({
  error,
  resetErrorBoundary,
}: {
  error: Error;
  resetErrorBoundary: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-3 p-6 text-sm text-destructive">
      <p>{error.message || "Erro ao carregar dados"}</p>
      <IGRPButton size="sm" onClick={resetErrorBoundary}>
        Tentar novamente
      </IGRPButton>
    </div>
  );
}

function TabPanel({
  children,
}: {
  children: React.ReactNode;
}) {
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
  return (
    <Tabs defaultValue="roles">
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
        <TabPanel>
          <UserRoleList userId={user.id} />
        </TabPanel>
      </TabsContent>

      <TabsContent value="departments">
        <TabPanel>
          {/* Copy the departments tab JSX directly from the existing user-details.tsx
              (the section that renders useUserDepartments(user.id) data).
              If a standalone UserDepartments component doesn't already exist,
              extract it now: create user-departments-tab.tsx, move the JSX and
              the useUserDepartments(id) call into it, then import it here. */}
        </TabPanel>
      </TabsContent>

      <TabsContent value="applications">
        <TabPanel>
          <UserApplications userId={user.id} />
        </TabPanel>
      </TabsContent>

      <TabsContent value="signature">
        <TabPanel>
          <UserSignature user={user} />
        </TabPanel>
      </TabsContent>

      <TabsContent value="sessions">
        <TabPanel>
          <UserSessionsTab username={user.username} />
        </TabPanel>
      </TabsContent>

      <TabsContent value="audit">
        <TabPanel>
          <UserAuditLogTab userId={String(user.id)} />
        </TabPanel>
      </TabsContent>

      <TabsContent value="metadata">
        <TabPanel>
          <UserMetadataPanel userId={user.id} />
        </TabPanel>
      </TabsContent>
    </Tabs>
  );
}
```

Install `react-error-boundary` if not already present:

```bash
npm install react-error-boundary
```

- [ ] **Step 4: Slim down `user-details.tsx`**

Replace `user-details.tsx` with a re-export to avoid breaking existing imports:

```tsx
// Maintained for backwards-compat during migration
export { UserDetailsHeader as UserDetails } from "./user-details-header";
```

- [ ] **Step 5: Run type-check**

```bash
npx tsc --noEmit
```

Expected: errors only on missing tab components (`UserSessionsTab`, `UserAuditLogTab`, `UserMetadataPanel`) — those are created in later tasks. Add stub exports to unblock the type-check:

```tsx
// temporary stubs — replace in Tasks 11–13
export function UserMetadataPanel({ userId }: { userId: number }) { return null; }
export function UserSessionsTab({ username }: { username?: string }) { return null; }
export function UserAuditLogTab({ userId }: { userId: string }) { return null; }
```

Place each stub in its own file path so later tasks replace the stub without conflict.

- [ ] **Step 6: Verify in browser**

```bash
npm run dev
```

Navigate to `/settings/users/1`. User data should be visible immediately. Tab panels for Sessions, Audit, and Metadata show nothing (stubs). Other tabs work as before.

- [ ] **Step 7: Commit**

```bash
git add src/app/(igrp)/(home)/settings/users/[id]/page.tsx \
        src/features/users/components/user-details-header.tsx \
        src/features/users/components/user-details-tabs.tsx \
        src/features/users/components/user-details.tsx \
        src/features/users/components/user-metadata-panel.tsx \
        src/features/users/components/user-sessions-tab.tsx \
        src/features/users/components/user-audit-tab.tsx
git commit -m "refactor(users): extract UserDetailsHeader + UserDetailsTabs; details page now RSC"
```

---

## Task 9: `UserRoleDialog` — `expiresAt` Support (TDD)

**Files:**
- Modify: `src/features/users/components/user-role-dialog.tsx`
- Create: `src/__tests__/users/components/user-role-dialog.test.tsx`

- [ ] **Step 1: Write failing tests**

Create `src/__tests__/users/components/user-role-dialog.test.tsx`:

```tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { computeRoleDiff } from "@/features/users/lib/role-diff";

// We test computeRoleDiff directly since it drives the dialog's diff logic
describe("UserRoleDialog — expiresAt via computeRoleDiff", () => {
  it("assigns expiresAt to all newly added roles when provided", () => {
    const { toAdd } = computeRoleDiff([], ["ADMIN", "VIEWER"], "2026-12-31");
    expect(toAdd.roles).toEqual(["ADMIN", "VIEWER"]);
    expect(toAdd.expiresAt).toBe("2026-12-31");
  });

  it("does not include expiresAt for permanent assignments", () => {
    const { toAdd } = computeRoleDiff([], ["ADMIN"]);
    expect("expiresAt" in toAdd).toBe(false);
  });

  it("only adds roles that are newly selected", () => {
    const { toAdd } = computeRoleDiff(
      ["EXISTING"],
      ["EXISTING", "NEW"],
      "2027-01-01",
    );
    expect(toAdd.roles).toEqual(["NEW"]);
  });
});
```

Run: `npm test -- user-role-dialog`
Expected: `3 passed` (they pass because they only test `computeRoleDiff`, not the component yet).

- [ ] **Step 2: Update `user-role-dialog.tsx` to use `computeRoleDiff`**

In `user-role-dialog.tsx`:

1. Import `computeRoleDiff`:

```tsx
import { computeRoleDiff } from "@/features/users/lib/role-diff";
```

2. Add `expiresAt` state:

```tsx
const [expiresAt, setExpiresAt] = useState<string>("");
```

3. Add an "Expires at" `<Input type="date">` above the role table (applies globally to all newly added roles in this dialog session):

```tsx
<div className="flex items-center gap-2 mb-3">
  <Label htmlFor="expires-at" className="text-sm whitespace-nowrap">
    Expiração (opcional)
  </Label>
  <Input
    id="expires-at"
    type="date"
    value={expiresAt}
    min={new Date().toISOString().split("T")[0]}
    onChange={(e) => setExpiresAt(e.target.value)}
    className="w-44"
  />
</div>
```

4. Replace the inline diff logic (wherever `toAdd`/`toRemove` are computed) with `computeRoleDiff`:

```tsx
const diff = useMemo(
  () =>
    computeRoleDiff(
      currentRoleCodes,
      selectedRoleCodes,
      expiresAt || undefined,
    ),
  [currentRoleCodes, selectedRoleCodes, expiresAt],
);
```

5. Update the `useAddUserRole` call to pass `request` instead of `roleCodes`:

```tsx
await addRolesMutation.mutateAsync({
  id: userId,
  departmentCode,
  request: diff.toAdd,
});
```

- [ ] **Step 3: Run tests**

```bash
npm test -- user-role-dialog
```

Expected: `3 passed`.

- [ ] **Step 4: Verify in browser**

Navigate to a user's Roles tab, open role assignment dialog. An "Expiração (opcional)" date input should appear. Assigning a role with a date sets `expiresAt`; without a date it's permanent.

- [ ] **Step 5: Commit**

```bash
git add src/features/users/components/user-role-dialog.tsx src/__tests__/users/components/user-role-dialog.test.tsx
git commit -m "feat(users): add expiresAt support to UserRoleDialog via computeRoleDiff"
```

---

## Task 10: `UserMetadataPanel` (TDD)

**Files:**
- Modify: `src/features/users/components/user-metadata-panel.tsx` (replace stub)
- Create: `src/__tests__/users/components/user-metadata-panel.test.tsx`

- [ ] **Step 1: Write failing tests**

Create `src/__tests__/users/components/user-metadata-panel.test.tsx`:

```tsx
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { UserMetadataPanel } from "@/features/users/components/user-metadata-panel";

vi.mock("@/features/users/use-users", () => ({
  useUserMetadata: vi.fn(() => ({
    data: { userId: 1, metadata: { dept: "TI" } },
    isLoading: false,
  })),
  useUpdateUserMetadata: vi.fn(() => ({
    mutateAsync: vi.fn().mockResolvedValue({ success: true }),
    isPending: false,
  })),
}));

function wrapper({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient();
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe("UserMetadataPanel", () => {
  it("renders existing metadata key-value pairs", () => {
    render(<UserMetadataPanel userId={1} />, { wrapper });
    expect(screen.getByDisplayValue("dept")).toBeInTheDocument();
    expect(screen.getByDisplayValue("TI")).toBeInTheDocument();
  });

  it("adds a new empty row when '+ Add field' is clicked", async () => {
    render(<UserMetadataPanel userId={1} />, { wrapper });
    const addButton = screen.getByRole("button", { name: /add field/i });
    await userEvent.click(addButton);
    const keyInputs = screen.getAllByPlaceholderText("chave");
    expect(keyInputs).toHaveLength(2);
  });

  it("removes a row when the delete button is clicked", async () => {
    render(<UserMetadataPanel userId={1} />, { wrapper });
    const deleteButtons = screen.getAllByRole("button", { name: /remover/i });
    await userEvent.click(deleteButtons[0]);
    expect(screen.queryByDisplayValue("dept")).not.toBeInTheDocument();
  });

  it("calls updateUserMetadata with current rows on save", async () => {
    const mutateAsync = vi.fn().mockResolvedValue({ success: true });
    const { useUpdateUserMetadata } = await import(
      "@/features/users/use-users"
    );
    vi.mocked(useUpdateUserMetadata).mockReturnValue({
      mutateAsync,
      isPending: false,
    } as any);

    render(<UserMetadataPanel userId={1} />, { wrapper });
    await userEvent.click(screen.getByRole("button", { name: /save/i }));

    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalledWith({
        id: 1,
        metadata: { dept: "TI" },
      });
    });
  });
});
```

Run: `npm test -- user-metadata-panel`
Expected: FAIL — `UserMetadataPanel` is a stub returning null.

- [ ] **Step 2: Implement `UserMetadataPanel`**

Replace the stub in `src/features/users/components/user-metadata-panel.tsx`:

```tsx
"use client";

import { IGRPButton, Input, Label, useIGRPToast } from "@igrp/igrp-framework-react-design-system";
import { useEffect, useState } from "react";
import { useUpdateUserMetadata, useUserMetadata } from "../use-users";

interface MetadataRow {
  key: string;
  value: string;
}

interface UserMetadataPanelProps {
  userId: number;
}

export function UserMetadataPanel({ userId }: UserMetadataPanelProps) {
  const { data } = useUserMetadata(userId);
  const updateMutation = useUpdateUserMetadata();
  const { toast } = useIGRPToast();

  const [rows, setRows] = useState<MetadataRow[]>([]);

  useEffect(() => {
    if (data?.metadata) {
      setRows(
        Object.entries(data.metadata).map(([key, value]) => ({
          key,
          value: String(value),
        })),
      );
    }
  }, [data]);

  const addRow = () => setRows((prev) => [...prev, { key: "", value: "" }]);

  const removeRow = (index: number) =>
    setRows((prev) => prev.filter((_, i) => i !== index));

  const updateRow = (index: number, field: "key" | "value", val: string) =>
    setRows((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [field]: val } : row)),
    );

  const handleSave = async () => {
    const metadata = Object.fromEntries(
      rows.filter((r) => r.key.trim()).map((r) => [r.key.trim(), r.value]),
    );
    const result = await updateMutation.mutateAsync({ id: userId, metadata });
    if (result.success) {
      toast({ title: "Metadados atualizados" });
    } else {
      toast({ title: "Erro ao atualizar metadados", variant: "destructive" });
    }
  };

  return (
    <div className="flex flex-col gap-3 p-4">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium text-muted-foreground">
          Metadados
        </Label>
        <IGRPButton size="sm" variant="outline" onClick={addRow}>
          + Add field
        </IGRPButton>
      </div>

      {rows.map((row, i) => (
        <div key={i} className="flex items-center gap-2">
          <Input
            placeholder="chave"
            value={row.key}
            onChange={(e) => updateRow(i, "key", e.target.value)}
          />
          <Input
            placeholder="valor"
            value={row.value}
            onChange={(e) => updateRow(i, "value", e.target.value)}
          />
          <IGRPButton
            size="sm"
            variant="ghost"
            aria-label="remover"
            onClick={() => removeRow(i)}
          >
            ✕
          </IGRPButton>
        </div>
      ))}

      <div className="flex justify-end">
        <IGRPButton
          size="sm"
          onClick={handleSave}
          disabled={updateMutation.isPending}
        >
          Save
        </IGRPButton>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Run tests**

```bash
npm test -- user-metadata-panel
```

Expected: `4 passed`.

- [ ] **Step 4: Commit**

```bash
git add src/features/users/components/user-metadata-panel.tsx src/__tests__/users/components/user-metadata-panel.test.tsx
git commit -m "feat(users): add UserMetadataPanel with key/value editor"
```

---

## Task 11: `UserSessionsTab` (TDD)

**Files:**
- Modify: `src/features/users/components/user-sessions-tab.tsx` (replace stub)
- Create: `src/__tests__/users/components/user-sessions-tab.test.tsx`

- [ ] **Step 1: Write failing tests**

Create `src/__tests__/users/components/user-sessions-tab.test.tsx`:

```tsx
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { UserSessionsTab } from "@/features/users/components/user-sessions-tab";

const mockSession = {
  sessionId: "abc123",
  status: "ACTIVE",
  startedAt: "2026-05-14T09:00:00Z",
  lastSeenAt: "2026-05-14T09:10:00Z",
  clientIp: "197.220.1.1",
};

vi.mock("@/features/users/use-users", () => ({
  useUserSession: vi.fn(() => ({
    data: mockSession,
    isLoading: false,
  })),
  useKillUserSession: vi.fn(() => ({
    mutateAsync: vi.fn().mockResolvedValue({ success: true }),
    isPending: false,
  })),
}));

function wrapper({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={new QueryClient()}>
      {children}
    </QueryClientProvider>
  );
}

describe("UserSessionsTab", () => {
  it("renders the active session row", () => {
    render(<UserSessionsTab username="fidel.luz" />, { wrapper });
    expect(screen.getByText(/abc123/i)).toBeInTheDocument();
    expect(screen.getByText(/197.220.1.1/)).toBeInTheDocument();
  });

  it("shows 'no active sessions' when username is undefined", () => {
    const { useUserSession } = require("@/features/users/use-users");
    useUserSession.mockReturnValue({ data: undefined, isLoading: false });
    render(<UserSessionsTab username={undefined} />, { wrapper });
    expect(
      screen.getByText(/sem sessões ativas/i),
    ).toBeInTheDocument();
  });

  it("prompts for reason and calls killSession on Kill click", async () => {
    const mutateAsync = vi.fn().mockResolvedValue({ success: true });
    const { useKillUserSession } = require("@/features/users/use-users");
    useKillUserSession.mockReturnValue({ mutateAsync, isPending: false });

    render(<UserSessionsTab username="fidel.luz" />, { wrapper });

    await userEvent.click(screen.getByRole("button", { name: /terminar/i }));
    const reasonInput = screen.getByPlaceholderText(/motivo/i);
    await userEvent.type(reasonInput, "Suspicious activity");
    await userEvent.click(screen.getByRole("button", { name: /confirmar/i }));

    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          sessionId: "abc123",
          reason: "Suspicious activity",
          userExternalId: "fidel.luz",
        }),
      );
    });
  });
});
```

Run: `npm test -- user-sessions-tab`
Expected: FAIL.

- [ ] **Step 2: Implement `UserSessionsTab`**

Replace the stub in `src/features/users/components/user-sessions-tab.tsx`:

```tsx
"use client";

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Badge,
  IGRPButton,
  Input,
  Label,
  useIGRPToast,
} from "@igrp/igrp-framework-react-design-system";
import { useState } from "react";
import { useKillUserSession, useUserSession } from "../use-users";

interface UserSessionsTabProps {
  username: string | undefined;
}

export function UserSessionsTab({ username }: UserSessionsTabProps) {
  const { data: session, isLoading } = useUserSession(username);
  const killMutation = useKillUserSession();
  const { toast } = useIGRPToast();

  const [killDialogOpen, setKillDialogOpen] = useState(false);
  const [reason, setReason] = useState("");

  if (!username) {
    return (
      <p className="p-4 text-sm text-muted-foreground">
        Identificador externo não disponível para este utilizador.
      </p>
    );
  }

  if (isLoading) return null;

  if (!session) {
    return (
      <p className="p-4 text-sm text-muted-foreground">
        Sem sessões ativas.
      </p>
    );
  }

  const handleKill = async () => {
    const result = await killMutation.mutateAsync({
      sessionId: session.sessionId,
      reason,
      userExternalId: username,
    });
    if (result.success) {
      toast({ title: "Sessão terminada" });
      setKillDialogOpen(false);
      setReason("");
    } else {
      toast({ title: "Erro ao terminar sessão", variant: "destructive" });
    }
  };

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Sessão Ativa</h3>
        <Badge variant="default">ATIVA</Badge>
      </div>

      <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
        <span className="text-muted-foreground">ID da sessão</span>
        <span className="font-mono">{session.sessionId.slice(0, 8)}…</span>

        <span className="text-muted-foreground">Iniciada em</span>
        <span>{session.startedAt ? new Date(session.startedAt).toLocaleString("pt-CV") : "—"}</span>

        <span className="text-muted-foreground">Último acesso</span>
        <span>{session.lastSeenAt ? new Date(session.lastSeenAt).toLocaleString("pt-CV") : "—"}</span>

        <span className="text-muted-foreground">IP</span>
        <span>{session.clientIp ?? "—"}</span>
      </div>

      <div className="flex justify-end">
        <IGRPButton
          size="sm"
          variant="destructive"
          onClick={() => setKillDialogOpen(true)}
        >
          Terminar sessão
        </IGRPButton>
      </div>

      <AlertDialog open={killDialogOpen} onOpenChange={setKillDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Terminar sessão</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação irá encerrar a sessão ativa do utilizador imediatamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex flex-col gap-2 py-2">
            <Label>Motivo</Label>
            <Input
              placeholder="Indique o motivo..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
          <AlertDialogFooter>
            <IGRPButton variant="outline" onClick={() => setKillDialogOpen(false)}>
              Cancelar
            </IGRPButton>
            <IGRPButton
              variant="destructive"
              disabled={!reason.trim() || killMutation.isPending}
              onClick={handleKill}
            >
              Confirmar
            </IGRPButton>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
```

- [ ] **Step 3: Run tests**

```bash
npm test -- user-sessions-tab
```

Expected: `3 passed`.

- [ ] **Step 4: Commit**

```bash
git add src/features/users/components/user-sessions-tab.tsx src/__tests__/users/components/user-sessions-tab.test.tsx
git commit -m "feat(users): add UserSessionsTab with kill session flow"
```

---

## Task 12: `UserAuditLogTab`

**Files:**
- Modify: `src/features/users/components/user-audit-tab.tsx` (replace stub)

- [ ] **Step 1: Implement `UserAuditLogTab`**

Replace the stub in `src/features/users/components/user-audit-tab.tsx`:

```tsx
"use client";

import {
  Badge,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@igrp/igrp-framework-react-design-system";
import { useState } from "react";
import { useUserAuditLogs } from "../use-users";

const EVENT_BADGE_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  LOGIN_SUCCESS: "default",
  LOGOUT: "secondary",
  LOGIN_FAILURE: "destructive",
  ROLE_CHANGED: "outline",
};

interface UserAuditLogTabProps {
  userId: string;
}

export function UserAuditLogTab({ userId }: UserAuditLogTabProps) {
  const [page, setPage] = useState(0);
  const { data, isLoading } = useUserAuditLogs(userId, {
    page,
    size: 10,
  });

  if (isLoading) return null;
  if (!data || data.empty) {
    return (
      <p className="p-4 text-sm text-muted-foreground">
        Sem registos de auditoria.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3 p-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Data / hora</TableHead>
            <TableHead>Evento</TableHead>
            <TableHead>Categoria</TableHead>
            <TableHead>IP</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.content.map((log) => (
            <TableRow key={log.id}>
              <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                {log.timestamp
                  ? new Date(log.timestamp).toLocaleString("pt-CV")
                  : "—"}
              </TableCell>
              <TableCell>
                <Badge
                  variant={
                    EVENT_BADGE_VARIANT[log.eventType ?? ""] ?? "secondary"
                  }
                >
                  {log.eventType ?? "—"}
                </Badge>
              </TableCell>
              <TableCell className="text-xs">{log.category ?? "—"}</TableCell>
              <TableCell className="text-xs font-mono">
                {log.ipAddress ?? "—"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {data.totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            Página {page + 1} de {data.totalPages}
          </span>
          <div className="flex gap-2">
            <button
              disabled={data.first}
              onClick={() => setPage((p) => p - 1)}
              className="disabled:opacity-40"
            >
              ← Anterior
            </button>
            <button
              disabled={data.last}
              onClick={() => setPage((p) => p + 1)}
              className="disabled:opacity-40"
            >
              Seguinte →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/features/users/components/user-audit-tab.tsx
git commit -m "feat(users): add UserAuditLogTab with pagination"
```

---

## Task 13: Final Cleanup

**Files:**
- Modify: `src/features/users/user-schema.ts`
- Modify: `.gitignore`
- Delete: `src/__tests__/smoke.test.ts`

- [ ] **Step 1: Add `username` to `UserSchema`**

In `src/features/users/user-schema.ts`, uncomment and update the `username` field in `UserSchema`:

```ts
export const UserSchema = z.object({
  id: z.number().int().positive().optional(),
  name: NameSchema,
  username: z.string().optional(),
  email: EmailSchema,
  status: statusSchema,
  picture: z.string().optional(),
  signature: z.string().optional(),
});
```

- [ ] **Step 2: Add `.superpowers/` to `.gitignore`**

Add this line to `.gitignore`:

```
# Brainstorming session artefacts
.superpowers/
```

- [ ] **Step 3: Remove smoke test**

```bash
rm src/__tests__/smoke.test.ts
```

- [ ] **Step 4: Run full test suite**

```bash
npm test
```

Expected: all tests pass (role-diff × 6, user-role-dialog × 3, user-metadata-panel × 4, user-sessions-tab × 3 = 16 total).

- [ ] **Step 5: Run type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 6: Run lint**

```bash
npm run lint
```

Expected: no errors. Fix any reported issues.

- [ ] **Step 7: Final commit**

```bash
git add src/features/users/user-schema.ts .gitignore
git commit -m "chore(users): add username to UserSchema; add .superpowers to .gitignore"
```

---

## Summary

| Task | What it delivers |
|---|---|
| 1 | Vitest + Testing Library setup |
| 2 | `computeRoleDiff` pure utility (6 tests) |
| 3 | `addRolesToUser` uses correct SDK type |
| 4 | Metadata, session, audit server actions |
| 5 | 5 new React Query hooks; `useUsers` accepts `initialData` |
| 6 | User list RSC page + URL-param filter bar |
| 7 | `UserListTable` extracted; no spinner on first load |
| 8 | User details RSC page + `UserDetailsTabs` with `Suspense`/`ErrorBoundary` |
| 9 | `UserRoleDialog` with `expiresAt` date picker (3 tests) |
| 10 | `UserMetadataPanel` key/value editor (4 tests) |
| 11 | `UserSessionsTab` with kill flow (3 tests) |
| 12 | `UserAuditLogTab` paginated audit log |
| 13 | Schema fix, `.gitignore`, full test run |
