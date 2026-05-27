# Perf / UX Refactors Implementation Plan (Plan C)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert the dashboard to an RSC with Pattern A data loading, add loading skeletons and tiered error handling, standardize data-driven routes, and land cheap a11y wins — finishing the cleanup of the three files Plan B excluded so the `check:ui` gate can flip to blocking.

**Architecture:** "Push the client boundary to the leaves." Server Components prefetch React Query data and dehydrate it through `HydrationBoundary`; interactive state lives in small client shells. Mutations (e.g. favorite toggle) keep working because client components read from the hydrated cache, not props.

**Tech Stack:** Next.js 15 App Router (RSC, `HydrationBoundary`, `loading.tsx`), TanStack Query 5, `react-error-boundary`, IGRP design system (`Skeleton`, `Empty`, `IGRPDataTable`).

**Prerequisites:** Plan A merged (gate exists). Plan B merged (strict violations cleared except in the 3 files this plan rebuilds).

---

## Critical correctness note: query-key parity

Prefetch keys MUST exactly match the hook keys or hydration silently no-ops (the client refetches, defeating the purpose). Verified hook keys:

| Hook | Key |
|---|---|
| `useCurrentUserApplications()` | `["current-user-applications"]` |
| `useCurrentUserFavoriteApplications()` (no arg) | `["favorite-applications", undefined]` |
| `useGetCurrentUserRecentApplications()` (no arg) | `["recent-applications", undefined]` |

The prefetch helper below uses these exact keys, including the trailing `undefined`.

---

### Task 1: Create the dashboard prefetch helper

**Files:**
- Create: `src/features/users/prefetch.ts`
- Test: `src/features/users/prefetch.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/features/users/prefetch.test.ts`:

```ts
import { describe, expect, it, vi } from "vitest";

vi.mock("@/actions/user", () => ({
  getCurrentUserApplications: vi.fn(async () => ({ success: true, data: [{ id: "1", code: "A" }] })),
  getCurrentUserFavoriteApplications: vi.fn(async () => ({ success: true, data: [] })),
  getCurrentUserRecentApplications: vi.fn(async () => ({ success: true, data: [] })),
}));

import { makeQueryClient } from "@/providers/query-provider";
import { prefetchCurrentUserDashboard } from "./prefetch";

describe("prefetchCurrentUserDashboard", () => {
  it("populates the cache under the exact hook keys", async () => {
    const client = makeQueryClient();
    await prefetchCurrentUserDashboard(client);
    expect(client.getQueryData(["current-user-applications"])).toHaveLength(1);
    expect(client.getQueryData(["favorite-applications", undefined])).toEqual([]);
    expect(client.getQueryData(["recent-applications", undefined])).toEqual([]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/features/users/prefetch.test.ts`
Expected: FAIL — `Failed to resolve import "./prefetch"`.

- [ ] **Step 3: Write the prefetch helper**

Create `src/features/users/prefetch.ts`:

```ts
import type { QueryClient } from "@tanstack/react-query";
import {
  getCurrentUserApplications,
  getCurrentUserFavoriteApplications,
  getCurrentUserRecentApplications,
} from "@/actions/user";
import { makeQueryClient } from "@/providers/query-provider";

export { makeQueryClient };

export async function prefetchCurrentUserDashboard(client: QueryClient) {
  await Promise.all([
    client.prefetchQuery({
      queryKey: ["current-user-applications"],
      queryFn: async () => {
        const r = await getCurrentUserApplications();
        if (!r.success) throw new Error(r.error);
        return r.data;
      },
    }),
    client.prefetchQuery({
      queryKey: ["favorite-applications", undefined],
      queryFn: async () => {
        const r = await getCurrentUserFavoriteApplications();
        if (!r.success) throw new Error(r.error);
        return r.data;
      },
    }),
    client.prefetchQuery({
      queryKey: ["recent-applications", undefined],
      queryFn: async () => {
        const r = await getCurrentUserRecentApplications();
        if (!r.success) throw new Error(r.error);
        return r.data;
      },
    }),
  ]);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run src/features/users/prefetch.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/users/prefetch.ts src/features/users/prefetch.test.ts
git commit -m "feat(home): add current-user dashboard prefetch helper"
```

