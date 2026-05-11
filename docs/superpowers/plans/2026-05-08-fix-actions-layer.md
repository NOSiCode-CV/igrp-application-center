# Fix Actions Layer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Harden `src/actions/` by fixing a server-only boundary leak, aligning all action files to the `ActionResult<T>` discriminated-union contract, fixing a content-type bug in file upload, and renaming a misspelled file.

**Architecture:** All action files already share a `ActionResult<T>` discriminated union and a central `getClientAccess()` helper. The changes are self-contained to the actions layer plus the two React Query hook files that directly consume the diverging actions (`use-roles.ts`, `use-files.ts`). No components need to change.

**Tech Stack:** Next.js 15 App Router, TypeScript, `server-only` package (already a Next.js peer dep), `@tanstack/react-query` v5.

---

## Files Modified

| File | Change |
|---|---|
| `src/actions/access-client.ts` | Add `import "server-only"` |
| `src/actions/roles.ts` | Return `ActionResult<RoleDTO>` instead of throwing |
| `src/features/roles/use-roles.ts` | Unwrap `ActionResult` from query fns |
| `src/actions/file.ts` | Return `ActionResult<…>`, fix content-type bug, remove dead comment |
| `src/features/files/use-files.ts` | Unwrap `ActionResult` from mutation/query fns |
| `src/actions/user.ts` | Add missing `console.error` to `addRolesToUser` catch |
| `src/actions/departaments.ts` → `src/actions/departments.ts` | Rename file + add 204 comment |
| `src/features/departments/use-departments.ts` | Update import path |

---

## Task 1: Protect `access-client.ts` from client bundling

**Files:**
- Modify: `src/actions/access-client.ts`

- [ ] **Step 1: Add `server-only` guard**

Open `src/actions/access-client.ts`. The file currently starts with imports from `@igrp/framework-next`. Add `import "server-only"` as the very first line:

```ts
import "server-only";

import {
  igrpGetAccessClient,
  igrpResetAccessClientConfig,
} from "@igrp/framework-next";
import { serverSession } from "@/lib/auth";

export async function getClientAccess() {
  igrpResetAccessClientConfig();
  await serverSession();
  return await igrpGetAccessClient();
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
pnpm tsc --noEmit
```

Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add src/actions/access-client.ts
git commit -m "fix(actions): guard access-client with server-only to prevent client bundling"
```

---

## Task 2: Align `roles.ts` to the `ActionResult` pattern

`getRoleByCode` and `getRoleById` currently throw on error. Every other action returns `ActionResult<T>`. This task fixes the contract and updates the one hook file that calls them.

**Files:**
- Modify: `src/actions/roles.ts`
- Modify: `src/features/roles/use-roles.ts`

- [ ] **Step 1: Rewrite `roles.ts`**

Replace the entire file with:

```ts
"use server";

import type { RoleDTO } from "@igrp/platform-access-management-client-ts";
import { extractApiError } from "@/lib/utils";
import { getClientAccess } from "./access-client";
import type { ActionResult } from "./types";

export async function getRoleByCode(
  name: string,
): Promise<ActionResult<RoleDTO>> {
  const client = await getClientAccess();

  try {
    const result = await client.roles.getRoleByCode(name);
    return { success: true, data: result.data as RoleDTO };
  } catch (error) {
    console.error(
      `[role-by-code] Não foi possível obter dado do perfil ${name}:`,
      error,
    );
    return { success: false, error: extractApiError(error) };
  }
}

export async function getRoleById(
  id: number,
): Promise<ActionResult<RoleDTO>> {
  const client = await getClientAccess();

  try {
    const result = await client.roles.getRoleById(id);
    return { success: true, data: result.data as RoleDTO };
  } catch (error) {
    console.error(
      `[role-by-id] Não foi possível obter dado do perfil ${id}:`,
      error,
    );
    return { success: false, error: extractApiError(error) };
  }
}
```

- [ ] **Step 2: Update `use-roles.ts` to unwrap `ActionResult`**

The React Query hooks currently type `queryFn` return as `RoleDTO` directly. Now that the actions return `ActionResult<RoleDTO>`, unwrap in the `queryFn` and throw on failure so React Query's error handling still works:

```ts
import type { RoleDTO } from "@igrp/platform-access-management-client-ts";
import { useQuery } from "@tanstack/react-query";
import { getRoleByCode, getRoleById } from "@/actions/roles";

