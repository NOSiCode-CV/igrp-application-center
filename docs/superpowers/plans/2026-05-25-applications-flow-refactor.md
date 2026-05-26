# Applications Flow Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor `src/app/(igrp)/(home)/settings/applications` flow to fix correctness bugs (broken query-key invalidations, oversized update payload), eliminate request waterfalls via server prefetch + hydration, decompose `ApplicationList` into composable pieces, and remove dead code.

**Architecture:** Three-layer cleanup. (1) **Data layer** — fix TanStack Query keys/invalidation so cache updates actually take effect; introduce server prefetch + `HydrationBoundary` to eliminate first-paint loading flicker. (2) **Composition layer** — split monolithic `ApplicationList` into `ApplicationsToolbar`, `ApplicationsGrid`, and a single `ApplicationFormDialog` lifted out of each card. (3) **Polish** — drop `force-dynamic` on client-data pages, remove `Image priority` from below-fold thumbnails, hoist `TooltipProvider` to the layout, delete dead utils, replace render-time `throw error` with inline retry UI.

**Tech Stack:** Next.js 15 (App Router, RSC, typedRoutes), React 19, TanStack Query v5, React Hook Form + Zod v4, `@igrp/igrp-framework-react-design-system`, Vitest + Testing Library, Biome.

---

## File Inventory

**Modify:**
- `src/app/(igrp)/(home)/settings/applications/page.tsx` — remove `force-dynamic`, add server prefetch + `HydrationBoundary`
- `src/app/(igrp)/(home)/settings/applications/[code]/page.tsx` — remove `force-dynamic`, add server prefetch + `HydrationBoundary`
- `src/app/(igrp)/layout.tsx` — wrap children in `TooltipProvider`
- `src/features/applications/use-applications.ts` — fix `useUpdateApplication` / `useCreateMenu` / `useUpdateMenu` / `useDeleteMenu` invalidation keys
- `src/features/applications/components/app-list.tsx` — shrink to composition root
- `src/features/applications/components/app-card.tsx` — remove inline edit dialog, drop `priority`, fix `sizes`
- `src/features/applications/components/app-details.tsx` — send only `{ picture }` on upload, replace `throw error` with inline retry, guard `registerAccess` effect
- `src/features/applications/components/app-form.tsx` — memoize `defaultValues`
- `src/features/applications/app-utils.ts` — delete dead utils, collapse `APPLICATIONS_TYPES_EXCLUDE`

**Create:**
- `src/features/applications/query-keys.ts` — single source of truth for query keys (prevents future mismatches)
- `src/features/applications/prefetch.ts` — server-side prefetch helpers
- `src/features/applications/components/applications-toolbar.tsx`
- `src/features/applications/components/applications-grid.tsx`
- `src/features/applications/components/application-form-dialog.tsx`
- `src/components/inline-error.tsx` — reusable inline error+retry block
- `src/__tests__/applications/query-keys.test.ts`
- `src/__tests__/applications/use-applications-invalidation.test.tsx`
- `src/__tests__/applications/applications-grid.test.tsx`
- `src/__tests__/applications/app-utils.test.ts`

**Delete (after migration):**
- (none — only fields inside existing files)

---

## Phase 1 — Correctness Bugs (Low Risk, Ship First)

### Task 1: Centralize query keys

Cache invalidation bugs in `use-applications.ts` come from string-literal keys being typed differently in producer vs. consumer. A single keys module fixes this and makes future invalidations type-safe.

**Files:**
- Create: `src/features/applications/query-keys.ts`
- Create: `src/__tests__/applications/query-keys.test.ts`

- [ ] **Step 1: Write the failing test**

`src/__tests__/applications/query-keys.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { applicationsKeys, menusKeys } from "@/features/applications/query-keys";

describe("applicationsKeys", () => {
  it("returns a stable list key", () => {
    expect(applicationsKeys.list()).toEqual(["applications", "list"]);
  });

  it("returns a list key scoped by filters", () => {
    expect(applicationsKeys.list({ status: "ACTIVE" })).toEqual([
      "applications",
      "list",
      { status: "ACTIVE" },
    ]);
  });

  it("returns a detail key per app code", () => {
    expect(applicationsKeys.detail("MY_APP")).toEqual([
      "applications",
      "detail",
      "MY_APP",
    ]);
  });
});

describe("menusKeys", () => {
  it("returns a list key per application", () => {
    expect(menusKeys.byApplication("MY_APP")).toEqual([
      "menus",
      "application",
      "MY_APP",
    ]);
  });

  it("returns a roles key per menu", () => {
    expect(menusKeys.roles("MY_APP", "MENU_X")).toEqual([
      "menu-roles",
      "MY_APP",
      "MENU_X",
    ]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- src/__tests__/applications/query-keys.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Create the keys module**

`src/features/applications/query-keys.ts`:

```ts
import type { ApplicationFilters } from "@igrp/platform-access-management-client-ts";

export const applicationsKeys = {
  all: ["applications"] as const,
  list: (filters?: ApplicationFilters) =>
    filters
      ? (["applications", "list", filters] as const)
      : (["applications", "list"] as const),
  detail: (code: string) => ["applications", "detail", code] as const,
};

