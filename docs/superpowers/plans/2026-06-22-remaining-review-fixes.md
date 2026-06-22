# Remaining Review Fixes — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the remaining not-done / partially-done items from the codebase review — test coverage for the server/data/auth layer, `queryOptions` adoption, a shared selectable table, the `departments/Modal` derived-state fix, hook-extraction refactors of the three god components, a Report-Only CSP, and the convention-drift cleanups.

**Architecture:** Each Part below is an independent, separately-executable mini-plan ordered low-risk → high-risk. Parts A–C add tests (pure TDD). Parts D–I are refactors whose "test" is: existing suite still green + `tsc` clean + `check:ui` clean + (for UI) a manual app run. Do Parts in order; within a Part, do tasks in order. Commit after every task.

**Tech Stack:** Next.js 15.5 (App Router, Turbopack, `output: standalone`, `typedRoutes`), React 19, TanStack Query v5, TanStack Table v8, Zod v4, react-hook-form, `@igrp/igrp-framework-react-design-system` (shadcn-based), Biome 2.4, Vitest 4 + Testing Library + jsdom.

## Global Constraints

- **Package manager:** pnpm; Node `>=22`. Run scripts with `pnpm`.
- **Lint/format gate:** Biome, 2-space indent. `pnpm lint` = `biome check --write`. Build runs `biome format --error-on-warnings .` — **never leave a file unformatted**.
- **UI rules (`pnpm check:ui`, blocking):** no `space-x/y-*` (use `flex gap-*`), no raw palette colors (`bg-emerald-600`) — use semantic tokens (`bg-success`, `text-destructive`, `bg-muted`) or `Badge`/Button `variant`; no `animate-pulse` (use `Skeleton`); no manual `dark:` color overrides; no `<hr>`/`border-t` dividers (use `Separator`); prefer `size-N` over `w-N h-N`. The scanner now globs `.ts` **and** `.tsx`.
- **Design system:** import UI from `@igrp/igrp-framework-react-design-system`; prefer Horizon components (`IGRP*`) before primitives; never hand-roll a component that exists.
- **Routes:** `typedRoutes: true` — never hand-build hrefs that bypass the type checker.
- **Data layer:** server actions in `src/actions/*` return `ActionResult<T>` (`src/actions/types.ts`); `queryFn`s call `unwrap(await action())` so failures throw `HttpStatusError`. Query keys come from the per-feature `query-keys.ts` factories.
- **Tests:** live under `src/__tests__/`, mirror the source path, `*.test.ts(x)`. Globals are on (`describe`/`it`/`expect`/`vi` available). `server-only` is aliased to a stub and mocked in `src/test-setup.ts`. Run a single file with `pnpm test <path>` (alias for `vitest run`).
- **Known baseline (do not "fix" by deleting):** `src/__tests__/users/use-users.test.tsx`, `use-update-user.test.tsx`, `user-profile-avatar.test.tsx`, and `components/user-list-table.test.tsx` fail/crash at import on a broken `@igrp` package reference (`dist/components/custom/stats-card-mini`) and a missing component module. These are pre-existing; the bar is **no NEW failures beyond these**.
- **Commit style:** end commit messages with `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`. Branch off `dev` for a PR; do not push unless asked.

---

## Part A — Auth & DAL unit tests

**Why:** `src/lib/utils.ts` (auth predicates, `sanitizeCallbackUrl`) and `src/lib/dal.ts` (`verifySession`, `getAuthenticatedUser`) have zero coverage and gate every protected route. They are pure / easily-mockable — highest value-per-effort.

### Task A1: `sanitizeCallbackUrl` + auth-predicate tests

**Files:**
- Test: `src/__tests__/lib/auth-utils.test.ts` (create)
- Read-only: `src/lib/utils.ts`

**Interfaces:**
- Consumes: `isPreviewMode()`, `isAuthDisabled()`, `isAuthBypass()`, `sanitizeCallbackUrl(raw, basePath?)` from `@/lib/utils`.

- [ ] **Step 1: Write the failing test**

```ts
// src/__tests__/lib/auth-utils.test.ts
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  isAuthBypass,
  isAuthDisabled,
  isPreviewMode,
  sanitizeCallbackUrl,
} from "@/lib/utils";

const ENV = process.env;
beforeEach(() => {
  process.env = { ...ENV };
});
afterEach(() => {
  process.env = ENV;
});

describe("isPreviewMode / isAuthDisabled / isAuthBypass", () => {
  it("reads IGRP_PREVIEW_MODE tolerantly (quotes, case, whitespace)", () => {
    process.env.IGRP_PREVIEW_MODE = ' "TRUE" ';
    expect(isPreviewMode()).toBe(true);
  });

  it("treats AUTH_PROVIDER=none as auth disabled", () => {
    process.env.AUTH_PROVIDER = "none";
    expect(isAuthDisabled()).toBe(true);
  });

  it("isAuthBypass is true when either preview or provider=none", () => {
    process.env.IGRP_PREVIEW_MODE = "false";
    process.env.AUTH_PROVIDER = "keycloak";
    expect(isAuthBypass()).toBe(false);
    process.env.AUTH_PROVIDER = "none";
    expect(isAuthBypass()).toBe(true);
  });
});

describe("sanitizeCallbackUrl", () => {
  it("accepts a safe same-origin relative path", () => {
    expect(sanitizeCallbackUrl("/settings/users")).toBe("/settings/users");
  });

  it("rejects open-redirect and absolute targets", () => {
    expect(sanitizeCallbackUrl("//evil.com")).toBeUndefined();
    expect(sanitizeCallbackUrl("http://evil.com")).toBeUndefined();
    expect(sanitizeCallbackUrl("")).toBeUndefined();
    expect(sanitizeCallbackUrl(123)).toBeUndefined();
  });

  it("rejects loops back to the auth chrome", () => {
    expect(sanitizeCallbackUrl("/login")).toBeUndefined();
    expect(sanitizeCallbackUrl("/login/x")).toBeUndefined();
    expect(sanitizeCallbackUrl("/logout")).toBeUndefined();
  });

  it("normalizes basePath before the /login check", () => {
    expect(sanitizeCallbackUrl("/app/login", "/app")).toBeUndefined();
    expect(sanitizeCallbackUrl("/app/settings", "/app")).toBe("/app/settings");
  });
});
```

