# Departments Best-Practices Sweep (PR 1) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship four focused improvements to `/settings/departments` — a Drawer/Sheet/aside responsive sidebar, a segment-level `error.tsx`, deferred search filtering, and `content-visibility` on tree rows — without changing the visual design.

**Architecture:** Extract the sidebar's inner content into a presentational `DepartmentSidebarContent` component, then wrap it in a thin responsive shell that picks `<Drawer>` below `sm`, `<Sheet>` between `sm` and `lg`, or a static `<aside>` at `lg+`. Wire `useDeferredValue` at the orchestrator so the input stays responsive while the tree filter catches up. Add `content-visibility: auto` to tree rows so off-screen subtrees skip layout/paint. Add a client-side `error.tsx` boundary with retry and structured logging via the existing `reportError` helper.

**Tech Stack:** Next.js 15 (App Router, `error.tsx` boundary), React 19 (`useDeferredValue`), TanStack Query 5, `@igrp/igrp-framework-react-design-system` (`Drawer`, `Sheet`, `Button`, `IGRPIcon`), Vitest + React Testing Library, Biome.

**Conventions observed in this repo:**
- Tests under `src/__tests__/<feature>/...` (Vitest + RTL). Path alias `@/` → `src/`.
- Commit style: `feat:`, `fix:`, `refactor:`, `test:`, `chore:`, `docs:`.
- `reportError(error, { segment: "<id>" })` for error logging (see `src/lib/report-error.ts`).
- Mobile-first responsive: Tailwind `sm`/`md`/`lg` breakpoints. Current sidebar flips at `lg` (≥1024px).
- Lint via `pnpm lint`. Typecheck via `pnpm exec tsc --noEmit`. Tests via `pnpm test`.
- **Do NOT run `pnpm lint` against the whole repo** — Biome auto-fix has caused repo-wide import reordering in past tasks. If you need to lint a single file, scope it: `pnpm exec biome check src/path/file.tsx`.

**Spec:** [docs/superpowers/specs/2026-05-26-departments-best-practices-sweep-design.md](../specs/2026-05-26-departments-best-practices-sweep-design.md)

---

## File Structure

**Create:**
- `src/features/departments/components/dept-sidebar-content.tsx` — extracted presentational sidebar inner content (header + search + tree list + empty state).
- `src/app/(igrp)/(home)/settings/departments/error.tsx` — segment-level client error boundary.
- `src/__tests__/departments/error.test.tsx` — Vitest + RTL tests for the error boundary.

**Modify:**
- `src/features/departments/components/dept-sidebar.tsx` — becomes a thin responsive shell wrapping `<DepartmentSidebarContent>` in `Drawer | Sheet | aside`.
- `src/features/departments/components/dept-list-tree.tsx` — adds `useDeferredValue(searchTerm)`, derives `isFiltering`, threads both through `<DepartmentSidebar>`.
- `src/features/departments/components/dept-tree-item.tsx` — outer row wrapper gets `content-visibility: auto` + `contain-intrinsic-size`.

**Delete:** none.

---

## Task 1: Extract `DepartmentSidebarContent` (with `isFiltering` plumbing, not yet wired)

**Why:** Decouple the presentational sidebar contents from the responsive container so Drawer, Sheet, and aside can all reuse the same body. Add the `isFiltering` prop and its visual hint markup now so Task 3 only has to flip a boolean.

**Files:**
- Create: `src/features/departments/components/dept-sidebar-content.tsx`
- Modify: `src/features/departments/components/dept-sidebar.tsx`

- [ ] **Step 1: Create the content component**

Create `src/features/departments/components/dept-sidebar-content.tsx`:

```tsx
"use client";

import {
  IGRPIcon,
  Input,
  TooltipProvider,
} from "@igrp/igrp-framework-react-design-system";
import { ButtonLink } from "@/components/button-link";
import type { DepartmentWithChildren } from "../dept-tree-utils";
import { DepartmentEmptyState } from "./dept-empty-state";
import DepartmentTreeItem from "./dept-tree-item";

interface Props {
  filtered: DepartmentWithChildren[];
  searchTerm: string;
  onSearchChange(value: string): void;
  onCreate(): void;
  isFiltering: boolean;
}

export function DepartmentSidebarContent({
  filtered,
  searchTerm,
  onSearchChange,
  onCreate,
  isFiltering,
}: Props) {
  return (
    <div className="flex flex-col h-full min-w-0">
      <div className="flex flex-col min-w-0">
        <h2 className="text-xl font-bold tracking-tight truncate">
          Gestão de Departamentos
        </h2>
        <p className="text-muted-foreground text-sm mb-4">
          Ver e gerir todos os departamentos do sistema.
        </p>
        <ButtonLink
          onClick={onCreate}
          icon="Plus"
          href="#"
          label="Novo Departamento"
        />
      </div>

      <div className="mt-4">
        <div className="relative">
          <IGRPIcon
            iconName="Search"
            className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground"
          />
          <Input
            type="text"
            placeholder="Pesquisar departamento..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-background pl-8 pr-8"
          />
          {isFiltering && (
            <IGRPIcon
              iconName="LoaderCircle"
              className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground animate-spin"
              aria-label="A filtrar"
            />
          )}
        </div>
      </div>

      <div
        className={`flex-1 mt-3 overflow-y-auto min-h-[200px] transition-opacity ${
          isFiltering ? "opacity-70" : "opacity-100"
        }`}
      >
        <TooltipProvider delayDuration={350}>
          {filtered.length === 0 ? (
            <DepartmentEmptyState
              variant={searchTerm ? "sidebar-no-results" : "sidebar-empty"}
            />
          ) : (
            filtered.map((dept) => (
              <DepartmentTreeItem key={dept.code} dept={dept} />
            ))
          )}
        </TooltipProvider>
      </div>
    </div>
  );
}
```

If `IGRPIcon` does not ship `LoaderCircle`, substitute the closest spinner icon name (`Loader2`, `Loader`, etc.) and note the substitution in the commit body.

- [ ] **Step 2: Refactor `DepartmentSidebar` to use the content component (no behavior change yet)**

Replace `src/features/departments/components/dept-sidebar.tsx` with:

```tsx
"use client";

import {
  Button,
  IGRPIcon,
} from "@igrp/igrp-framework-react-design-system";
import type { DepartmentWithChildren } from "../dept-tree-utils";
import { DepartmentSidebarContent } from "./dept-sidebar-content";

interface Props {
  filtered: DepartmentWithChildren[];
  searchTerm: string;
  onSearchChange(value: string): void;
  onCreate(): void;
  isOpen: boolean;
  onOpenChange(open: boolean): void;
  isFiltering: boolean;
}

export function DepartmentSidebar({
  filtered,
  searchTerm,
  onSearchChange,
  onCreate,
  isOpen,
  onOpenChange,
  isFiltering,
}: Props) {
  const contentProps = {
    filtered,
    searchTerm,
    onSearchChange,
    onCreate,
    isFiltering,
  };

  return (
    <>
      <div className="block lg:hidden mb-4">
        <Button
          onClick={() => onOpenChange(!isOpen)}
          variant="outline"
          className="w-full"
        >
          <IGRPIcon
            iconName={isOpen ? "X" : "Menu"}
            className="w-4 h-4"
            strokeWidth={2}
          />
          {isOpen ? "Fechar" : "Departamentos"}
        </Button>
      </div>

      <aside
        className={`${isOpen ? "block" : "hidden"} lg:block
          fixed lg:relative inset-0 lg:inset-auto
          z-50 lg:z-auto
          w-full lg:w-80
          bg-background
          overflow-y-auto
          border-accent
          p-4 lg:p-0 lg:pr-2`}
      >
        <div className="flex lg:hidden justify-end mb-2">
          <Button
            onClick={() => onOpenChange(false)}
            variant="ghost"
            size="sm"
          >
            <IGRPIcon iconName="X" className="w-5 h-5" strokeWidth={2} />
          </Button>
        </div>
        <DepartmentSidebarContent {...contentProps} />
      </aside>

      {isOpen && (
        <button
          type="button"
          aria-label="Fechar menu de departamentos"
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => onOpenChange(false)}
        />
      )}
    </>
  );
}
```

This is an intermediate state — the responsive shell still uses the old hand-rolled overlay. Task 3 replaces it.

- [ ] **Step 3: Update the orchestrator to pass `isFiltering={false}`**

In `src/features/departments/components/dept-list-tree.tsx`, find the `<DepartmentSidebar ... />` call site and add the new prop (the prop type now requires it):

```tsx
<DepartmentSidebar
  filtered={filtered}
  searchTerm={searchTerm}
  onSearchChange={setSearchTerm}
  onCreate={() => dispatch({ type: "openCreate" })}
  isOpen={isSidebarOpen}
  onOpenChange={setIsSidebarOpen}
  isFiltering={false}
/>
```