export const menusKeys = {
  all: ["menus"] as const,
  byApplication: (appCode: string) =>
    ["menus", "application", appCode] as const,
  roles: (appCode: string, menuCode: string) =>
    ["menu-roles", appCode, menuCode] as const,
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test -- src/__tests__/applications/query-keys.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/applications/query-keys.ts src/__tests__/applications/query-keys.test.ts
git commit -m "feat(applications): add centralized query-keys module"
```

---

### Task 2: Migrate `use-applications.ts` to query-keys + fix invalidations

`useCreateMenu`, `useUpdateMenu`, `useDeleteMenu` currently invalidate `["menus", "application", code]` but `useMenus` reads from `["menus", code]` — invalidations are silent no-ops. `useUpdateApplication` invalidates `["applications"]` (prefix match works) but doesn't surgically refresh the detail key. We fix both.

**Files:**
- Modify: `src/features/applications/use-applications.ts` (entire file)
- Create: `src/__tests__/applications/use-applications-invalidation.test.tsx`

- [ ] **Step 1: Write the failing invalidation test**

`src/__tests__/applications/use-applications-invalidation.test.tsx`:

```tsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { applicationsKeys, menusKeys } from "@/features/applications/query-keys";
import {
  useDeleteMenu,
  useUpdateApplication,
} from "@/features/applications/use-applications";

vi.mock("@/actions/applications", () => ({
  updateApplication: vi.fn(async () => ({
    success: true,
    data: { code: "APP_A", name: "A" },
  })),
  deleteMenu: vi.fn(async () => ({ success: true, data: { code: "MENU_X" } })),
  createApplication: vi.fn(),
  createMenu: vi.fn(),
  updateMenu: vi.fn(),
  getApplications: vi.fn(),
  getApplicationByCode: vi.fn(),
  getMenus: vi.fn(),
  addRolesToMenu: vi.fn(),
  removeRolesFromMenu: vi.fn(),
}));

function makeWrapper(client: QueryClient) {
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
}

describe("useUpdateApplication", () => {
  it("invalidates list and detail keys on success", async () => {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const spy = vi.spyOn(client, "invalidateQueries");

    const { result } = renderHook(() => useUpdateApplication(), {
      wrapper: makeWrapper(client),
    });

    await result.current.mutateAsync({
      code: "APP_A",
      data: { name: "A renamed" },
    });

    await waitFor(() => {
      expect(spy).toHaveBeenCalledWith({ queryKey: applicationsKeys.all });
      expect(spy).toHaveBeenCalledWith({
        queryKey: applicationsKeys.detail("APP_A"),
      });
    });
  });
});

describe("useDeleteMenu", () => {
  it("invalidates the menus-by-application key, not a dangling prefix", async () => {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const spy = vi.spyOn(client, "invalidateQueries");

    const { result } = renderHook(() => useDeleteMenu(), {
      wrapper: makeWrapper(client),
    });

    await result.current.mutateAsync({ appCode: "APP_A", menuCode: "MENU_X" });

    await waitFor(() => {
      expect(spy).toHaveBeenCalledWith({
        queryKey: menusKeys.byApplication("APP_A"),
      });
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- src/__tests__/applications/use-applications-invalidation.test.tsx`
Expected: FAIL — invalidation keys don't match.

- [ ] **Step 3: Rewrite `use-applications.ts` to use the keys module**

Replace `src/features/applications/use-applications.ts` with:

```ts
import type { IGRPMenuItemArgs } from "@igrp/framework-next-types";
import type {
  ApplicationDTO,
  ApplicationFilters,
  CreateMenuRequest,
  UpdateApplicationRequest,
  UpdateMenuRequest,
} from "@igrp/platform-access-management-client-ts";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  addRolesToMenu,
  createApplication,
  createMenu,
  deleteMenu,
  getApplicationByCode,
  getApplications,
  getMenus,
  removeRolesFromMenu,
  updateApplication,
  updateMenu,
} from "@/actions/applications";
import { applicationsKeys, menusKeys } from "./query-keys";

export const useApplications = (filters?: ApplicationFilters) => {
  return useQuery<ApplicationDTO[], Error>({
    queryKey: applicationsKeys.list(filters),
    queryFn: async () => {
      const result = await getApplications(filters);
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    retry: false,
  });
};

export const useApplicationByCode = (code: string) => {
  return useQuery<ApplicationDTO, Error>({
    queryKey: applicationsKeys.detail(code),
    queryFn: async () => {
      const result = await getApplicationByCode(code);
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    enabled: !!code,
    retry: false,
  });
};

export const useCreateApplication = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createApplication,
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: applicationsKeys.all });
      }
    },
  });
};

export const useUpdateApplication = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      code,
      data,
    }: {
      code: string;
      data: UpdateApplicationRequest;
    }) => updateApplication(code, data),
    onSuccess: (result, { code }) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: applicationsKeys.all });
        queryClient.invalidateQueries({
          queryKey: applicationsKeys.detail(code),
        });
      }
    },
  });
};

export const useMenus = (code: string) => {
  return useQuery<IGRPMenuItemArgs[], Error>({
    queryKey: menusKeys.byApplication(code),
    queryFn: async () => {
      const result = await getMenus(code);
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    enabled: !!code,
    retry: false,
  });
};

export const useCreateMenu = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      appCode,
      menu,
    }: {
      appCode: string;
      menu: CreateMenuRequest;
    }) => createMenu(appCode, menu),
    onSuccess: (result, { appCode }) => {
      if (result.success) {
        queryClient.invalidateQueries({
          queryKey: menusKeys.byApplication(appCode),
        });
      }
    },
  });
};

export const useUpdateMenu = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      appCode,
      menuCode,
      data,
    }: {
      appCode: string;
      menuCode: string;
      data: UpdateMenuRequest;
    }) => updateMenu(appCode, menuCode, data),
    onSuccess: (result, { appCode }) => {
      if (result.success) {
        queryClient.invalidateQueries({
          queryKey: menusKeys.byApplication(appCode),
        });
      }
    },
  });
};

export const useDeleteMenu = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      appCode,
      menuCode,
    }: {
      appCode: string;
      menuCode: string;
    }) => deleteMenu(appCode, menuCode),
    onSuccess: (result, { appCode }) => {
      if (result.success) {
        queryClient.invalidateQueries({
          queryKey: menusKeys.byApplication(appCode),
        });
      }
    },
  });
};

export const useAddRolesToMenu = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      appCode,
      menuCode,
      departmentCode,
      roleNames,
    }: {
      appCode: string;
      menuCode: string;
      departmentCode: string;
      roleNames: string[];
    }) => addRolesToMenu(appCode, menuCode, departmentCode, roleNames),
    onMutate: async (variables) => {
      const key = menusKeys.roles(variables.appCode, variables.menuCode);
      await queryClient.cancelQueries({ queryKey: key });
      const previousRoles = queryClient.getQueryData(key);
      queryClient.setQueryData<{ code: string }[]>(key, (old) => [
        ...(old ?? []),
        ...variables.roleNames.map((code) => ({ code })),
      ]);
      return { previousRoles };
    },
    onError: (_err, variables, context) => {
      if (context?.previousRoles) {
        queryClient.setQueryData(
          menusKeys.roles(variables.appCode, variables.menuCode),
          context.previousRoles,
        );
      }
    },
  });
};