- [ ] **Step 2: Run it to verify it fails (red)**

Run: `pnpm test src/__tests__/lib/auth-utils.test.ts`
Expected: FAILS only if behavior diverges. (These assert existing behavior, so they should pass once the file resolves; if any fails, the test encodes the intended contract and the source is the bug — flag it, do not weaken the test.)

- [ ] **Step 3: Confirm green**

Run: `pnpm test src/__tests__/lib/auth-utils.test.ts`
Expected: PASS (4 + 3 assertions across the suites).

- [ ] **Step 4: Commit**

```bash
git add src/__tests__/lib/auth-utils.test.ts
git commit -m "test(auth): cover auth predicates and sanitizeCallbackUrl"
```

### Task A2: `dal.ts` bypass + user-narrowing tests

**Files:**
- Test: `src/__tests__/lib/dal.test.ts` (create)
- Read-only: `src/lib/dal.ts`

**Interfaces:**
- Consumes: `verifySession()`, `getAuthenticatedUser()` from `@/lib/dal`.
- Mocks: `@/lib/auth` (`getSession`), `@/lib/utils` (`isAuthBypass`), `next/navigation` (`redirect`), `next/headers` (`headers`).

- [ ] **Step 1: Write the failing test**

```ts
// src/__tests__/lib/dal.test.ts
import { beforeEach, describe, expect, it, vi } from "vitest";

const getSession = vi.fn();
const isAuthBypass = vi.fn();
const redirect = vi.fn((url: string) => {
  throw new Error(`REDIRECT:${url}`);
});
const headersGet = vi.fn(() => null);

vi.mock("@/lib/auth", () => ({ getSession: () => getSession() }));
vi.mock("@/lib/utils", () => ({ isAuthBypass: () => isAuthBypass() }));
vi.mock("next/navigation", () => ({ redirect: (u: string) => redirect(u) }));
vi.mock("next/headers", () => ({
  headers: async () => ({ get: headersGet }),
}));
// configLayout is imported transitively via getLayoutConfig; stub it out.
vi.mock("@/actions/igrp/layout", () => ({ configLayout: vi.fn() }));

import { getAuthenticatedUser, verifySession } from "@/lib/dal";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("verifySession", () => {
  it("returns a stub session in bypass mode without calling getSession", async () => {
    isAuthBypass.mockReturnValue(true);
    const s = await verifySession();
    expect(s.user?.email).toBe("preview@example.com");
    expect(getSession).not.toHaveBeenCalled();
  });

  it("redirects to /login when there is no session", async () => {
    isAuthBypass.mockReturnValue(false);
    getSession.mockResolvedValue(null);
    await expect(verifySession()).rejects.toThrow("REDIRECT:/login");
  });
});

describe("getAuthenticatedUser", () => {
  it("narrows the session to id/name/email/accessToken only", async () => {
    isAuthBypass.mockReturnValue(false);
    getSession.mockResolvedValue({
      user: { id: "u1", name: "Ana", email: "a@x.cv", role: "admin" },
      accessToken: "tok",
      refreshToken: "SECRET",
      expires: "9999-01-01",
    });
    const u = await getAuthenticatedUser();
    expect(u).toEqual({
      id: "u1",
      name: "Ana",
      email: "a@x.cv",
      accessToken: "tok",
    });
    expect(u).not.toHaveProperty("refreshToken");
  });
});
```

> **Note on `cache()`:** `verifySession` is wrapped in React `cache`. Under Vitest (no request scope) `cache` degrades to a plain memo; `vi.clearAllMocks()` + distinct return values per test keep cases independent. If memoization bleeds between the two `verifySession` cases, split them into separate files or use `vi.resetModules()` + dynamic `import()` per test.

- [ ] **Step 2: Run it to verify the contract**

Run: `pnpm test src/__tests__/lib/dal.test.ts`
Expected: PASS. If the bypass test sees `getSession` called, the source regressed — flag it.

- [ ] **Step 3: Commit**

```bash
git add src/__tests__/lib/dal.test.ts
git commit -m "test(dal): cover verifySession bypass/redirect and user narrowing"
```