---

### Task 2: Extract the dashboard client shell

**Files:**
- Create: `src/app/(igrp)/(home)/home-dashboard.tsx`
- Modify: `src/app/(igrp)/(home)/page.tsx`

- [ ] **Step 1: Move the current client body into a shell component**

Create `src/app/(igrp)/(home)/home-dashboard.tsx` with `"use client"` at the top, containing the entire current body of `page.tsx` (the `useState` for `taskSearch`/`date`, the `IGRPTabs`, the Calendar, and `<ApplicationsListHome />`). Rename the exported function to `HomeDashboard`. **While moving, apply the shadcn-rule fixes that Plan B skipped here** (any `space-y`→`flex gap`, `w-N h-N`→`size-N`, raw colors→tokens in this file).

Replace the dead `initialTasks: [] = []` Tarefas content with a proper `Empty` state:

```tsx
import { Empty } from "@igrp/igrp-framework-react-design-system";
// inside the "Tarefas" tab content, instead of mapping an empty array:
<Empty
  title="Sem tarefas"
  description="Ainda não há tarefas atribuídas."
/>
```

(When the SDK tasks endpoint lands — backlog #15 — this Empty is replaced by a `useTasks()` query prefetched alongside the others in Task 3.)

- [ ] **Step 2: Convert `page.tsx` to an RSC**

Replace `src/app/(igrp)/(home)/page.tsx` entirely with:

```tsx
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import {
  makeQueryClient,
  prefetchCurrentUserDashboard,
} from "@/features/users/prefetch";
import { HomeDashboard } from "./home-dashboard";

export default async function HomeIGRP() {
  const queryClient = makeQueryClient();
  await prefetchCurrentUserDashboard(queryClient);
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <HomeDashboard />
    </HydrationBoundary>
  );
}
```

- [ ] **Step 3: Verify build and runtime behavior**

Run: `pnpm build`
Expected: pass — `page.tsx` is now a Server Component (no `"use client"`), `home-dashboard.tsx` is the client boundary.
Then `pnpm dev`, open `/`: the apps grid should appear on first paint (server-prefetched). **Click a favorite star — it must toggle and persist** (confirms the cache hydration + mutation path works). Reload — favorites reflect the change.

- [ ] **Step 4: Verify the gate cleared this file**

Run: `pnpm check:ui 2>&1 | grep "(home)/page.tsx"`
Expected: no output (file rebuilt clean).

- [ ] **Step 5: Commit**

```bash
git add "src/app/(igrp)/(home)/page.tsx" "src/app/(igrp)/(home)/home-dashboard.tsx"
git commit -m "perf(home): convert dashboard to RSC with Pattern A prefetch/hydration"
```

---

### Task 3: Tiered error handling in the dashboard list

**Files:**
- Modify: `src/features/applications/components/app-list-home.tsx`
- Modify: `AGENTS.md`

- [ ] **Step 1: Make supplementary-query failures inline, primary failure throw**

In `app-list-home.tsx`: the primary query is `useCurrentUserApplications` — keep `if (error) throw error` for it (page-critical: no apps = nothing to show). For favorites/recent, do NOT throw — render the apps grid and show an inline retryable error only in those sections. Update the destructuring and guards:

```tsx
const { data: applications, isLoading, error } = useCurrentUserApplications();
const {
  data: favorites,
  isError: favoritesError,
  refetch: refetchFavorites,
} = useCurrentUserFavoriteApplications();
const {
  data: recent,
  isError: recentError,
  refetch: refetchRecent,
} = useGetCurrentUserRecentApplications();

// gate ONLY on the primary query:
if (isLoading) return <AppCenterLoading description="Carregando aplicações..." />;
if (error) throw error; // page-critical → route error boundary

// ...then in the Favorites section, if favoritesError render <InlineError onRetry={refetchFavorites} />
// instead of the favorites grid; same for recent.
```

While here, apply the shadcn-rule fixes Plan B skipped in this file (the `fill-yellow-400` star, any `size`/`space` issues).

- [ ] **Step 2: Add the policy note to AGENTS.md**

In `AGENTS.md`, under the Data layer or Conventions section, add:

```markdown
- Error handling: throw to the route `error.tsx` only for **page-critical** data (the primary query a page exists to show); use `InlineError`/`Alert` + retry for **supplementary** data (e.g. dashboard favorites/recent) so one non-essential failure doesn't blank the page.
```

- [ ] **Step 3: Verify**

Run: `pnpm lint && pnpm build`
Expected: pass.
Run: `pnpm check:ui 2>&1 | grep app-list-home`
Expected: no output (file cleared).

- [ ] **Step 4: Commit**

```bash
git add src/features/applications/components/app-list-home.tsx AGENTS.md
git commit -m "fix(home): tiered error handling for supplementary dashboard queries"
```

---

### Task 4: Add `loading.tsx` skeletons for users and departments

**Files:**
- Create: `src/app/(igrp)/(home)/settings/users/loading.tsx`
- Create: `src/app/(igrp)/(home)/settings/departments/loading.tsx`

- [ ] **Step 1: Create the users loading skeleton**

Create `src/app/(igrp)/(home)/settings/users/loading.tsx`:

```tsx
import { Skeleton } from "@igrp/igrp-framework-react-design-system";

export default function Loading() {
  return (
    <div className="flex flex-col gap-4 p-4">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-10 w-full" />
      <div className="flex flex-col gap-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create the departments loading skeleton**

Create `src/app/(igrp)/(home)/settings/departments/loading.tsx`:

```tsx
import { Skeleton } from "@igrp/igrp-framework-react-design-system";

export default function Loading() {
  return (
    <div className="flex gap-4 p-4">
      <div className="flex flex-col gap-2 w-72">
        {Array.from({ length: 10 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-full" />
        ))}
      </div>
      <Skeleton className="h-96 flex-1" />
    </div>
  );
}
```

- [ ] **Step 3: Verify**

Run: `pnpm build`
Expected: pass. Then `pnpm dev`, navigate to `/settings/users` and `/settings/departments` — a skeleton shows during the server fetch instead of a frozen previous screen.

- [ ] **Step 4: Commit**

```bash
git add "src/app/(igrp)/(home)/settings/users/loading.tsx" "src/app/(igrp)/(home)/settings/departments/loading.tsx"
git commit -m "feat(settings): add loading skeletons for users and departments routes"
```

---

### Task 5: Standardize data-driven routes on Pattern A

**Files:**
- Modify: `src/app/(igrp)/(home)/settings/users/[id]/page.tsx`
- Modify: `src/app/(igrp)/(home)/settings/departments/page.tsx`
- (users list `page.tsx` — deprioritized; only migrate if time permits since it already works via `initialData`)

- [ ] **Step 1: Audit each route's current data path**

Run: `pnpm check:ui >/dev/null; grep -nE "HydrationBoundary|getUser|getDepartment|initialData|props" "src/app/(igrp)/(home)/settings/users/[id]/page.tsx" "src/app/(igrp)/(home)/settings/departments/page.tsx"`
Expected: shows whether each fetches server-side and how it passes data. Determine, per route, the client component and the hook + query key it uses (mirror the Task 1 parity discipline).

- [ ] **Step 2: Migrate `departments/page.tsx` to prefetch + HydrationBoundary**

Following the pattern in `src/app/(igrp)/(home)/settings/applications/page.tsx`: add (or reuse) a `prefetchDepartments(client)` helper in the departments feature whose `queryKey` exactly matches the `useDepartments()` hook key, then:

```tsx
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { makeQueryClient } from "@/providers/query-provider";
import { prefetchDepartments } from "@/features/departments/prefetch";
import { DepartmentsView } from "@/features/departments/components/...";

export default async function DepartmentsPage() {
  const queryClient = makeQueryClient();
  await prefetchDepartments(queryClient);
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <DepartmentsView />
    </HydrationBoundary>
  );
}
```

If the departments client component currently takes data via props, switch it to the `useDepartments()` hook (seeded by the hydrated cache) so mutations stay cache-driven.

- [ ] **Step 3: Migrate `users/[id]/page.tsx`**

Same shape: prefetch the single-user query with the exact `useUser(id)` key, wrap the detail client component in `HydrationBoundary`. Verify the user-detail tabs (which already use `Suspense`) still hydrate.

- [ ] **Step 4: Verify**

Run: `pnpm lint && pnpm build`
Expected: pass. Then `pnpm dev`: navigate to departments and a user detail — data appears on first paint, and a mutation (e.g. edit) updates without a full reload.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "perf(settings): standardize departments and user-detail routes on Pattern A"
```