export const useRemoveRolesFromMenu = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      appCode,
      menuCode,
      departmentCode,
      roleNames,
    }: {
      appCode: string;
      menuCode: string;
      departmentCode: string;
      roleNames: string[];
    }) => removeRolesFromMenu(appCode, menuCode, departmentCode, roleNames),
    onMutate: async (variables) => {
      const key = menusKeys.roles(variables.appCode, variables.menuCode);
      await queryClient.cancelQueries({ queryKey: key });
      const previousRoles = queryClient.getQueryData(key);
      queryClient.setQueryData<{ code: string }[]>(key, (old) =>
        old?.filter((role) => !variables.roleNames.includes(role.code)),
      );
      return { previousRoles };
    },
    onError: (_err, variables, context) => {
      if (context?.previousRoles) {
        queryClient.setQueryData(
          menusKeys.roles(variables.appCode, variables.menuCode),
          context.previousRoles,
        );
      }
    },
  });
};
```

- [ ] **Step 4: Run the new test + full test suite**

Run: `pnpm test`
Expected: PASS for invalidation test; no regressions elsewhere.

- [ ] **Step 5: Search for callers of `["menus", code]` and update**

Run: `grep -rn 'queryKey:\s*\["menus"' src/`
For every caller, replace with `menusKeys.byApplication(code)`. If menu code is involved, use `menusKeys.roles(...)`.

- [ ] **Step 6: Type-check + commit**

Run: `pnpm exec tsc --noEmit && pnpm lint`
Expected: clean.

```bash
git add src/features/applications/use-applications.ts \
        src/__tests__/applications/use-applications-invalidation.test.tsx \
        src/features/menus
git commit -m "fix(applications): align query keys so invalidations actually fire"
```

---

### Task 3: Fix picture upload payload in `app-details.tsx`

Spreading the entire `ApplicationDTO` into `UpdateApplicationRequest` sends server-managed fields (`id`, `createdBy`, `createdDate`, etc.). After Task 2, `useUpdateApplication` invalidates the detail key, so the manual `refetch()` is redundant.

**Files:**
- Modify: `src/features/applications/components/app-details.tsx:80-118`

- [ ] **Step 1: Locate the `handleFileChange` function**

Open `src/features/applications/components/app-details.tsx`, lines 80-118.

- [ ] **Step 2: Replace the body**

Replace:

```tsx
const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;

  try {
    const result = await uploadPicture.mutateAsync({
      file,
      options: {
        folder: code,
      },
    });

    setUploadedFilePath(result);

    await updateApplication({
      code: app.code,
      data: {
        ...app,
        picture: result,
      },
    });

    refetch();
    igrpToast({
      type: "success",
      title: "Upload Sucesso",
      description: `A imagem foi carregada com sucesso`,
      duration: 4000,
    });
  } catch (err) {
    igrpToast({
      type: "error",
      title: "Erro no upload.",
      description: (err as Error).message,
      duration: 4000,
    });
    console.error("Erro ao fazer upload:", err);
  }
};
```

with:

```tsx
const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;

  try {
    const result = await uploadPicture.mutateAsync({
      file,
      options: { folder: code },
    });

    setUploadedFilePath(result);

    await updateApplication({
      code: app.code,
      data: { picture: result },
    });

    igrpToast({
      type: "success",
      title: "Upload Sucesso",
      description: "A imagem foi carregada com sucesso",
      duration: 4000,
    });
  } catch (err) {
    igrpToast({
      type: "error",
      title: "Erro no upload.",
      description: (err as Error).message,
      duration: 4000,
    });
    console.error("Erro ao fazer upload:", err);
  }
};
```

- [ ] **Step 3: Remove unused `refetch` from the destructure**

Change line 38 from:

```tsx
const { data: app, isLoading, error, refetch } = useApplicationByCode(code);
```

to:

```tsx
const { data: app, isLoading, error } = useApplicationByCode(code);
```

- [ ] **Step 4: Type-check, lint, smoke-test in browser**

Run: `pnpm exec tsc --noEmit && pnpm lint && pnpm dev`

Open `/settings/applications/<some-code>`, upload an image. Verify: image renders, toast fires, no console errors, no server-rejected payload errors in network tab.

- [ ] **Step 5: Commit**

```bash
git add src/features/applications/components/app-details.tsx
git commit -m "fix(applications): send only patched fields when updating picture"
```

---

### Task 4: Drop `force-dynamic` on client-data pages

These directives do nothing — both pages render `"use client"` children that fetch via TanStack Query.

**Files:**
- Modify: `src/app/(igrp)/(home)/settings/applications/page.tsx:3`
- Modify: `src/app/(igrp)/(home)/settings/applications/[code]/page.tsx:3`

- [ ] **Step 1: Edit list page**

Delete line 3 (`export const dynamic = "force-dynamic";`) in `src/app/(igrp)/(home)/settings/applications/page.tsx`.

- [ ] **Step 2: Edit detail page**

Delete line 3 (`export const dynamic = "force-dynamic";`) in `src/app/(igrp)/(home)/settings/applications/[code]/page.tsx`.

- [ ] **Step 3: Build**

Run: `pnpm build`
Expected: build succeeds. Both routes will be re-introduced as dynamic in Task 6 via server prefetch (which uses `cookies()`/`headers()` and forces dynamic implicitly).

- [ ] **Step 4: Commit**

```bash
git add src/app/(igrp)/(home)/settings/applications/page.tsx \
        src/app/(igrp)/(home)/settings/applications/[code]/page.tsx