---

## Part B — Server action tests

**Why:** The `src/actions/*` files wrap every SDK call and funnel errors through `toActionError`. `to-action-error.test.ts` already covers the mapper in isolation; this Part covers an action end-to-end (success shape + error mapping) using the established `vi.mock` pattern. Use `src/actions/applications.ts` as the representative; replicate for `departments.ts`/`user.ts` if time allows.

### Task B1: `getApplications` / `updateApplication` action tests

**Files:**
- Test: `src/__tests__/actions/applications.test.ts` (create)
- Read-only: `src/actions/applications.ts`, `src/actions/access-client.ts`, `src/lib/auth.ts`

**Interfaces:**
- Consumes: the action functions exported from `@/actions/applications` (confirm exact names by reading the file — e.g. `getApplications`, `updateApplication`).
- Mocks: `@/actions/access-client` (the SDK accessor used inside actions) and `@/lib/auth` (`serverSession`), so no network/auth is required.

- [ ] **Step 1: Read the action to get exact symbol + SDK call shape**

Run: `grep -nE "export (async )?function|serverSession|getClientAccess|igrpSetAccessClientConfig" src/actions/applications.ts src/actions/access-client.ts`
Record: the exported action name, what it calls on the SDK client, and the accessor name exported by `access-client.ts`. Use those exact names in Step 2 (do not guess).

- [ ] **Step 2: Write the failing test** (adapt the mocked accessor/method names to what Step 1 found)

```ts
// src/__tests__/actions/applications.test.ts
import { beforeEach, describe, expect, it, vi } from "vitest";

// Replace `getClientAccess` + `applications.getApplications` with the real
// accessor/methods found in Step 1.
const listApplications = vi.fn();
vi.mock("@/actions/access-client", () => ({
  getClientAccess: async () => ({
    applications: { getApplications: listApplications },
  }),
}));
vi.mock("@/lib/auth", () => ({
  serverSession: vi.fn(async () => ({ accessToken: "tok" })),
}));

import { getApplications } from "@/actions/applications";

beforeEach(() => vi.clearAllMocks());

describe("getApplications action", () => {
  it("returns { success: true, data } on a resolved SDK call", async () => {
    listApplications.mockResolvedValue([{ code: "A", name: "App A" }]);
    const res = await getApplications();
    expect(res).toEqual({
      success: true,
      data: [{ code: "A", name: "App A" }],
    });
  });

  it("maps an SDK error to { success: false, error, status } via toActionError", async () => {
    listApplications.mockRejectedValue({ status: 403, title: "Acesso negado" });
    const res = await getApplications();
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.status).toBe(403);
      expect(res.error).toBe("Acesso negado");
    }
  });

  it("falls back to the per-status default message when no title/details", async () => {
    listApplications.mockRejectedValue({ status: 404 });
    const res = await getApplications();
    expect(res.success).toBe(false);
    if (!res.success) expect(res.error).toBe("Recurso não encontrado");
  });
});
```

- [ ] **Step 3: Run it to verify it fails, then passes**

Run: `pnpm test src/__tests__/actions/applications.test.ts`
Expected: first run may FAIL on a mock-shape mismatch (wrong accessor/method name) — fix the mock to match Step 1, not the assertions. Then PASS.

- [ ] **Step 4: Commit**

```bash
git add src/__tests__/actions/applications.test.ts
git commit -m "test(actions): cover applications success + error mapping"
```

### Task B2: Repeat for `departments.ts` and `user.ts` (one happy + one error path each)

**Files:**
- Test: `src/__tests__/actions/departments.test.ts`, `src/__tests__/actions/user.test.ts` (create)

- [ ] **Step 1–4:** Same structure as B1 — read the action for exact names, mock `@/actions/access-client` + `@/lib/auth`, assert one success shape and one `toActionError` mapping per file. Commit each:

```bash
git add src/__tests__/actions/departments.test.ts && git commit -m "test(actions): cover departments success + error mapping"
git add src/__tests__/actions/user.test.ts && git commit -m "test(actions): cover user actions success + error mapping"
```

---

## Part C — Middleware tests

**Why:** `src/middleware.ts` does the auth gate, bypass redirect, and security headers — untested. The path predicates (`isPublicPath`, `isAuthUiPath`) are not exported; export them to test directly, then test `middleware()` behavior with a mocked `auth`.

### Task C1: Export path predicates and test them

**Files:**
- Modify: `src/middleware.ts` (add `export` to `isPublicPath` and `isAuthUiPath`)
- Test: `src/__tests__/middleware/path-predicates.test.ts` (create)

**Interfaces:**
- Produces: `export function isPublicPath(pathname: string): boolean` and `export function isAuthUiPath(pathname: string): boolean` from `@/middleware`.

- [ ] **Step 1: Make the predicates testable**

In `src/middleware.ts`, change `function isPublicPath(` → `export function isPublicPath(` and `function isAuthUiPath(` → `export function isAuthUiPath(`. No logic change.

- [ ] **Step 2: Write the test**