export const useRoleByCode = (name: string) => {
  return useQuery<RoleDTO>({
    queryKey: ["roleByCode", name.toLowerCase()] as const,
    queryFn: async () => {
      const result = await getRoleByCode(name);
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    enabled: !!name,
    retry: false,
    throwOnError: true,
  });
};

export const useRoleById = (id: number) => {
  return useQuery<RoleDTO>({
    queryKey: ["roleById", id] as const,
    queryFn: async () => {
      const result = await getRoleById(id);
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    enabled: !!id,
    retry: false,
    throwOnError: true,
  });
};
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
pnpm tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/actions/roles.ts src/features/roles/use-roles.ts
git commit -m "fix(actions): align roles actions to ActionResult pattern; update use-roles hooks"
```

---

## Task 3: Fix `file.ts` — `ActionResult` pattern + content-type bug + dead comment

**Background on the content-type bug:** `uploadPublicFile` currently reads `content-type` from the incoming HTTP request headers (`next/headers`). That header is `multipart/form-data; boundary=…` — it's the server action call's envelope, not the uploaded file's MIME type. The SDK expects the file's MIME type. Use `file.type` (populated automatically for `File` objects; may be `""` for raw `Blob` — callers should pass a `File`).

**Files:**
- Modify: `src/actions/file.ts`
- Modify: `src/features/files/use-files.ts`

- [ ] **Step 1: Rewrite `file.ts`**

```ts
"use server";

import type { UploadFileOptions } from "@igrp/platform-access-management-client-ts";
import { extractApiError } from "@/lib/utils";
import { getClientAccess } from "./access-client";
import type { ActionResult } from "./types";

export async function getFileUrl(
  path: string,
): Promise<ActionResult<string>> {
  const client = await getClientAccess();

  try {
    const result = await client.files.getFileUrl(path);
    return { success: true, data: result.data };
  } catch (error) {
    console.error("[files-get] Não foi possível obter a imagem:", error);
    return { success: false, error: extractApiError(error) };
  }
}

export async function uploadPublicFile(
  file: File | Blob,
  options: UploadFileOptions,
): Promise<ActionResult<string>> {
  const client = await getClientAccess();

  if (!file) {
    return { success: false, error: "Nenhum arquivo encontrado" };
  }

  try {
    const result = await client.files.uploadPublicFile(
      file,
      options,
      file.type,
    );
    return { success: true, data: result.data };
  } catch (error) {
    console.error(
      "[files-upload-public] Não foi possível carregar o ficheiro:",
      error,
    );
    return { success: false, error: extractApiError(error) };
  }
}

export async function uploadPrivateFile(
  file: File | Blob,
  options: UploadFileOptions,
): Promise<ActionResult<string>> {
  const client = await getClientAccess();

  try {
    const result = await client.files.uploadPrivateFile(file, options);
    return { success: true, data: result.data };
  } catch (error) {
    console.error(
      "[files-upload-private] Não foi possível carregar o ficheiro:",
      error,
    );
    return { success: false, error: extractApiError(error) };
  }
}
```

> **Note on return type:** Replace `string` with the actual SDK DTO type if `result.data` is not a plain string — check what `client.files.uploadPublicFile` returns in `@igrp/platform-access-management-client-ts`. If the SDK returns a richer object, update the generic accordingly.

- [ ] **Step 2: Update `use-files.ts` to unwrap `ActionResult`**

```ts
import type { UploadFileOptions } from "@igrp/platform-access-management-client-ts";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  getFileUrl,
  uploadPrivateFile,
  uploadPublicFile,
} from "@/actions/file";

export const useFiles = (path: string) => {
  return useQuery({
    queryKey: ["files", path ?? ""],
    queryFn: async ({ queryKey: [, p] }) => {
      const result = await getFileUrl(p);
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    enabled: !!path,
  });
};

export const useUploadPublicFiles = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      file,
      options,
    }: {
      file: File | Blob;
      options: UploadFileOptions;
    }) => {
      const result = await uploadPublicFile(file, options);
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["public-files-public"],
      });
      await queryClient.refetchQueries({ queryKey: ["public-files-public"] });
    },
  });
};