git commit -m "chore(applications): drop redundant force-dynamic directives"
```

---

### Task 5: Remove dead utils and collapse duplicate constants

`formattedName` and `typeClass` are unused. `APPLICATIONS_TYPES` and `APPLICATIONS_TYPES_EXCLUDE` are identical arrays.

**Files:**
- Modify: `src/features/applications/app-utils.ts`
- Modify: `src/features/applications/app-schemas.ts:8,10`
- Create: `src/__tests__/applications/app-utils.test.ts`

- [ ] **Step 1: Confirm `formattedName` and `typeClass` are unused**

Run:
```bash
grep -rn 'formattedName\|typeClass' src/
```
Expected: only occurrences are inside `app-utils.ts` itself. If any other file imports them, do not delete — instead, raise on review.

- [ ] **Step 2: Write a test pinning the surviving exports**

`src/__tests__/applications/app-utils.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  APPLICATIONS_TYPES,
  APPLICATIONS_TYPES_FILTERED,
  formatSlug,
} from "@/features/applications/app-utils";

describe("formatSlug", () => {
  it("returns slug untouched when already prefixed with /apps", () => {
    expect(formatSlug("/apps/foo")).toBe("/apps/foo");
  });

  it("prepends /apps/ to a bare slug", () => {
    expect(formatSlug("foo")).toBe("/apps/foo");
  });
});

describe("APPLICATIONS_TYPES", () => {
  it("contains EXTERNAL and INTERNAL", () => {
    expect([...APPLICATIONS_TYPES]).toEqual(["EXTERNAL", "INTERNAL"]);
  });

  it("matches the dropdown options 1:1", () => {
    expect(APPLICATIONS_TYPES_FILTERED.map((o) => o.value)).toEqual([
      ...APPLICATIONS_TYPES,
    ]);
  });
});
```

- [ ] **Step 3: Run test to confirm it fails on the `APPLICATIONS_TYPES` ordering**

Run: `pnpm test -- src/__tests__/applications/app-utils.test.ts`
Expected: PASS (existing constants already satisfy this). If FAIL, the order assertion needs adjusting to match `app-utils.ts`.

- [ ] **Step 4: Rewrite `app-utils.ts`**

```ts
export function formatSlug(slug: string): string {
  if (slug.startsWith("/apps")) return slug;
  return `/apps/${slug}`;
}

export const APPLICATIONS_TYPES = ["EXTERNAL", "INTERNAL"] as const;

export const APPLICATIONS_TYPES_FILTERED = [
  { value: "EXTERNAL", label: "External" },
  { value: "INTERNAL", label: "Internal" },
] as const;
```

- [ ] **Step 5: Update `app-schemas.ts` to use the surviving constant**

In `src/features/applications/app-schemas.ts`:
- Line 8: change `import { APPLICATIONS_TYPES, APPLICATIONS_TYPES_EXCLUDE } from "./app-utils";` to `import { APPLICATIONS_TYPES } from "./app-utils";`
- Line 10: change `export const appTypeCrud = z.enum(APPLICATIONS_TYPES_EXCLUDE);` to `export const appTypeCrud = z.enum(APPLICATIONS_TYPES);`

- [ ] **Step 6: Run tests + type-check**

Run: `pnpm test && pnpm exec tsc --noEmit`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/features/applications/app-utils.ts \
        src/features/applications/app-schemas.ts \
        src/__tests__/applications/app-utils.test.ts
git commit -m "chore(applications): remove dead utils and duplicate type constant"
```

---

### Task 6: Drop `Image priority` and fix `sizes` on card thumbnails

`priority` on every card competes for LCP — these are not the LCP element. `sizes="56px"` doesn't match the actual `size-12` (48px) container.

**Files:**
- Modify: `src/features/applications/components/app-card.tsx:42-52`

- [ ] **Step 1: Edit the `<Image>` props**

In `src/features/applications/components/app-card.tsx`, replace:

```tsx
<Image
  src={config.minioUrl + appImage}
  alt={name}
  fill
  className="object-cover"
  quality={100}
  sizes="56px"
  priority
/>
```

with:

```tsx
<Image
  src={config.minioUrl + appImage}
  alt={name}
  fill
  className="object-cover"
  sizes="48px"
/>
```

(Drop `priority` and `quality={100}`; 48px thumbnails do not benefit from `quality=100`.)

- [ ] **Step 2: Smoke test**

Run: `pnpm dev`. Open `/settings/applications`. Confirm card thumbnails render. Open DevTools → Network → Images tab; verify thumbnails are no longer marked High Priority and are reasonably sized.

- [ ] **Step 3: Commit**

```bash
git add src/features/applications/components/app-card.tsx
git commit -m "perf(applications): drop priority and fix sizes on card thumbnails"
```

---

## Phase 2 — Server Prefetch + Hydration

### Task 7: Add prefetch helpers

Server prefetch needs its own helper module so the server `page.tsx` files can import without pulling in the client `useQuery` wrapper.

**Files:**
- Create: `src/features/applications/prefetch.ts`

- [ ] **Step 1: Create the file**

`src/features/applications/prefetch.ts`:

```ts
import { QueryClient } from "@tanstack/react-query";
import {
  getApplicationByCode,
  getApplications,
} from "@/actions/applications";
import { applicationsKeys } from "./query-keys";

export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        retry: false,
      },
    },
  });
}

export async function prefetchApplicationsList(client: QueryClient) {
  await client.prefetchQuery({
    queryKey: applicationsKeys.list(),
    queryFn: async () => {
      const result = await getApplications();
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
  });
}

export async function prefetchApplicationByCode(
  client: QueryClient,
  code: string,
) {
  await client.prefetchQuery({
    queryKey: applicationsKeys.detail(code),
    queryFn: async () => {
      const result = await getApplicationByCode(code);
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
  });
}
```

- [ ] **Step 2: Type-check**

Run: `pnpm exec tsc --noEmit`
Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add src/features/applications/prefetch.ts
git commit -m "feat(applications): add server prefetch helpers"
```

---

### Task 8: Convert list page to server prefetch + `HydrationBoundary`

**Files:**
- Modify: `src/app/(igrp)/(home)/settings/applications/page.tsx`

- [ ] **Step 1: Replace the page body**

`src/app/(igrp)/(home)/settings/applications/page.tsx`:

```tsx
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { ApplicationList } from "@/features/applications/components/app-list";
import {
  makeQueryClient,
  prefetchApplicationsList,
} from "@/features/applications/prefetch";