```ts
// src/__tests__/middleware/path-predicates.test.ts
import { describe, expect, it } from "vitest";

import { isAuthUiPath, isPublicPath } from "@/middleware";

describe("isPublicPath", () => {
  it.each(["/login", "/logout", "/api/auth", "/api/auth/callback", "/_next/x", "/favicon.ico", "/logo.png"])(
    "treats %s as public/static",
    (p) => expect(isPublicPath(p)).toBe(true),
  );
  it.each(["/", "/settings/users", "/profile"])(
    "treats %s as protected",
    (p) => expect(isPublicPath(p)).toBe(false),
  );
});

describe("isAuthUiPath", () => {
  it("matches the auth chrome exactly and by prefix", () => {
    expect(isAuthUiPath("/login")).toBe(true);
    expect(isAuthUiPath("/api/auth/x")).toBe(true);
    expect(isAuthUiPath("/settings")).toBe(false);
  });
});
```

- [ ] **Step 3: Run + commit**

```bash
pnpm test src/__tests__/middleware/path-predicates.test.ts   # expect PASS
git add src/middleware.ts src/__tests__/middleware/path-predicates.test.ts
git commit -m "test(middleware): export and cover path predicates"
```

### Task C2: `middleware()` behavior — bypass, missing token, headers

**Files:**
- Test: `src/__tests__/middleware/middleware.test.ts` (create)
- Read-only: `src/middleware.ts`, `src/lib/auth.ts`

**Interfaces:**
- Mocks: `@/lib/auth` exporting an `auth` object with `isAuthDisabled`, `isPreviewMode`, `getTokenFromRequest`, `isTokenExpiredOrFailed`, and a `config` getter; `@/lib/logout-pending` (`LOGOUT_PENDING_COOKIE`).
- Uses real `next/server` `NextRequest`.

- [ ] **Step 1: Write the test**

```ts
// src/__tests__/middleware/middleware.test.ts
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const auth = {
  isAuthDisabled: vi.fn(() => false),
  isPreviewMode: vi.fn(() => false),
  getTokenFromRequest: vi.fn(),
  isTokenExpiredOrFailed: vi.fn(() => false),
  config: {},
};
vi.mock("@/lib/auth", () => ({ auth }));
vi.mock("@/lib/logout-pending", () => ({ LOGOUT_PENDING_COOKIE: "logout_pending" }));

import { middleware } from "@/middleware";

const req = (path: string) =>
  new NextRequest(new URL(`http://localhost${path}`));

beforeEach(() => {
  vi.clearAllMocks();
  auth.isAuthDisabled.mockReturnValue(false);
  auth.isPreviewMode.mockReturnValue(false);
  auth.isTokenExpiredOrFailed.mockReturnValue(false);
});

describe("middleware auth gate", () => {
  it("in bypass mode redirects /login to /", async () => {
    auth.isPreviewMode.mockReturnValue(true);
    const res = await middleware(req("/login"));
    expect(res.status).toBe(307); // redirect
    expect(res.headers.get("location")).toContain("/");
  });

  it("redirects to /login when no token on a protected route", async () => {
    auth.getTokenFromRequest.mockResolvedValue(null);
    const res = await middleware(req("/settings/users"));
    expect(res.headers.get("location")).toContain("/login");
  });

  it("passes a valid token through and sets x-current-path", async () => {
    auth.getTokenFromRequest.mockResolvedValue({ sub: "u1" });
    const res = await middleware(req("/settings/users"));
    // NextResponse.next() → no redirect (status 200) and forwards the header
    expect(res.headers.get("location")).toBeNull();
  });
});

describe("security headers (production)", () => {
  it("sets HSTS and omits the deprecated X-XSS-Protection in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    auth.getTokenFromRequest.mockResolvedValue({ sub: "u1" });
    const res = await middleware(req("/settings/users"));
    expect(res.headers.get("Strict-Transport-Security")).toContain("max-age=");
    expect(res.headers.get("X-XSS-Protection")).toBeNull();
    vi.unstubAllEnvs();
  });
});
```

> If `NextResponse.next()` headers aren't observable in jsdom for the passthrough case, assert on the redirect cases only and drop the passthrough header assertion — keep the bypass + missing-token + HSTS cases, which are the security-critical ones.

- [ ] **Step 2: Run + commit**

```bash
pnpm test src/__tests__/middleware/middleware.test.ts   # expect PASS
git add src/__tests__/middleware/middleware.test.ts
git commit -m "test(middleware): cover bypass redirect, login redirect, and HSTS headers"
```

---

## Part D — `queryOptions` adoption

**Why:** Prefetch helpers re-declare `queryKey`+`queryFn` that the hooks also declare, so server/client definitions can drift. v5's `queryOptions()` is the single source. Adopt it for the **list/detail** queries first (applications, users, departments); leave mutations as-is.

### Task D1: applications list/detail `queryOptions`

**Files:**
- Modify: `src/features/applications/query-keys.ts` (add option factories) — or create `src/features/applications/query-options.ts` if you prefer separation; the plan uses `query-keys.ts`.
- Modify: `src/features/applications/use-applications.ts` (consume options), `src/features/applications/prefetch.ts` (consume the same options).
- Read-only: `src/actions/applications.ts`, `src/actions/types.ts` (`unwrap`).

**Interfaces:**
- Produces: `applicationsListOptions(filters?)`, `applicationByCodeOptions(code)` returning `queryOptions({...})` objects, consumed by both `useQuery(...)` and `client.fetchQuery(...)`.

- [ ] **Step 1: Add the option factories**

```ts
// src/features/applications/query-keys.ts (append)
import { queryOptions } from "@tanstack/react-query";

