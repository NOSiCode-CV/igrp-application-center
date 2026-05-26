# Departments Page — Best-Practices Sweep (PR 1)

**Date:** 2026-05-26
**Status:** Design — ready for implementation planning
**Follows:** [2026-05-25 Departments Flow Refactor](../plans/2026-05-25-departments-flow-refactor.md)
**Precedes:** PR 2 — Departments visual redesign (separate spec)

## Goal

Address a focused subset of the post-refactor review findings on `src/app/(igrp)/(home)/settings/departments` and its supporting feature module. PR 1 ships accessibility, error-handling, and perceived-performance improvements without changing the visual design. The visual redesign is a separate, sequenced PR.

## Scope

In scope:

- **S1** — Replace the hand-rolled mobile sidebar (manual `z-50` overlay + backdrop button) with a three-tier responsive shell: `Drawer` below `sm`, `Sheet` between `sm` and `lg`, static `<aside>` at `lg+`. Both `Drawer` and `Sheet` are already exported by `@igrp/igrp-framework-react-design-system`; neither is currently used elsewhere in the app.
- **N1** — Add a segment-level `error.tsx` for `app/(igrp)/(home)/settings/departments` with friendly Portuguese copy, a retry button, and a hook into `reportError()` for logging.
- **R7** — `useDeferredValue(searchTerm)` so the search input stays responsive on large trees. Pair it with a subtle "filtering" indicator (input spinner + dimmed tree) while the deferred value lags.
- **R5** — `content-visibility: auto` plus `contain-intrinsic-size` on tree-row wrappers so off-screen rows skip layout/paint for orgs with hundreds of departments.

Out of scope (deferred):

- Visual redesign (display font, sliding selection indicator, restyled tree rows, atmosphere, motion) — PR 2.
- `S3 + S4` — `size-*` / `data-icon` mechanical sweep.
- `C1` — `DepartmentDialogs` always-mounted vs conditional inconsistency.
- `R2` — `useCallback` stabilization for inline arrow handlers.
- `R4` — `next/dynamic` lazy mount for tab content.
- Tree virtualization with `@tanstack/react-virtual` — revisit only if `content-visibility` is insufficient.

## File Plan

**Create:**

- `src/app/(igrp)/(home)/settings/departments/error.tsx` — segment error boundary. Client component (`'use client'` is mandatory for Next.js error files).
- `src/features/departments/components/dept-sidebar-content.tsx` — extracted inner sidebar content (header + search + tree list + empty state). Pure presentation, no responsive logic.
- `src/__tests__/departments/error.test.tsx` — Vitest + RTL smoke test for the error boundary.

**Modify:**

- `src/features/departments/components/dept-sidebar.tsx` — becomes a responsive shell that renders `<DepartmentSidebarContent>` inside one of `Drawer | Sheet | <aside>`. Expected size: ~80 lines, down from 125.
- `src/features/departments/components/dept-list-tree.tsx` — add `useDeferredValue(searchTerm)`, derive `isFiltering`, pass both `deferredSearchTerm` and `isFiltering` into `DepartmentSidebar`.
- `src/features/departments/components/dept-tree-item.tsx` — outer wrapper `<div>` gets `style={{ contentVisibility: "auto", containIntrinsicSize: "40px" }}`.

**Delete:** none.

## Architecture

### Responsive shell strategy (CSS-driven)

All three containers (Drawer, Sheet, aside) are rendered to the DOM. Tailwind responsive classes show exactly one at a time:

- `<sm`: `Drawer` visible, `Sheet` hidden, `aside` hidden.
- `sm` – `lg`: `Sheet` visible (its trigger is rendered), `Drawer` hidden, `aside` hidden.
- `lg+`: `aside` visible, `Drawer` and `Sheet` hidden (and their `open` state irrelevant since they aren't rendered to a portal when closed).

`Drawer` and `Sheet` only render their actual content into a portal when `open` is `true`, so the DOM cost when closed is just the trigger markup. The `aside` always renders.

This avoids:

- Hydration mismatches (server and client agree on the markup).
- Tree double-mounting (only one `<DepartmentSidebarContent>` is visible at a time).
- A custom `useMediaQuery` hook and its SSR `null` flash.

The orchestrator holds a single `isSidebarOpen` boolean. Both `Drawer` and `Sheet` bind to it. Resizing across breakpoints with the sidebar open is acceptable — the user just sees the new container open at the same state.

### Component contract: `DepartmentSidebarContent`

```ts
interface Props {
  filtered: DepartmentWithChildren[];
  searchTerm: string;
  onSearchChange(value: string): void;
  onCreate(): void;
  isFiltering: boolean;
}
```

Pure presentation. No knowledge of `Drawer`/`Sheet`/`aside`, mobile state, or hamburger toggles. The `isFiltering` prop drives a subtle visual hint:

- The search input shows a `Loader2`-style spinner via `IGRPIcon iconName="Loader"` (or equivalent) at the right edge while filtering.
- The tree list container gets `opacity-70` while filtering.

### Component contract: `DepartmentSidebar` (responsive shell)

```ts
interface Props {
  filtered: DepartmentWithChildren[];
  searchTerm: string;
  onSearchChange(value: string): void;
  onCreate(): void;
  isOpen: boolean;
  onOpenChange(open: boolean): void;
  isFiltering: boolean;
}
```

Layout sketch:

```tsx
<>
  {/* Trigger — visible only below lg */}
  <Button className="lg:hidden ..." onClick={() => onOpenChange(true)}>
    <IGRPIcon iconName="Menu" /> Departamentos
  </Button>

  {/* <sm */}
  <Drawer open={isOpen} onOpenChange={onOpenChange}>
    <DrawerContent className="sm:hidden ...">
      <DrawerTitle className="sr-only">Departamentos</DrawerTitle>
      <DepartmentSidebarContent {...contentProps} />
    </DrawerContent>
  </Drawer>

  {/* sm – lg */}
  <Sheet open={isOpen} onOpenChange={onOpenChange}>
    <SheetContent side="left" className="hidden sm:block lg:hidden w-80 ...">
      <SheetTitle className="sr-only">Departamentos</SheetTitle>
      <DepartmentSidebarContent {...contentProps} />
    </SheetContent>
  </Sheet>

  {/* lg+ */}
  <aside className="hidden lg:block w-80 ...">
    <DepartmentSidebarContent {...contentProps} />
  </aside>
</>
```

The `sr-only` titles satisfy the shadcn/Radix rule that `Dialog`/`Sheet`/`Drawer` always need a `Title`.

### Search filter wiring (R7)

In `dept-list-tree.tsx`:

```tsx
const [searchTerm, setSearchTerm] = useState("");
const deferredSearchTerm = useDeferredValue(searchTerm);
const isFiltering = searchTerm !== deferredSearchTerm;

const { filtered } = useDepartmentTree(departments, deferredSearchTerm);
```

- Input stays bound to `searchTerm` (immediate, no lag).
- `useDepartmentTree` runs on the deferred value.
- `isFiltering` drives the visual hint inside `DepartmentSidebarContent`.

No changes to the `useDepartmentTree` hook signature — it already accepts a `string`.

`useDeferredValue` is the right tool here, not `useTransition`: the work is driven by a derived value, not a state setter.

### Tree row optimization (R5)

`dept-tree-item.tsx` outermost element:

```tsx
<div style={{ contentVisibility: "auto", containIntrinsicSize: "40px" }}>
  {/* existing row + recursive children */}
</div>
```

- `40px` is the rough rendered height of a single row (`py-2.5` + content). The browser reserves this much space and skips paint/layout when off-screen.
- Nested children get their own `content-visibility: auto`, so the optimization compounds for deep trees.
- `Tab` focus and `scrollIntoView` continue to work on hidden subtrees.

### Error boundary (N1)

`src/app/(igrp)/(home)/settings/departments/error.tsx`:

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
    reportError(error, { scope: "settings/departments" });
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[320px] gap-4 px-6 text-center">
      <IGRPIcon iconName="TriangleAlert" className="size-10 text-destructive" strokeWidth={1.5} />
      <h2 className="text-lg font-semibold">Não foi possível carregar departamentos</h2>
      <p className="text-muted-foreground text-sm max-w-md">
        Ocorreu um erro ao obter a lista. Tenta novamente; se persistir, contacta o suporte.
      </p>
      <Button onClick={reset} variant="outline">
        <IGRPIcon iconName="RefreshCw" className="size-4" strokeWidth={2} />
        Tentar novamente
      </Button>
      {error.digest && (
        <p className="text-muted-foreground text-xs">Ref: {error.digest}</p>
      )}
    </div>
  );
}
```

This boundary catches:

- Errors thrown from the server-side prefetch in `page.tsx` (when `getDepartments()` returns `success: false` and the queryFn re-throws).
- Errors thrown from inside the client tree (`if (error) throw error` in `DepartmentListTree`).

`reset()` re-mounts the segment, which re-runs the server action.

## Data Flow

No changes to the existing data flow. `useDepartments` still drives the list; mutations still invalidate on success. `useDeferredValue` is purely a scheduling concern.

## Error Handling

- Server prefetch failure → page throws → `error.tsx` displayed → user clicks "Tentar novamente" → `reset()` re-runs the server action.
- Client mutation failure → already surfaced via existing toast notifications in mutation hooks; unchanged.
- Client render failure → falls through to the same `error.tsx`.

`reportError` is called once on mount; not on every render. The error reporter is responsible for deduplication.

## Testing

**New test file:** `src/__tests__/departments/error.test.tsx`

Tests:

1. **Renders error UI** — given an `Error("boom")`, asserts the heading, body, and retry button render.
2. **Calls reset on retry** — clicks the retry button, asserts the `reset` mock was invoked once.
3. **Reports error on mount** — asserts `reportError` was called with the error and `{ scope: "settings/departments" }`.
4. **Renders digest when present** — asserts the digest is shown when `error.digest` is set.
5. **Hides digest when absent** — asserts the digest paragraph is not rendered when `error.digest` is undefined.

Mock `@/lib/report-error` via `vi.mock`.

**No new tests for:**

- Sheet/Drawer integration — relying on design-system primitive tests. Covered by the manual verification checklist.
- `useDeferredValue` — behavior is visual scheduling, awkward to assert; covered by manual smoke.
- `content-visibility` — pure CSS, no behavioral change; covered by manual smoke + DevTools inspection.

## Manual Verification Checklist

Run after the full implementation:

- [ ] Cold load `/settings/departments` → renders hydrated, no `AppCenterLoading` flash.
- [ ] DevTools width `<640px` → hamburger button visible, clicking it opens a `Drawer` (bottom). Selecting a department closes it. Escape closes it.
- [ ] DevTools width `640px`–`1023px` → hamburger button visible, clicking it opens a `Sheet` from the left. Focus is trapped while open. Selecting closes it. Escape closes it.
- [ ] DevTools width `≥1024px` → no hamburger; `<aside>` always visible.
- [ ] Type rapidly in search → input stays responsive; tree dims to ~70% opacity briefly; spinner shows next to the input while filter catches up; result is correct.
- [ ] Manually break `getDepartments` (return `{ success: false, error: "test" }`) → `error.tsx` renders with the friendly copy and retry button. Clicking retry restores normal flow when the error condition is removed.
- [ ] With 200+ mock departments → scrolling stays smooth; in DevTools Performance panel, `content-visibility: auto` is skipping render work for off-screen rows.

## Risks & Open Questions

- **`reportError` signature.** Spec assumes `reportError(error, context)`. If the actual signature differs, the call site adapts; no spec change.
- **`IGRPIcon` icon names.** Spec uses `Menu`, `TriangleAlert`, `RefreshCw`, `Loader`. If `IGRPIcon` doesn't ship one of these, substitute the closest available equivalent at implementation time and note it in the PR description.
- **`SheetContent` `side="left"` width.** `w-80` (320px) matches the desktop aside; verify the design system honors that on `SheetContent`. If the DS forces a fixed width, switch to its variant prop instead of `w-80`.
- **Drawer accessibility on iOS.** `Drawer` from the DS is built on `vaul`; behavior on iOS Safari with the on-screen keyboard active (search input focused) should be verified during manual smoke.

## Acceptance

PR 1 is ready to merge when:

- All five test cases in `error.test.tsx` pass.
- `pnpm exec tsc --noEmit` and `pnpm lint` are clean for the changed files.
- The manual verification checklist passes on Chrome (desktop + DevTools mobile) and at least one real mobile device.
- The existing 15 departments tests still pass.