---

### Task 6: Extract users-table column factories

**Files:**
- Create: `src/features/users/components/users-columns.tsx`
- Create: `src/features/users/components/invitations-columns.tsx`
- Modify: `src/features/users/components/user-list-table.tsx`

- [ ] **Step 1: Move the active-users column factory out**

Cut the `getActiveColumns`/users `ColumnDef<IGRPUserDTO>[]` factory (around user-list-table.tsx:207-300) into `users-columns.tsx`, exporting it. Keep the exact function name and signature. Import it back into `user-list-table.tsx`. **Apply the shadcn-rule fixes Plan B skipped in this file** (any `space`/`size`/color hits in the moved code and the remaining body).

- [ ] **Step 2: Move the invitations column factory out**

Cut the invitations `ColumnDef<InvitationDTO>[]` factory (around :304-355) into `invitations-columns.tsx`, exporting it; import back. Body of `user-list-table.tsx` (state, tabs, `IGRPDataTable` usage) stays put.

- [ ] **Step 3: Verify**

Run: `pnpm lint && pnpm build && pnpm vitest run`
Expected: pass.
Run: `pnpm check:ui 2>&1 | grep user-list-table`
Expected: no output (file cleared — completes the excluded-file cleanup).

- [ ] **Step 4: Commit**