import { getApplicationByCode, getApplications } from "@/actions/applications";
import { unwrap } from "@/actions/types";

export const applicationsListOptions = (filters?: ApplicationFilters) =>
  queryOptions({
    queryKey: applicationsKeys.list(filters),
    queryFn: async () => unwrap(await getApplications(filters)),
  });

export const applicationByCodeOptions = (code: string) =>
  queryOptions({
    queryKey: applicationsKeys.detail(code),
    queryFn: async () => unwrap(await getApplicationByCode(code)),
    enabled: !!code,
  });
```

> Confirm the real action names/params via `grep -n "export.*function" src/actions/applications.ts`. If `query-keys.ts` must stay server-import-free (it currently has no action imports), instead create `src/features/applications/query-options.ts` for the factories and import keys from `query-keys.ts`. Pick whichever keeps imports clean; note the choice in the commit.

- [ ] **Step 2: Consume in the hook and prefetch**

In `use-applications.ts`, replace the inline list/detail `useQuery({ queryKey, queryFn })` with `useQuery(applicationsListOptions(filters))` / `useQuery(applicationByCodeOptions(code))` (spread extra per-call opts like `initialData` after: `useQuery({ ...applicationsListOptions(filters), initialData })`).
In `prefetch.ts`, replace the inline `fetchQuery({ queryKey, queryFn })` with `fetchQuery(applicationsListOptions(filters))` etc.

- [ ] **Step 3: Verify (refactor — behavior must not change)**

```bash
pnpm test src/__tests__/applications        # existing app tests still green
npx tsc --noEmit 2>&1 | grep -i applications || echo "no new app type errors"
```
Expected: no new failures; the query-keys test (`src/__tests__/applications/query-keys.test.ts`) still passes (key shapes unchanged).

- [ ] **Step 4: Commit**

```bash
git add src/features/applications/
git commit -m "refactor(applications): share queryOptions between hooks and prefetch"
```

### Task D2: users + departments `queryOptions`

**Files:**
- Modify: `src/features/users/query-keys.ts`, `use-users.ts`, `prefetch.ts`; `src/features/departments/query-keys.ts`, `use-departments.ts`, `prefetch.ts`.

- [ ] **Steps:** Mirror D1 for the user detail/list and current-user queries, and the department list/detail queries. Verify each feature's existing tests + `tsc`. Commit per feature:

```bash
git add src/features/users/ && git commit -m "refactor(users): share queryOptions between hooks and prefetch"
git add src/features/departments/ && git commit -m "refactor(departments): share queryOptions between hooks and prefetch"
```

---

## Part E — Shared `SelectableDataTable`

**Why:** `user-role-dialog.tsx` and `role-permissions-dialog.tsx` carry ~150 lines of near-identical hand-rolled table + pagination + per-page select. Extract one component to dedupe.

### Task E1: Extract the component

**Files:**
- Create: `src/components/data-table/selectable-data-table.tsx`
- Read-only first: both dialogs to capture the exact markup/props they need.

**Interfaces:**
- Produces:
```ts
export interface SelectableDataTableProps<TData> {
  table: import("@tanstack/react-table").Table<TData>;
  columnCount: number;
  emptyMessage?: string;          // default "Sem resultados!"
  rowsPerPageLabel?: string;      // default "Linhas por página"
  pageSizes?: number[];           // default [5, 10]
}
export function SelectableDataTable<TData>(props: SelectableDataTableProps<TData>): JSX.Element;
```

- [ ] **Step 1: Write the component**

Build it from the **existing** markup in `role-permissions-dialog.tsx` (the more complete one): the `<Table>` header/body/empty-row block, the per-page `Select`, the `aria-live` range counter (`{start}-{end} de {total}`), and the `Pagination` first/prev/next/last buttons with their `aria-label`s. Import `Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Select*, Pagination*, Button, IGRPIcon, Label` from the design system and `flexRender` from `@tanstack/react-table`. Use `useId()` for the per-page `<Label htmlFor>`/`<SelectTrigger id>`. Keep all copy in pt-PT. No raw colors, no `space-*`.

- [ ] **Step 2: Swap both dialogs to use it**

In `user-role-dialog.tsx` and `role-permissions-dialog.tsx`, delete the inline table+pagination JSX and render `<SelectableDataTable table={table} columnCount={columns.length} />` (pass `rowsPerPageLabel="Registos por página"` in the permissions dialog to preserve its wording). Keep the search input and the selection footer (`N selecionado(s)` + actions) in each dialog — only the table+pagination is shared.

- [ ] **Step 3: Verify**

```bash
pnpm test src/__tests__/users/components/user-role-dialog.test.tsx  # if it resolves; else skip per baseline
npx tsc --noEmit 2>&1 | grep -iE "selectable|role-dialog|permissions-dialog" || echo "clean"
node scripts/check-ui-rules.mjs   # no NEW violations
```
**Manual run required:** `pnpm dev`, open a department → role → permissions dialog and a user → roles dialog; confirm selection, pagination, per-page select, and the count text all work.

- [ ] **Step 4: Commit**

```bash
git add src/components/data-table/ src/features/users/components/user-role-dialog.tsx src/features/roles/components/role-permissions-dialog.tsx
git commit -m "refactor(table): extract shared SelectableDataTable from the two selection dialogs"
```

---

## Part F — `departments/Modal` derived-state fix

**Why:** `manage-menus-modal.tsx` and `manage-apps-modal.tsx` accumulate "seen" items in a `ref` inside an effect (derived data smuggled through a ref) and run two competing open-time effects that race to set the initial selection.

### Task F1: Replace ref-accumulation with memoized derivation; pick one source for default selection

**Files:**
- Modify: `src/features/departments/components/Modal/manage-menus-modal.tsx`, `manage-apps-modal.tsx`
- Read-only first: both files in full to map the `seen*Ref` usage and the two open-time effects.

- [ ] **Step 1: Derive the label map**

Replace `seenMenusRef`/`seenAppsRef` (populated in an effect) with a `useMemo` that merges the current query data into a stable label map keyed by code, computed from the query data directly. If labels must persist across refetches, derive from `[...previousData, ...currentData]` via a single `useMemo` keyed on the query data — not a ref mutated in an effect.

- [ ] **Step 2: Single default-selection source**

Delete the second open-time effect that also sets the initial selected app. Keep one effect (or derive) that sets the default once when the modal opens and data is present; guard on `open` + data length, not on the two racing sources.

- [ ] **Step 3: Verify**

```bash
npx tsc --noEmit 2>&1 | grep -i "manage-" || echo "clean"
node scripts/check-ui-rules.mjs
```
**Manual run required:** open both modals from a department, switch apps, save, reopen — confirm labels stay correct and the default selection is stable (no flicker/race).

- [ ] **Step 4: Commit**

```bash
git add src/features/departments/components/Modal/
git commit -m "refactor(departments): derive modal label map and fix racing default-selection effects"
```

---

## Part G — God-component refactor (extract hooks; no file-per-component split)

**Why:** `app-list-home.tsx` (962L) and `dept-menu.tsx` (620L) concentrate state + persistence + derivations. Per the chosen approach, extract reusable hooks and small presentational sub-components **in place**, keeping behavior identical. (`user-role-dialog.tsx` is already slimmed via Part E + the earlier effect consolidation.)

### Task G1: `useLocalStorageState` hook + adopt in `app-list-home`

**Files:**
- Create: `src/lib/hooks/use-local-storage-state.ts`
- Test: `src/__tests__/lib/use-local-storage-state.test.ts`
- Modify: `src/features/applications/components/app-list-home.tsx` (replace the 3 localStorage effects)

**Interfaces:**
- Produces: `export function useLocalStorageState<T>(key: string, initial: T): [T, (next: T | ((prev: T) => T)) => void]` — SSR-safe (reads `localStorage` lazily on mount, writes on change, no read during render on the server).

- [ ] **Step 1: Write the failing test**

```ts
// src/__tests__/lib/use-local-storage-state.test.ts
import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { useLocalStorageState } from "@/lib/hooks/use-local-storage-state";