Just add the `isFiltering={false}` line. Task 2 makes it dynamic.

- [ ] **Step 4: Typecheck**

Run: `pnpm exec tsc --noEmit`
Expected: no new errors in `src/features/departments/`. Pre-existing errors in `src/__tests__/users/components/user-metadata-panel.test.tsx` and `src/app/(auth)/login/page.tsx` are unrelated and OK.

- [ ] **Step 5: Commit**

```bash
git add src/features/departments/components/dept-sidebar-content.tsx src/features/departments/components/dept-sidebar.tsx src/features/departments/components/dept-list-tree.tsx
git commit -m "refactor(departments): extract DepartmentSidebarContent and prop-thread isFiltering"
```

---

## Task 2: Wire `useDeferredValue` for non-blocking search filter (R7)

**Why:** Typing in the search box currently runs `filterTree` synchronously on every keystroke. With many departments this can stall input. `useDeferredValue` lets React keep the input responsive while it catches up on the filter.

**Files:**
- Modify: `src/features/departments/components/dept-list-tree.tsx`

- [ ] **Step 1: Add `useDeferredValue` and `isFiltering` derivation**

In `src/features/departments/components/dept-list-tree.tsx`:

1. Add `useDeferredValue` to the React import (it sits next to `useCallback`, `useMemo`, etc.):

```tsx
import {
  useCallback,
  useDeferredValue,
  useMemo,
  useReducer,
  useState,
} from "react";
```

2. Just after the `useState` block (right before the `useReducer` call or alongside it), wire the deferred value and derive `isFiltering`:

```tsx
const [searchTerm, setSearchTerm] = useState("");
// ...other useState calls...

const deferredSearchTerm = useDeferredValue(searchTerm);
const isFiltering = searchTerm !== deferredSearchTerm;
```

3. Change the `useDepartmentTree` call to use the deferred value:

```tsx
// before
const { filtered } = useDepartmentTree(departments, searchTerm);
// after
const { filtered } = useDepartmentTree(departments, deferredSearchTerm);
```

4. Flip the `isFiltering` prop on `<DepartmentSidebar>`:

```tsx
// before
isFiltering={false}
// after
isFiltering={isFiltering}
```

- [ ] **Step 2: Typecheck**

Run: `pnpm exec tsc --noEmit`
Expected: no new errors.

- [ ] **Step 3: Manual smoke**

Start `pnpm dev` and visit `/settings/departments`. Type a multi-character query rapidly into the search box. You should see:
- The input character feedback is immediate.
- The tree list briefly dips to ~70% opacity while filtering.
- A spinner appears next to the search input while filtering.

- [ ] **Step 4: Commit**

```bash
git add src/features/departments/components/dept-list-tree.tsx
git commit -m "perf(departments): defer search filter with useDeferredValue"
```

---

## Task 3: Replace the hand-rolled mobile sidebar with `Drawer` / `Sheet` / `aside` (S1)

**Why:** The current sidebar relies on hand-rolled `z-50` overlays, an `<aside>` toggled by class names, and a backdrop `<button>` for clicks. This bypasses focus trapping, Escape-key handling, and scroll locking. The IGRP design system already ships `Drawer` (vaul-based, bottom sheet) and `Sheet` (Radix-based, side panel) that handle all of this.

**Files:**
- Modify: `src/features/departments/components/dept-sidebar.tsx`

- [ ] **Step 1: Replace the sidebar with the responsive shell**

Replace the entire contents of `src/features/departments/components/dept-sidebar.tsx` with:

```tsx
"use client";

import {
  Button,
  Drawer,
  DrawerContent,
  DrawerTitle,
  IGRPIcon,
  Sheet,
  SheetContent,
  SheetTitle,
} from "@igrp/igrp-framework-react-design-system";
import type { DepartmentWithChildren } from "../dept-tree-utils";
import { DepartmentSidebarContent } from "./dept-sidebar-content";

interface Props {
  filtered: DepartmentWithChildren[];
  searchTerm: string;
  onSearchChange(value: string): void;
  onCreate(): void;
  isOpen: boolean;
  onOpenChange(open: boolean): void;
  isFiltering: boolean;
}

export function DepartmentSidebar({
  filtered,
  searchTerm,
  onSearchChange,
  onCreate,
  isOpen,
  onOpenChange,
  isFiltering,
}: Props) {
  const contentProps = {
    filtered,
    searchTerm,
    onSearchChange,
    onCreate,
    isFiltering,
  };

  return (
    <>
      {/* Hamburger trigger — visible only below lg */}
      <div className="block lg:hidden mb-4">
        <Button
          onClick={() => onOpenChange(true)}
          variant="outline"
          className="w-full"
          aria-label="Abrir lista de departamentos"
        >
          <IGRPIcon iconName="Menu" className="w-4 h-4" strokeWidth={2} />
          Departamentos
        </Button>
      </div>

      {/* < sm: Drawer (bottom sheet) */}
      <div className="sm:hidden">
        <Drawer open={isOpen} onOpenChange={onOpenChange}>
          <DrawerContent className="max-h-[90vh] p-4">
            <DrawerTitle className="sr-only">Departamentos</DrawerTitle>
            <DepartmentSidebarContent {...contentProps} />
          </DrawerContent>
        </Drawer>
      </div>

      {/* sm – lg: Sheet (left side) */}
      <div className="hidden sm:block lg:hidden">
        <Sheet open={isOpen} onOpenChange={onOpenChange}>
          <SheetContent side="left" className="w-80 p-4">
            <SheetTitle className="sr-only">Departamentos</SheetTitle>
            <DepartmentSidebarContent {...contentProps} />
          </SheetContent>
        </Sheet>
      </div>

      {/* lg+: static aside */}
      <aside className="hidden lg:flex lg:flex-col w-80 pr-2 border-accent overflow-y-auto">
        <DepartmentSidebarContent {...contentProps} />
      </aside>
    </>
  );
}
```

Notes:
- The Tailwind responsive wrappers (`sm:hidden`, `hidden sm:block lg:hidden`, `hidden lg:flex`) gate which container renders into the DOM at each breakpoint. `Drawer`/`Sheet` don't render their content portals while closed, so DOM cost when closed is just the wrapper.
- `DrawerTitle` and `SheetTitle` use `sr-only` to satisfy the design-system accessibility requirement without changing the visible UI.
- No more `z-40`/`z-50`/`fixed inset-0` overlay markup; the DS owns stacking.
- Selecting a department already closes the sidebar — the orchestrator's `select` callback calls `setIsSidebarOpen(false)`. No change needed there.

If `Drawer` or `Sheet` is not exported from `@igrp/igrp-framework-react-design-system` (verify via `grep -E "^export.*\b(Drawer|Sheet)\b" node_modules/@igrp/igrp-framework-react-design-system/dist/index.d.ts`), stop and report BLOCKED — the spec assumed both are available.

- [ ] **Step 2: Typecheck**

Run: `pnpm exec tsc --noEmit`
Expected: no new errors in `src/features/departments/`.

- [ ] **Step 3: Manual smoke (all three breakpoints)**

Run `pnpm dev` and open DevTools responsive mode. Verify:

- **<640px (e.g., iPhone SE preset):** hamburger button visible. Click it → `Drawer` slides up from the bottom. Selecting a department closes the drawer. Pressing `Escape` closes it. Drag-down handle (if visible) closes it.
- **640–1023px (e.g., iPad Mini preset):** hamburger visible. Click it → `Sheet` slides in from the left. Tab cycles focus inside the sheet. `Escape` closes it. Selecting closes it.
- **≥1024px (desktop):** no hamburger. `<aside>` is always visible.

- [ ] **Step 4: Commit**

```bash
git add src/features/departments/components/dept-sidebar.tsx
git commit -m "refactor(departments): adopt Drawer/Sheet/aside responsive sidebar"
```

---

## Task 4: `content-visibility: auto` on tree row wrappers (R5)

**Why:** Tree rows are recursive and can be hundreds deep for large orgs. `content-visibility: auto` lets the browser skip layout/paint for off-screen subtrees. `contain-intrinsic-size` reserves vertical space so the scrollbar doesn't jump.

**Files:**
- Modify: `src/features/departments/components/dept-tree-item.tsx`

- [ ] **Step 1: Add the style to the row wrapper**

Open `src/features/departments/components/dept-tree-item.tsx`. The component returns `<div>...</div>` as its outermost element. Change the outer `<div>` to:

```tsx
<div style={{ contentVisibility: "auto", containIntrinsicSize: "40px" }}>
```

If TypeScript flags `contentVisibility` as an unknown CSS property (depends on the `@types/react` version), wrap the style object: `style={{ contentVisibility: "auto", containIntrinsicSize: "40px" } as React.CSSProperties}`.