```bash
git add src/features/users/components/users-columns.tsx src/features/users/components/invitations-columns.tsx src/features/users/components/user-list-table.tsx
git commit -m "refactor(users): extract table column factories to own modules"
```

---

### Task 7: Cheap accessibility wins

**Files:**
- Modify: icon-button usages, title-less modals, form fields (locations from audit in Step 1)

- [ ] **Step 1: Find the gaps**

Run: `grep -rnE "IGRPButton[^>]*iconName" src --include=*.tsx | head -40` to find icon-only buttons; run `grep -rnE "IGRPModalDialog|DialogContent" src --include=*.tsx` to find dialogs and check each has a visible or `sr-only` title.
Expected: a list to triage. Focus on icon-only buttons lacking accessible names and dialogs lacking titles.

- [ ] **Step 2: Add accessible names to icon-only buttons**

For each icon-only button, add an `aria-label` describing the action (e.g. `aria-label="Editar"`, `aria-label="Eliminar"`). Do not change layout.

- [ ] **Step 3: Ensure every dialog has a title**

For dialogs without a visible title, add a title with `className="sr-only"` (shadcn rule: `DialogTitle`/`IGRPModalDialog` title is required for screen readers).

- [ ] **Step 4: Verify**

Run: `pnpm lint && pnpm build`
Expected: pass. If `axe`/browser devtools are available, spot-check a dialog and a toolbar for "button has no accessible name" / "dialog has no label" — expect none on touched components.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "a11y: add aria-labels to icon buttons and sr-only titles to dialogs"
```

---

### Task 8: Flip pagination on for unpaginated tables

**Files:**
- Modify: any `IGRPDataTable` usage missing `showPagination` (audit in Step 1)

- [ ] **Step 1: Find unpaginated tables**

Run: `grep -rnE "<IGRPDataTable" src --include=*.tsx -A6 | grep -B6 -L "showPagination" || grep -rn "IGRPDataTable" src --include=*.tsx`
Expected: identify `IGRPDataTable` instances without `showPagination`. (The users table already has it.)

- [ ] **Step 2: Enable pagination where missing**

For each, add `showPagination` and a sensible `pageSizePagination={[10, 25, 50]}`:

```tsx
<IGRPDataTable
  columns={columns}
  data={data}
  showPagination
  pageSizePagination={[10, 25, 50]}