beforeEach(() => localStorage.clear());

describe("useLocalStorageState", () => {
  it("returns the initial value when nothing is stored", () => {
    const { result } = renderHook(() => useLocalStorageState("k", "init"));
    expect(result.current[0]).toBe("init");
  });

  it("persists and rehydrates the value", () => {
    const { result, unmount } = renderHook(() =>
      useLocalStorageState("k", "init"),
    );
    act(() => result.current[1]("next"));
    expect(JSON.parse(localStorage.getItem("k") as string)).toBe("next");
    unmount();
    const again = renderHook(() => useLocalStorageState("k", "init"));
    expect(again.result.current[0]).toBe("next");
  });

  it("supports updater functions", () => {
    const { result } = renderHook(() => useLocalStorageState("n", 1));
    act(() => result.current[1]((p) => p + 1));
    expect(result.current[0]).toBe(2);
  });
});
```

- [ ] **Step 2: Run (red)** — `pnpm test src/__tests__/lib/use-local-storage-state.test.ts` → FAIL (module missing).

- [ ] **Step 3: Implement**

```ts
// src/lib/hooks/use-local-storage-state.ts
"use client";

import { useCallback, useEffect, useState } from "react";

export function useLocalStorageState<T>(
  key: string,
  initial: T,
): [T, (next: T | ((prev: T) => T)) => void] {
  const [value, setValue] = useState<T>(initial);

  // Read once on mount (client only) — never during SSR render.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw !== null) setValue(JSON.parse(raw) as T);
    } catch {
      /* ignore malformed/unavailable storage */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const set = useCallback(
    (next: T | ((prev: T) => T)) => {
      setValue((prev) => {
        const resolved =
          typeof next === "function" ? (next as (p: T) => T)(prev) : next;
        try {
          window.localStorage.setItem(key, JSON.stringify(resolved));
        } catch {
          /* ignore */
        }
        return resolved;
      });
    },
    [key],
  );

  return [value, set];
}
```

> Biome may flag the `exhaustive-deps` comment style — if so, use Biome's `// biome-ignore lint/correctness/useExhaustiveDependencies: read-once-on-mount` instead, matching the repo's existing ignore comments.