export default async function ApplicationsPage() {
  const queryClient = makeQueryClient();
  await prefetchApplicationsList(queryClient);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ApplicationList />
    </HydrationBoundary>
  );
}
```

- [ ] **Step 2: Smoke test**

Run: `pnpm dev` → open `/settings/applications`.
Expected: no loading spinner on first paint (data arrives hydrated). Search/filter still work.

- [ ] **Step 3: Commit**

```bash
git add src/app/(igrp)/(home)/settings/applications/page.tsx
git commit -m "perf(applications): prefetch list server-side and hydrate"
```

---

### Task 9: Convert detail page to server prefetch + `HydrationBoundary`

**Files:**
- Modify: `src/app/(igrp)/(home)/settings/applications/[code]/page.tsx`

- [ ] **Step 1: Replace the page body**

```tsx
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { ApplicationDetails } from "@/features/applications/components/app-details";
import {
  makeQueryClient,
  prefetchApplicationByCode,
} from "@/features/applications/prefetch";

export default async function ApplicationDetailsPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const queryClient = makeQueryClient();
  await prefetchApplicationByCode(queryClient, code);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ApplicationDetails code={code} />
    </HydrationBoundary>
  );
}
```

- [ ] **Step 2: Smoke test**

Run: `pnpm dev` → open `/settings/applications/<code>`.
Expected: no loading spinner; details render immediately.

- [ ] **Step 3: Commit**

```bash
git add src/app/(igrp)/(home)/settings/applications/[code]/page.tsx
git commit -m "perf(applications): prefetch detail server-side and hydrate"
```

---

### Task 10: Replace render-time `throw error` with inline retry

Throwing in render escalates every query failure to the closest `error.tsx`. With prefetch from Task 8/9, a transient client-side refetch error shouldn't blow up the whole page.

**Files:**
- Create: `src/components/inline-error.tsx`
- Modify: `src/features/applications/components/app-list.tsx:38`
- Modify: `src/features/applications/components/app-details.tsx:69`

- [ ] **Step 1: Create the reusable component**

`src/components/inline-error.tsx`:

```tsx
"use client";

import { IGRPButton, IGRPIcon } from "@igrp/igrp-framework-react-design-system";