`40px` matches the row's effective height (`py-2.5` of padding plus the row content). Don't tune this — the browser falls back gracefully if the actual height differs.

- [ ] **Step 2: Typecheck**

Run: `pnpm exec tsc --noEmit`
Expected: no new errors.

- [ ] **Step 3: Manual smoke**

Run `pnpm dev` and open `/settings/departments`. With the existing data, the visual result should be identical. With DevTools Performance panel recording while scrolling, off-screen tree rows should show as skipped (no paint, no layout). Keyboard `Tab` should still reach off-screen rows.

- [ ] **Step 4: Commit**

```bash
git add src/features/departments/components/dept-tree-item.tsx
git commit -m "perf(departments): apply content-visibility to tree rows"
```

---

## Task 5: Segment-level `error.tsx` with tests (N1)

**Why:** If `getDepartments()` returns `success: false`, `page.tsx`'s prefetch throws. Without a segment-level error boundary, the user sees whatever the closest ancestor boundary provides — likely a generic error page. A focused `error.tsx` gives friendly Portuguese copy, a retry button, and structured logging via `reportError`.

**Files:**
- Create: `src/__tests__/departments/error.test.tsx`
- Create: `src/app/(igrp)/(home)/settings/departments/error.tsx`

- [ ] **Step 1: Write the failing tests**

Create `src/__tests__/departments/error.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/lib/report-error", () => ({
  reportError: vi.fn(),
}));

import { reportError } from "@/lib/report-error";
import DepartmentsError from "@/app/(igrp)/(home)/settings/departments/error";

describe("DepartmentsError", () => {
  beforeEach(() => {
    vi.mocked(reportError).mockClear();
  });

  it("renders the error heading, body, and retry button", () => {
    render(<DepartmentsError error={new Error("boom")} reset={() => {}} />);
    expect(
      screen.getByRole("heading", {
        name: /não foi possível carregar departamentos/i,
      }),
    ).toBeInTheDocument();
    expect(screen.getByText(/tenta novamente/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /tentar novamente/i }),
    ).toBeInTheDocument();
  });

  it("calls reset when the retry button is clicked", async () => {
    const reset = vi.fn();
    render(<DepartmentsError error={new Error("boom")} reset={reset} />);
    await userEvent.click(
      screen.getByRole("button", { name: /tentar novamente/i }),
    );
    expect(reset).toHaveBeenCalledTimes(1);
  });

  it("reports the error on mount with the segment scope", () => {
    const error = new Error("boom");
    render(<DepartmentsError error={error} reset={() => {}} />);
    expect(reportError).toHaveBeenCalledTimes(1);
    expect(reportError).toHaveBeenCalledWith(error, {
      segment: "settings/departments",
    });
  });

  it("shows the digest when present", () => {
    const error = Object.assign(new Error("boom"), { digest: "abc123" });
    render(<DepartmentsError error={error} reset={() => {}} />);
    expect(screen.getByText(/ref:\s*abc123/i)).toBeInTheDocument();
  });

  it("hides the digest when absent", () => {
    render(<DepartmentsError error={new Error("boom")} reset={() => {}} />);
    expect(screen.queryByText(/ref:/i)).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm test src/__tests__/departments/error.test.tsx`
Expected: FAIL — module `@/app/(igrp)/(home)/settings/departments/error` does not exist yet.

- [ ] **Step 3: Implement the error boundary**

Create `src/app/(igrp)/(home)/settings/departments/error.tsx`:

```tsx
"use client";

import { Button, IGRPIcon } from "@igrp/igrp-framework-react-design-system";
import { useEffect } from "react";
import { reportError } from "@/lib/report-error";

interface Props {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function DepartmentsError({ error, reset }: Props) {
  useEffect(() => {
    reportError(error, { segment: "settings/departments" });
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[320px] gap-4 px-6 text-center">
      <IGRPIcon
        iconName="TriangleAlert"
        className="size-10 text-destructive"
        strokeWidth={1.5}
      />
      <h2 className="text-lg font-semibold">
        Não foi possível carregar departamentos
      </h2>
      <p className="text-muted-foreground text-sm max-w-md">
        Ocorreu um erro ao obter a lista. Tenta novamente; se persistir,
        contacta o suporte.
      </p>
      <Button onClick={reset} variant="outline">
        <IGRPIcon
          iconName="RefreshCw"
          className="size-4"
          strokeWidth={2}
        />
        Tentar novamente
      </Button>
      {error.digest && (
        <p className="text-muted-foreground text-xs">Ref: {error.digest}</p>
      )}
    </div>
  );
}
```