- [ ] **Step 4: Run (green)** — `pnpm test src/__tests__/lib/use-local-storage-state.test.ts` → PASS.

- [ ] **Step 5: Adopt in `app-list-home.tsx`**

Replace each `useState` + persistence `useEffect` pair (filters, collapse state — the 3 flagged effects) with `const [x, setX] = useLocalStorageState("<existing-key>", <default>)`. Use the **exact same localStorage keys** already in use so existing users keep their state. Delete the now-dead effects.

- [ ] **Step 6: Verify**

```bash
npx tsc --noEmit 2>&1 | grep -i app-list-home || echo "clean"
node scripts/check-ui-rules.mjs
```
**Manual run required:** `pnpm dev`, toggle filters/collapse on the home app list, reload — state must persist as before.

- [ ] **Step 7: Commit**

```bash
git add src/lib/hooks/use-local-storage-state.ts src/__tests__/lib/use-local-storage-state.test.ts src/features/applications/components/app-list-home.tsx
git commit -m "refactor(applications): extract useLocalStorageState and replace persistence effects"
```

### Task G2: `useMenuRoleAssignments` hook + adopt in `dept-menu`

**Files:**
- Create: `src/features/departments/use-menu-role-assignments.ts`
- Modify: `src/features/departments/components/dept-menu.tsx`

**Interfaces:**
- Produces:
```ts
export function useMenuRoleAssignments(args: {
  menus: MenuEntryDTO[] | undefined;
  roles: { code: string }[] | undefined;
  filteredMenus: { code: string }[];
  selectedApp: string;
}): {
  assignments: Map<string, Set<string>>;
  hasChanges: boolean;
  columnCheckState: Map<string, boolean | "indeterminate">;
  toggleMenuRole: (menuCode: string, roleCode: string) => void;
  toggleAllMenusForRole: (roleCode: string) => void;
  reset: () => void;
  diffForSave: () => { menuCode: string; toAdd: string[]; toRemove: string[] }[];
};
```

- [ ] **Step 1: Move the state + derivations into the hook**

Lift `menuRoleAssignments` state, the init effect (keyed on `selectedApp` rather than the fragile `size === 0` guard — reset assignments when `selectedApp` changes, then seed from `menus`), the memoized `columnCheckState` map, `hasChanges` (memoized), `toggleAllMenusForRole`, and the per-cell toggle into `useMenuRoleAssignments`. Re-seed via an effect keyed on `[selectedApp, menus]` that rebuilds the Map from `menus[].roles` (replacing the `size === 0` guard). Expose `diffForSave()` returning the add/remove lists currently computed inline in `handleSave`.

- [ ] **Step 2: Adopt in `dept-menu.tsx`**

Replace the lifted code with `const { assignments, hasChanges, columnCheckState, toggleAllMenusForRole, reset, diffForSave } = useMenuRoleAssignments({ menus, roles, filteredMenus, selectedApp })`. `handleSave` consumes `diffForSave()`; `handleDiscardAndSwitch` calls `reset()`. Keep `getColumnCheckState(roleCode)` as `columnCheckState.get(roleCode) ?? false`.

- [ ] **Step 3: Verify**

```bash
npx tsc --noEmit 2>&1 | grep -iE "dept-menu|menu-role" || echo "clean"
node scripts/check-ui-rules.mjs
```
**Manual run required:** open a department's Menus tab, toggle roles per-menu and per-column, switch apps (discard + save-and-switch), save — diff must match prior behavior; no stale assignments after app switch.

- [ ] **Step 4: Commit**

```bash
git add src/features/departments/use-menu-role-assignments.ts src/features/departments/components/dept-menu.tsx
git commit -m "refactor(departments): extract useMenuRoleAssignments; fix size===0 init guard"
```

---

## Part H — Content-Security-Policy (Report-Only first)

**Why:** `middleware.ts` already has HSTS + the other headers and a `TODO` for CSP. Ship CSP in **Report-Only** so violations are logged without breaking the app; flip to enforcing later.

### Task H1: Add a Report-Only CSP in production

**Files:**
- Modify: `src/middleware.ts`
- Test: extend `src/__tests__/middleware/middleware.test.ts`

- [ ] **Step 1: Add the header**

In `src/middleware.ts`, add to `SECURITY_HEADERS`:
```ts
  // Report-Only first: log violations without blocking. Tighten and switch to
  // "Content-Security-Policy" (enforcing) once the report stream is clean.
  "Content-Security-Policy-Report-Only": [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    "connect-src 'self'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
  ].join("; "),
```
Remove the now-superseded part of the `TODO` comment but keep a one-line note that the goal is to graduate Report-Only → enforcing. (Next 15 / Turbopack inject inline styles/scripts, hence `'unsafe-inline'` for style/script in this first pass; tightening with nonces is a follow-up.)

- [ ] **Step 2: Extend the middleware test**