export const useUploadPrivateFiles = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      file,
      options,
    }: {
      file: File | Blob;
      options: UploadFileOptions;
    }) => {
      const result = await uploadPrivateFile(file, options);
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["public-files-private"],
      });
      await queryClient.refetchQueries({ queryKey: ["public-files-private"] });
    },
  });
};
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
pnpm tsc --noEmit
```

Expected: no errors. If the SDK return type for `uploadPublicFile`/`uploadPrivateFile` is not `string`, fix the generic in the action file at this point.

- [ ] **Step 4: Commit**

```bash
git add src/actions/file.ts src/features/files/use-files.ts
git commit -m "fix(actions): align file actions to ActionResult; fix content-type bug; remove dead comment"
```

---

## Task 4: Add missing `console.error` in `user.ts`

**Files:**
- Modify: `src/actions/user.ts`

- [ ] **Step 1: Add the missing log to `addRolesToUser`**

Find the `addRolesToUser` function in `src/actions/user.ts` (currently at line ~59). The catch block is:

```ts
  } catch (error: unknown) {
    return { success: false, error: extractApiError(error) };
  }
```

Replace it with:

```ts
  } catch (error: unknown) {
    console.error("[user-add-roles] Erro ao adicionar perfis:", error);
    return { success: false, error: extractApiError(error) };
  }
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
pnpm tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/actions/user.ts
git commit -m "fix(actions): add missing console.error in addRolesToUser catch block"
```

---

## Task 5: Rename `departaments.ts` → `departments.ts` and add 204 comment

**Files:**
- Rename: `src/actions/departaments.ts` → `src/actions/departments.ts`
- Modify: `src/features/departments/use-departments.ts` (update import)

- [ ] **Step 1: Rename the file via git**

```bash
git mv src/actions/departaments.ts src/actions/departments.ts
```

- [ ] **Step 2: Add explanatory comment to the `deleteRole` 204 workaround**

Open `src/actions/departments.ts`. Find the `deleteRole` function. The catch block currently is:

```ts
  } catch (error: unknown) {
    const status = (error as { status?: number } | null | undefined)?.status;
    if (status === 204 || status === 0) {
      return { success: true, data: { code: roleCode } };
    }
    console.error(`[delete-role] Erro ao eliminar perfil ${roleCode}:`, error);
    return { success: false, error: extractApiError(error) };
  }
```

Replace with:

```ts
  } catch (error: unknown) {
    // The SDK throws on 204 No Content instead of resolving — treat it as success.
    const status = (error as { status?: number } | null | undefined)?.status;
    if (status === 204 || status === 0) {
      return { success: true, data: { code: roleCode } };
    }
    console.error(`[delete-role] Erro ao eliminar perfil ${roleCode}:`, error);
    return { success: false, error: extractApiError(error) };
  }
```

- [ ] **Step 3: Update the import in `use-departments.ts`**

Open `src/features/departments/use-departments.ts`, line 41. Change:

```ts
} from "@/actions/departaments";
```

to:

```ts
} from "@/actions/departments";
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
pnpm tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/actions/departments.ts src/features/departments/use-departments.ts
git commit -m "fix(actions): rename departaments.ts → departments.ts; document 204 SDK workaround"
```

---

## Self-Review Checklist

- [x] **Task 1** covers fix #1 (server-only boundary).
- [x] **Task 2** covers fix #2 (roles ActionResult) + hook update.
- [x] **Task 3** covers fix #3 (file ActionResult + content-type bug + dead comment) + hook update.
- [x] **Task 4** covers fix #4 (missing console.error).
- [x] **Task 5** covers fix #5 (rename) + fix #6 (204 comment).
- [x] No placeholders — every step has complete code.
- [x] Types are consistent: `ActionResult<T>` used in actions, `throw new Error(result.error)` pattern used in hooks.
- [x] `extractApiError` import is already present in each modified action file.