If `IGRPIcon` does not ship `TriangleAlert` or `RefreshCw`, substitute the closest equivalents (`AlertTriangle`, `RefreshCcw`, etc.) and note it in the commit body.

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm test src/__tests__/departments/error.test.tsx`
Expected: all 5 cases PASS.

- [ ] **Step 5: Manual smoke**

Temporarily edit `src/actions/departments.ts`'s `getDepartments()` to return `{ success: false, error: "Test failure" }`. Visit `/settings/departments`. The error boundary should render with the friendly copy. Revert the edit and click "Tentar novamente" — the page should recover.

- [ ] **Step 6: Commit**

```bash
git add src/__tests__/departments/error.test.tsx "src/app/(igrp)/(home)/settings/departments/error.tsx"
git commit -m "feat(departments): add segment error boundary with retry and reporter"
```

---

## Task 6: Final verification

**Files:** none modified.

- [ ] **Step 1: Run full type check**

Run: `pnpm exec tsc --noEmit`
Expected: no errors in `src/features/departments/` or `src/app/(igrp)/(home)/settings/departments/`. Pre-existing errors in `src/__tests__/users/components/user-metadata-panel.test.tsx` and `src/app/(auth)/login/page.tsx` are unrelated.

- [ ] **Step 2: Run the focused tests**

Run: `pnpm test src/__tests__/departments`
Expected: all departments tests pass (existing 15 + 5 new from error boundary = 20).

- [ ] **Step 3: Manual verification checklist**

Run `pnpm dev` and open `/settings/departments`. Verify each item in turn:

- [ ] Cold load → no `AppCenterLoading` flash; list renders hydrated.
- [ ] DevTools width <640px → hamburger visible. Click → `Drawer` opens from the bottom. Select a department → drawer closes. Press `Escape` while open → drawer closes.
- [ ] DevTools width 640–1023px → hamburger visible. Click → `Sheet` opens from the left. Tab cycles focus inside the sheet. `Escape` closes. Select a department → sheet closes.
- [ ] DevTools width ≥1024px → no hamburger. `<aside>` always visible.
- [ ] Type fast in search → input stays responsive. Tree dims to ~70% opacity briefly. Spinner shows next to the search icon. Result is correct.
- [ ] Temporarily make `getDepartments` return `{ success: false, error: "x" }` → `error.tsx` renders with friendly copy. Revert and click "Tentar novamente" → page recovers.
- [ ] Open DevTools Performance, scroll the tree → off-screen rows show no paint work (`content-visibility` doing its job).
- [ ] No regressions: create / edit / delete / create-sub / manage-apps dialogs still open and close. Search filter still keeps parents of matching children. Selection persists after a refetch.
- [ ] DevTools Console: no React warnings, no `forwardRef` warnings, no missing-`Title` warnings on `Drawer`/`Sheet`.

- [ ] **Step 4: No commit needed for verification**

If any check fails, fix it as part of the offending task (re-open that task in your workflow rather than patching here).

---

## Verification Checklist (run after Task 6)

- [ ] `pnpm exec tsc --noEmit` — clean
- [ ] `pnpm test src/__tests__/departments` — 20/20 passing
- [ ] Manual verification checklist above — all items checked
- [ ] No console warnings on a fresh page load

---

## Notes for the implementer

- **Do not run `pnpm lint` on the whole repo.** Past tasks triggered Biome's auto-fix across 17 unrelated files. If a single file needs lint, scope it: `pnpm exec biome check <path>`.
- **`IGRPIcon` icon names are best-effort.** If the literal name in this plan isn't available, pick the closest visual equivalent and note the substitution in the commit. Common substitutions: `LoaderCircle` ↔ `Loader2` ↔ `Loader`, `TriangleAlert` ↔ `AlertTriangle`, `RefreshCw` ↔ `RefreshCcw`.
- **Don't add `useEffect` to sync state with props.** The orchestrator already derives `selectedCode` and `isFiltering`. If you find yourself reaching for an effect, reconsider the derivation.
- **Don't expand scope.** Mechanical sweeps (`size-*` replacement, `data-icon` adoption, `useCallback` stabilization, `DepartmentDialogs` consistency, `next/dynamic` on tabs) are deferred to later PRs.
- **The visual look should be unchanged at lg+.** PR 2 is the visual redesign. If a change shifts pixels visibly on desktop, that's a regression for this PR.