/>
```

Leave the applications **grid** (card layout, not `IGRPDataTable`) alone unless it's a table.

- [ ] **Step 3: Verify**

Run: `pnpm build`
Expected: pass. Then `pnpm dev`: confirm paginated tables render one page with working prev/next + page-size selector.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "perf(tables): enable IGRPDataTable client pagination on remaining tables"
```

---

### Task 9: Confirm strict count is zero and flip the gate to blocking

**Files:**
- Modify: `.gitlab-ci.yml`, `AGENTS.md` (this is Plan A's deferred Task 6)

- [ ] **Step 1: Confirm zero strict violations**

Run: `pnpm check:ui`
Expected: summary shows `0 strict` (advisory `use-size` may remain). The 3 previously-excluded files are now clean (Tasks 2, 3, 6).

- [ ] **Step 2: Execute Plan A Task 6**

Remove `allow_failure: true` (and its comment) from the `validate` job in `.gitlab-ci.yml`, and remove the trailing "allow_failure until cleanup" sentence from the `check:ui` bullet in `AGENTS.md`.

- [ ] **Step 3: Verify**

Run: `pnpm check:ui && echo "GATE CLEAN"`
Expected: prints `GATE CLEAN` (exit 0). The gate now blocks merges on any new strict violation.

- [ ] **Step 4: Commit**

```bash
git add .gitlab-ci.yml AGENTS.md
git commit -m "ci: make check:ui strict rules block merges"
```

---

## Self-Review

**Spec coverage:** #7 home RSC+Pattern A → Tasks 1-3; #8 loading.tsx → Task 4; #9 tiered errors → Task 3; #10 Pattern A standardization → Task 5; #11 column extraction → Task 6; #12 a11y → Task 7; #13 pagination → Task 8; excluded-file cleanup + gate flip → Tasks 2/3/6 + Task 9. ✓

**Placeholder scan:** RSC/prefetch/loading code is complete and concrete. Task 5 (departments/users-detail) and Tasks 7-8 are necessarily audit-then-apply because exact hook keys / missing-pagination sites must be read at execution time — each provides the exact audit command, the pattern to follow (the existing `applications/page.tsx`), and the parity discipline, not a vague "fix it". This is honest given the per-route variation. ✓

**Type/consistency:** `prefetchCurrentUserDashboard` uses the three verified query keys; the test asserts the same keys; Task 2's RSC imports `makeQueryClient` + `prefetchCurrentUserDashboard` from the file Task 1 creates. `HomeDashboard` (Task 2) is the name imported by `page.tsx`. The favorite-toggle verification (Task 2 Step 3) directly tests the cache-hydration requirement that drove choosing Pattern A over props. ✓

**Dependency note:** Task 9 depends on Plan B being merged AND Tasks 2/3/6 of this plan clearing the excluded files. Do not run Task 9 until `pnpm check:ui` actually shows `0 strict`.