Add to the "security headers (production)" describe block:
```ts
  it("ships a Report-Only CSP in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    auth.getTokenFromRequest.mockResolvedValue({ sub: "u1" });
    const res = await middleware(req("/settings/users"));
    expect(res.headers.get("Content-Security-Policy-Report-Only")).toContain(
      "default-src 'self'",
    );
    expect(res.headers.get("Content-Security-Policy")).toBeNull();
    vi.unstubAllEnvs();
  });
```

- [ ] **Step 3: Verify + commit**

```bash
pnpm test src/__tests__/middleware/middleware.test.ts   # PASS
git add src/middleware.ts src/__tests__/middleware/middleware.test.ts
git commit -m "feat(security): add Report-Only CSP in production"
```
**Follow-up (not this plan):** after observing reports, remove `'unsafe-inline'` (use nonces) and rename the header to `Content-Security-Policy`.

---

## Part I — Convention drift

**Why:** Small consistency fixes. Each is independent; do only the ones the team agrees on (the `use-<domain>` "gap" may be intentional — see I1).

### Task I1: Document or fill the missing `use-<domain>` hooks

**Files:**
- Modify: `AGENTS.md` (the Feature modules section)

- [ ] **Step 1:** `menus`/`permissions`/`profile`/`settings` have no `use-<domain>.ts`. These are intentional (their data flows through `departments`/`applications` hooks, or they're component-only). Rather than add empty hooks (YAGNI), add one sentence to the AGENTS.md "Feature modules" list noting these domains are component-only / share another domain's hooks by design.

- [ ] **Step 2: Commit** — `git add AGENTS.md && git commit -m "docs: note component-only feature modules"`

### Task I2: Unify schema filenames to `<domain>-schemas.ts`

**Files:**
- Rename: `user-schema.ts`, `files-schema.ts`, `permissions-schemas.ts`, `app-schemas.ts`, `dept-schemas.ts` → consistent `<domain>-schemas.ts` (e.g. `user-schemas.ts`).
- Modify: every importer of the renamed files.

- [ ] **Step 1:** For each file, `git mv` to the canonical name, then update imports. Find importers with `grep -rn "<old-name>" src`. Because there is no path-alias indirection, this is a mechanical find-replace per file.
- [ ] **Step 2: Verify** — `npx tsc --noEmit` shows no new "cannot find module" errors.
- [ ] **Step 3: Commit** — `git add -A && git commit -m "refactor: unify *-schemas.ts filenames"`

> On Windows, case-only renames need `git mv -f oldName tempName && git mv -f tempName newName`. These renames are pure churn — confirm the team wants them before doing I2.

### Task I3: Rename `departments/components/Modal/` → `modal/`

**Files:**
- Rename dir; update the import in `dept-menu.tsx` (`./Modal/manage-menus-modal`) and any sibling importers.

- [ ] **Step 1:** `git mv src/features/departments/components/Modal src/features/departments/components/modal-tmp && git mv src/features/departments/components/modal-tmp src/features/departments/components/modal` (two-step for Windows case-insensitivity). Update imports (`grep -rn "components/Modal" src`).
- [ ] **Step 2: Verify + commit** — `npx tsc --noEmit` clean; `git add -A && git commit -m "refactor(departments): rename Modal dir to kebab-case modal"`.

### Task I4: React 19 idioms (optional, highest-churn)

**Files:**
- Modify: the invite/OTP flow components and the favorite toggle.

- [ ] **Step 1:** Convert the invite-OTP submit flow to `useActionState` + form `action` (built-in pending state) and the favorite toggle to `useOptimistic`. This is an enhancement, not a fix — do it last and only if the earlier Parts are merged and verified. Each conversion: write/adjust the component test first (assert pending disables the control, optimistic value shows immediately), then refactor, then verify with a manual run. Commit per component.

---

## Final verification (after each Part, and once at the end)

- [ ] `npx tsc --noEmit` — no errors beyond the documented baseline (`__tests__/users/*` import-crash files).
- [ ] `pnpm test` — no NEW failures beyond the baseline crashers; run targeted dirs if the full suite is flaky (`pnpm test src/__tests__/lib src/__tests__/actions src/__tests__/middleware`).
- [ ] `node scripts/check-ui-rules.mjs` — strict count not increased (the 3 vendored-primitive `dark:` false-positives in `src/components/ui/{badge,button}.tsx` are pre-existing; do not regress beyond them).
- [ ] `npx biome check <changed files>` — clean.
- [ ] For every Part touching UI (E, F, G, H): a manual `pnpm dev` smoke of the affected screen, since these refactors aren't covered by behavioral tests.

## Self-review notes (gaps to watch during execution)

- Action tests (Part B) depend on the **exact** SDK accessor/method names — always do the `grep` step first; the mock shape, not the assertion, is what you adjust.
- `verifySession` `cache()` memoization can bleed across test cases (Part A2) — split files or `vi.resetModules()` if so.
- queryOptions factories (Part D) must keep key shapes **byte-identical** to the current factories or SSR hydration silently breaks; the existing `query-keys.test.ts` is the guard.
- The god-component hook extractions (Part G) have no behavioral tests for the host components — the manual smoke run is mandatory, not optional.