interface InlineErrorProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export function InlineError({
  title = "Não foi possível carregar os dados.",
  message,
  onRetry,
}: InlineErrorProps) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center gap-3 rounded-md border border-destructive/30 bg-destructive/5 p-6 text-center"
    >
      <IGRPIcon iconName="TriangleAlert" className="size-6 text-destructive" />
      <div>
        <p className="font-medium">{title}</p>
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
      {onRetry && (
        <IGRPButton variant="outline" size="sm" showIcon iconName="RotateCw" onClick={onRetry}>
          Tentar novamente
        </IGRPButton>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Use it in `app-list.tsx`**

In `src/features/applications/components/app-list.tsx`:

Replace:
```tsx
const { data: applications, isLoading, error } = useApplications();

if (isLoading && !error)
  return <AppCenterLoading description="Carregando aplicações..." />;

if (error) throw error;
```

with:
```tsx
const { data: applications, isLoading, error, refetch } = useApplications();

if (isLoading) return <AppCenterLoading description="Carregando aplicações..." />;

if (error) return <InlineError message={error.message} onRetry={() => refetch()} />;
```

Add import:
```tsx
import { InlineError } from "@/components/inline-error";
```

- [ ] **Step 3: Use it in `app-details.tsx`**

In `src/features/applications/components/app-details.tsx`:

Replace `const { data: app, isLoading, error } = useApplicationByCode(code);` with `const { data: app, isLoading, error, refetch } = useApplicationByCode(code);`.

Replace `if (error) throw error;` with:
```tsx
if (error)
  return <InlineError message={error.message} onRetry={() => refetch()} />;
```

Add import for `InlineError`.

- [ ] **Step 4: Smoke test (force an error)**

Run: `pnpm dev`. In DevTools, throttle network to Offline and click an application from the list. Confirm `InlineError` renders with a Retry button. Go online, click retry → details load.

- [ ] **Step 5: Commit**

```bash
git add src/components/inline-error.tsx \
        src/features/applications/components/app-list.tsx \
        src/features/applications/components/app-details.tsx
git commit -m "feat(applications): render inline retry on query errors instead of throwing"
```

---

## Phase 3 — Composition Refactor of `ApplicationList`

### Task 11: Extract `ApplicationFormDialog` (dedupe create + lift edit)

The create dialog appears twice in `ApplicationList`. The edit dialog is duplicated inside every `ApplicationCard`. Extract one component that handles both modes and is mounted once per page.

**Files:**
- Create: `src/features/applications/components/application-form-dialog.tsx`

- [ ] **Step 1: Create the dialog component**

`src/features/applications/components/application-form-dialog.tsx`:

```tsx
"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@igrp/igrp-framework-react-design-system";
import type { ApplicationDTO } from "@igrp/platform-access-management-client-ts";
import { ApplicationForm } from "./app-form";

interface ApplicationFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  application?: ApplicationDTO;
}

export function ApplicationFormDialog({
  open,
  onOpenChange,
  application,
}: ApplicationFormDialogProps) {
  const isEdit = !!application;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:min-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Editar Aplicação" : "Nova Aplicação"}
          </DialogTitle>
        </DialogHeader>
        <ApplicationForm
          application={application}
          onSuccess={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/features/applications/components/application-form-dialog.tsx
git commit -m "refactor(applications): extract ApplicationFormDialog"
```

---

### Task 12: Slim down `ApplicationCard` — remove inline edit dialog

The card should request an edit through a callback; the parent owns the dialog state.

**Files:**
- Modify: `src/features/applications/components/app-card.tsx`

- [ ] **Step 1: Rewrite `app-card.tsx`**

Replace the whole file with:

```tsx
"use client";

import {
  Badge,
  Button,
  IGRPIcon,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@igrp/igrp-framework-react-design-system";
import type {
  ApplicationDTO,
  ApplicationType,
} from "@igrp/platform-access-management-client-ts";
import type { Route } from "next";
import Image from "next/image";
import { ButtonLinkTooltip } from "@/components/button-link-tooltip";
import { formatSlug } from "@/features/applications/app-utils";
import { config, ROUTES } from "@/lib/constants";
import { cn, getStatusColor, showStatus } from "@/lib/utils";

interface ApplicationCardProps {
  app: ApplicationDTO;
  onEdit?: (app: ApplicationDTO) => void;
}

export function ApplicationCard({ app, onEdit }: ApplicationCardProps) {
  const { name, code, status, description, slug, url, type } = app;
  const href = slug ? formatSlug(slug) : url;
  const isSystem = type === ("SYSTEM" as ApplicationType);
  const appImage = app.picture;

  return (
    <div className="relative overflow-hidden rounded-lg border bg-card p-6 transition-all duration-300 hover:shadow-lg">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="relative size-12 rounded-md overflow-hidden bg-primary/10 flex items-center justify-center shrink-0">
            {appImage ? (
              <Image
                src={config.minioUrl + appImage}
                alt={name}
                fill
                className="object-cover"
                sizes="48px"
              />
            ) : (
              <IGRPIcon iconName="AppWindow" className="size-6 text-primary" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-base line-clamp-1">{name}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{code}</p>
          </div>
        </div>

        <Badge className={cn(getStatusColor(status), "shrink-0")}>
          {showStatus(status)}
        </Badge>
      </div>

      <p className="text-sm text-muted-foreground line-clamp-2 min-h-10">
        {description || "Sem descrição."}
      </p>

      <div className="flex items-center justify-end gap-1 pt-4 border-t">
        <ButtonLinkTooltip
          href={`${ROUTES.APPLICATIONS}/${code}` as Route}
          icon="Eye"
          label="Ver"
          size="icon"
          variant="ghost"
          btnClassName="hover:bg-primary/90 hover:text-primary-foreground/90 dark:hover:text-accent-foreground dark:hover:bg-accent/50"
        />

        {!isSystem && onEdit && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => onEdit(app)}
                className="hover:bg-primary/90 hover:text-primary-foreground/90 dark:hover:text-accent-foreground dark:hover:bg-accent/50"
                aria-label={`Editar ${name}`}
              >
                <IGRPIcon iconName="SquarePen" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Editar</TooltipContent>
          </Tooltip>
        )}

        <ButtonLinkTooltip
          href={(href || "") as Route}
          icon="ExternalLink"
          label="Abrir"
          size="icon"
          variant="ghost"
          btnClassName="hover:bg-primary/90 hover:text-primary-foreground/90 dark:hover:text-accent-foreground dark:hover:bg-accent/50"
        />
      </div>
    </div>
  );
}
```

Notes:
- Removed: `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle`, `TooltipProvider`, `useState`, the inline edit dialog, and `ApplicationForm` import.
- `TooltipProvider` will be hoisted in Task 16.

- [ ] **Step 2: Commit (will compile after Task 13 hooks the new callback up)**

```bash
git add src/features/applications/components/app-card.tsx
git commit -m "refactor(applications): card delegates edit to parent via onEdit"
```

---

### Task 13: Extract `ApplicationsToolbar` (search + filter)

**Files:**
- Create: `src/features/applications/components/applications-toolbar.tsx`

- [ ] **Step 1: Create the component**

`src/features/applications/components/applications-toolbar.tsx`:

```tsx
"use client";

import {
  Button,
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  IGRPIcon,
  Input,
} from "@igrp/igrp-framework-react-design-system";
import { STATUS_OPTIONS } from "@/lib/constants";

interface ApplicationsToolbarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  statusFilter: string[];
  onStatusFilterChange: (next: string[]) => void;
  disabled?: boolean;
}

export function ApplicationsToolbar({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  disabled = false,
}: ApplicationsToolbarProps) {
  return (
    <div className="flex flex-col sm:flex-row items-start gap-4 w-full">
      <div className="relative w-full max-w-sm">
        <IGRPIcon
          iconName="Search"
          className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground"
          strokeWidth={2}
        />
        <Input
          type="search"
          placeholder="Pesquisar aplicações..."
          className="w-full bg-background pl-8"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          disabled={disabled}
        />
      </div>
      <div className="flex flex-wrap gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2" disabled={disabled}>
              <IGRPIcon iconName="ListFilter" strokeWidth={2} />
              Estado {statusFilter.length > 0 && `(${statusFilter.length})`}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-40">
            <DropdownMenuSeparator />
            {STATUS_OPTIONS.map(({ value, label }) => (
              <DropdownMenuCheckboxItem
                key={value}
                checked={statusFilter.includes(value)}
                onCheckedChange={(checked) => {
                  onStatusFilterChange(
                    checked
                      ? [...statusFilter, value]
                      : statusFilter.filter((s) => s !== value),
                  );
                }}
              >
                {label}
              </DropdownMenuCheckboxItem>
            ))}
            {statusFilter.length > 0 && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => onStatusFilterChange([])}
                  className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                >
                  <IGRPIcon iconName="X" className="mr-1" strokeWidth={2} />
                  Limpar
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/features/applications/components/applications-toolbar.tsx
git commit -m "refactor(applications): extract ApplicationsToolbar"
```

---

### Task 14: Extract `ApplicationsGrid` with pure filter helper + memoization

**Files:**
- Create: `src/features/applications/components/applications-grid.tsx`
- Create: `src/__tests__/applications/applications-grid.test.tsx`

- [ ] **Step 1: Write the filter unit test**

`src/__tests__/applications/applications-grid.test.tsx`:

```tsx
import type { ApplicationDTO } from "@igrp/platform-access-management-client-ts";
import { describe, expect, it } from "vitest";
import { filterApplications } from "@/features/applications/components/applications-grid";

const apps = [
  { code: "ALPHA", name: "Alpha", description: "first", status: "ACTIVE" },
  { code: "BETA", name: "Beta", description: "second", status: "INACTIVE" },
  { code: "GAMMA", name: "Gamma", description: undefined, status: "ACTIVE" },
] as unknown as ApplicationDTO[];

describe("filterApplications", () => {
  it("returns all when search and filter are empty", () => {
    expect(filterApplications(apps, "", [])).toHaveLength(3);
  });

  it("matches by name (case-insensitive)", () => {
    expect(filterApplications(apps, "alp", []).map((a) => a.code)).toEqual([
      "ALPHA",
    ]);
  });

  it("matches by code", () => {
    expect(filterApplications(apps, "beta", []).map((a) => a.code)).toEqual([
      "BETA",
    ]);
  });

  it("matches by description", () => {
    expect(filterApplications(apps, "second", []).map((a) => a.code)).toEqual([
      "BETA",
    ]);
  });

  it("filters by status", () => {
    expect(
      filterApplications(apps, "", ["ACTIVE"]).map((a) => a.code),
    ).toEqual(["ALPHA", "GAMMA"]);
  });

  it("combines search and status", () => {
    expect(
      filterApplications(apps, "a", ["ACTIVE"]).map((a) => a.code),
    ).toEqual(["ALPHA", "GAMMA"]);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm test -- src/__tests__/applications/applications-grid.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Create the grid component + filter helper**

`src/features/applications/components/applications-grid.tsx`:

```tsx
"use client";

import type { ApplicationDTO } from "@igrp/platform-access-management-client-ts";
import { useDeferredValue, useMemo } from "react";
import { ApplicationCard } from "./app-card";

export function filterApplications(
  apps: ApplicationDTO[],
  searchTerm: string,
  statusFilter: string[],
): ApplicationDTO[] {
  const needle = searchTerm.toLowerCase();
  return apps.filter((app) => {
    const matchesSearch =
      !needle ||
      app.name?.toLowerCase().includes(needle) ||
      app.description?.toLowerCase().includes(needle) ||
      app.code?.toLowerCase().includes(needle);
    const matchesStatus =
      statusFilter.length === 0 || statusFilter.includes(app.status);
    return matchesSearch && matchesStatus;
  });
}

interface ApplicationsGridProps {
  applications: ApplicationDTO[];
  searchTerm: string;
  statusFilter: string[];
  onEdit: (app: ApplicationDTO) => void;
  emptyState: React.ReactNode;
}

export function ApplicationsGrid({
  applications,
  searchTerm,
  statusFilter,
  onEdit,
  emptyState,
}: ApplicationsGridProps) {
  const deferredSearch = useDeferredValue(searchTerm);
  const filtered = useMemo(
    () => filterApplications(applications, deferredSearch, statusFilter),
    [applications, deferredSearch, statusFilter],
  );

  if (applications.length === 0) return <>{emptyState}</>;

  if (filtered.length === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground">
        Nenhuma aplicação encontrada. Tente ajustar a sua pesquisa ou filtros.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {filtered.map((app) => (
        <ApplicationCard key={app.id} app={app} onEdit={onEdit} />
      ))}
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify pass**

Run: `pnpm test -- src/__tests__/applications/applications-grid.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/applications/components/applications-grid.tsx \
        src/__tests__/applications/applications-grid.test.tsx
git commit -m "refactor(applications): extract ApplicationsGrid with memoized filter"
```

---

### Task 15: Rewrite `ApplicationList` as composition root

**Files:**
- Modify: `src/features/applications/components/app-list.tsx`

- [ ] **Step 1: Replace with the slim composition**

```tsx
"use client";

import { IGRPButton } from "@igrp/igrp-framework-react-design-system";
import type { ApplicationDTO } from "@igrp/platform-access-management-client-ts";
import { useState } from "react";
import { InlineError } from "@/components/inline-error";
import { AppCenterLoading } from "@/components/loading";
import { PageHeader } from "@/components/page-header";
import { useApplications } from "@/features/applications/use-applications";
import { ApplicationFormDialog } from "./application-form-dialog";
import { ApplicationsGrid } from "./applications-grid";
import { ApplicationsToolbar } from "./applications-toolbar";

export function ApplicationList() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ApplicationDTO | undefined>();

  const { data: applications, isLoading, error, refetch } = useApplications();

  const openCreate = () => {
    setEditing(undefined);
    setDialogOpen(true);
  };

  const openEdit = (app: ApplicationDTO) => {
    setEditing(app);
    setDialogOpen(true);
  };

  if (isLoading)
    return <AppCenterLoading description="Carregando aplicações..." />;

  if (error)
    return <InlineError message={error.message} onRetry={() => refetch()} />;

  const allApps = applications ?? [];
  const appEmpty = allApps.length === 0;

  const emptyState = (
    <div className="text-center py-8 text-muted-foreground border border-muted-foreground/30 rounded-md">
      <p className="mb-4">Nenhuma aplicação encontrada.</p>
      <IGRPButton
        variant="outline"
        showIcon
        iconName="Grid2x2Plus"
        onClick={openCreate}
      >
        Criar Nova Aplicação
      </IGRPButton>
    </div>
  );

  return (
    <div className="flex flex-col gap-10 animate-fade-in">
      <PageHeader
        title="Gerir Aplicações"
        description="Gerir Menus de Aplicações."
        showActions
      >
        <IGRPButton showIcon iconName="Grid2x2Plus" onClick={openCreate}>
          Nova Aplicação
        </IGRPButton>
      </PageHeader>

      <div className="flex flex-col gap-6">
        <ApplicationsToolbar
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          disabled={appEmpty}
        />

        <ApplicationsGrid
          applications={allApps}
          searchTerm={searchTerm}
          statusFilter={statusFilter}
          onEdit={openEdit}
          emptyState={emptyState}
        />
      </div>

      <ApplicationFormDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditing(undefined);
        }}
        application={editing}
      />
    </div>
  );
}
```

- [ ] **Step 2: Type-check + smoke test**

Run: `pnpm exec tsc --noEmit && pnpm dev`. Verify:
1. Listing renders with cards.
2. "Nova Aplicação" opens an empty form.
3. Clicking the pencil on any non-SYSTEM card opens the same dialog prefilled.
4. Empty state (filter out everything) shows the "Criar Nova" CTA.
5. After creating, list refreshes.

- [ ] **Step 3: Commit**

```bash
git add src/features/applications/components/app-list.tsx
git commit -m "refactor(applications): slim ApplicationList into a composition root"
```

---

## Phase 4 — Final Polish

### Task 16: Hoist `TooltipProvider` to `(igrp)` layout

**Files:**
- Modify: `src/app/(igrp)/layout.tsx`

- [ ] **Step 1: Confirm `TooltipProvider` is exported by the design system**

Run: `grep -rn 'TooltipProvider' node_modules/@igrp/igrp-framework-react-design-system/dist 2>/dev/null | head -5`

If exported, proceed. Otherwise, import from the underlying primitive (commonly Radix UI re-export). If the design system doesn't expose a global provider pattern, skip this task and document — no harm done.

- [ ] **Step 2: Wrap children**

`src/app/(igrp)/layout.tsx`:

```tsx
import { TooltipProvider } from "@igrp/igrp-framework-react-design-system";
import { verifySession } from "@/lib/dal";
import { QueryProvider } from "@/providers/query-provider";

export default async function IGRPRootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  await verifySession();
  return (
    <QueryProvider>
      <TooltipProvider>{children}</TooltipProvider>
    </QueryProvider>
  );
}
```

- [ ] **Step 3: Type-check + smoke test**

Run: `pnpm exec tsc --noEmit && pnpm dev`. Hover over a card edit button — tooltip should still appear.

- [ ] **Step 4: Commit**

```bash
git add src/app/(igrp)/layout.tsx
git commit -m "perf(igrp): hoist TooltipProvider once at the (igrp) layout"
```

---

### Task 17: Guard `registerAccess` effect against re-firing

Even if the server mutation is idempotent, refiring on every render where the mutation function identity churns is wasteful and visible in network traces.

**Files:**
- Modify: `src/features/applications/components/app-details.tsx`

- [ ] **Step 1: Add a ref-guard**

In `src/features/applications/components/app-details.tsx`, replace:

```tsx
useEffect(() => {
  if (code) {
    registerAccess(code);
  }
}, [code, registerAccess]);
```

with:

```tsx
const registeredFor = useRef<string | null>(null);
useEffect(() => {
  if (code && registeredFor.current !== code) {
    registeredFor.current = code;
    registerAccess(code);
  }
}, [code, registerAccess]);
```

(Make sure `useRef` is imported — it already is for `fileInputRef`.)

- [ ] **Step 2: Verify in DevTools**

Run: `pnpm dev`. Open a details page; check Network tab — the access-register call should fire exactly once per navigation to a given `code`.

- [ ] **Step 3: Commit**

```bash
git add src/features/applications/components/app-details.tsx
git commit -m "fix(applications): register access exactly once per code visit"
```

---

### Task 18: Memoize form `defaultValues`

`useForm`'s `defaultValues` is computed inline on every render even though RHF only reads it on mount. Computing it lazily is cheaper and clearer.

**Files:**
- Modify: `src/features/applications/components/app-form.tsx`

- [ ] **Step 1: Wrap `defaultValues` in `useMemo`**

Add `useMemo` to the React import. Replace lines ~54-79 with:

```tsx
const defaultValues = useMemo<CreateApplicationArgs>(
  () =>
    application
      ? {
          name: application.name,
          code: application.code,
          owner: application.owner,
          type: application.type as "INTERNAL" | "EXTERNAL",
          slug: application.slug || "",
          url: application.url || "",
          description: application.description || "",
          status: application.status,
          picture: application.picture || "",
        }
      : {
          name: "",
          code: "",
          owner: "",
          type: appTypeCrud.enum.INTERNAL,
          slug: "",
          url: "",
          description: "",
          status: "ACTIVE",
          picture: "",
        },
  [application],
);

const form = useForm<CreateApplicationArgs>({
  resolver: zodResolver(CreateApplicationSchema),
  defaultValues,
});
```

Add to imports:
```tsx
import { useMemo } from "react";
```

- [ ] **Step 2: Type-check**

Run: `pnpm exec tsc --noEmit`
Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add src/features/applications/components/app-form.tsx
git commit -m "perf(applications): memoize form defaultValues"
```

---

### Task 19: Full verification + cleanup

- [ ] **Step 1: Run full quality gate**

```bash
pnpm lint
pnpm exec tsc --noEmit
pnpm test
pnpm build
```

All four must succeed before claiming done.

- [ ] **Step 2: Manual smoke pass**

Run: `pnpm dev`. Walk through:
1. `/settings/applications` loads instantly (no spinner).
2. Search by name, code, description — results filter without input lag.
3. Status filter dropdown — single + multi + clear.
4. "Nova Aplicação" creates an app → list updates.
5. Pencil on a card → edit dialog opens with prefilled values → save → list updates.
6. SYSTEM apps have no edit pencil.
7. Card thumbnail click opens details (`/settings/applications/<code>`).
8. Details page loads instantly. Upload a picture → toast → image renders. Network tab shows update with only `{ picture }`.
9. Throttle network offline → click a different details → `InlineError` with Retry. Go online → click Retry → loads.
10. Hover any card edit button → tooltip works.

- [ ] **Step 3: Final commit**

If any commits accumulated for fixups during smoke testing:

```bash
git add -A
git commit -m "chore(applications): verification fixups"
```

---

## Notes for the Implementer

- **Bundle barrel imports (review item #2):** Already mitigated by `next.config.ts:47-53` which lists `@igrp/igrp-framework-react-design-system` in `optimizePackageImports`. No code change needed.
- **Server action auth (review item #16):** Existing `getClientAccess()` in `src/actions/access-client.ts` is assumed to handle session validation. If a security audit shows otherwise, that is a separate plan — out of scope here.
- **Routing on create (review item #15):** Existing behavior — `router.push` after creating an application — is preserved. If product wants a different UX, follow up in a separate task.
- **Always commit at the end of each task.** If a task fails partway, fix forward; don't squash unrelated changes.
- **If a step's expected output doesn't match reality, stop and ask** rather than improvising. The plan is precise on purpose.
