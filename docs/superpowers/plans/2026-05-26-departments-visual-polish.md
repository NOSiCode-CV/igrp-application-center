# Departments Visual Polish (PR 2) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply a focused visual refresh to `/settings/departments` using existing shadcn tokens — pill-shaped tree rows + selection, dropped folder icons with inactive-dot treatment, always-visible row overflow menu, derived sidebar subtitle counter, and a monospace `#code` chip in the detail header.

**Architecture:** Pure visual change. No new dependencies, no new files, no behavior change to selection, expand/collapse, filtering, or dialogs. The status `<Badge>` driven by `getStatusColor` stays unchanged. Counter derivation lives in the orchestrator and is prop-threaded through `DepartmentSidebar` to `DepartmentSidebarContent`.

**Tech Stack:** React 19 (`useMemo`), `@igrp/igrp-framework-react-design-system` (`cn`, `DropdownMenu`, `IGRPIcon`), Tailwind v4 with shadcn semantic tokens (`bg-accent`, `bg-muted`, `text-muted-foreground`), Vitest (existing test suite must still pass).

**Conventions observed in this repo:**
- Tests under `src/__tests__/<feature>/...` (Vitest + RTL). Path alias `@/` → `src/`.
- Commit style: `feat:`, `fix:`, `refactor:`, `test:`, `chore:`, `docs:`. For visual changes, prefer `style:` or `refactor:`.
- **Do NOT run `pnpm lint` on the whole repo.** Biome auto-fix has caused repo-wide import reordering in previous tasks. If a single file needs lint, scope it: `pnpm exec biome check <path>`.
- Always verify `git status` shows only the in-scope files before committing.

**Spec:** [docs/superpowers/specs/2026-05-26-departments-visual-polish-design.md](../specs/2026-05-26-departments-visual-polish-design.md)

**Reference mock:** `.superpowers/brainstorm/1889-1779798262/content/option-b-shadcn-defaults.html`. Open `http://localhost:56909` if the visual companion server is still running, or open the HTML file directly in a browser.

---

## File Structure

**Modify (5 files):**
- `src/features/departments/components/dept-list-tree.tsx` — derive `counts = { active, inactive }` from `departments`, pass to `<DepartmentSidebar>`.
- `src/features/departments/components/dept-sidebar.tsx` — accept `counts` prop, pass to content.
- `src/features/departments/components/dept-sidebar-content.tsx` — accept `counts`, replace subtitle paragraph with derived counter.
- `src/features/departments/components/dept-tree-item.tsx` — pill row treatment, drop folder icons, drop inline `+` button, change overflow-menu opacity baseline, inactive-dot prefix.
- `src/features/departments/components/dept-detail.tsx` — wrap `#code` span in a monospace chip.

**Create:** none.

**Delete:** none.

---

## Task 1: Sidebar counter subtitle

**Why:** The current subtitle paragraph (`"Ver e gerir todos os departamentos do sistema."`) is generic filler. Replacing it with a live counter (`"42 ativos · 3 inativos"` or `"42 departamentos"`) gives the user an at-a-glance summary and matches the reference mock.

**Files:**
- Modify: `src/features/departments/components/dept-list-tree.tsx`
- Modify: `src/features/departments/components/dept-sidebar.tsx`
- Modify: `src/features/departments/components/dept-sidebar-content.tsx`

- [ ] **Step 1: Derive counts in the orchestrator**

In `src/features/departments/components/dept-list-tree.tsx`, after the `useDepartments()` line and before the `useState` block, add a memoized `counts` derivation:

```tsx
const counts = useMemo(
  () => ({
    active: departments?.filter((d) => d.status === "ACTIVE").length ?? 0,
    inactive: departments?.filter((d) => d.status !== "ACTIVE").length ?? 0,
  }),
  [departments],
);
```

`useMemo` is already imported in this file; no new import needed.

- [ ] **Step 2: Pass `counts` to `<DepartmentSidebar />`**

At the `<DepartmentSidebar ... />` call site in the same file, add `counts={counts}`:

```tsx
<DepartmentSidebar
  filtered={filtered}
  searchTerm={searchTerm}
  onSearchChange={setSearchTerm}
  onCreate={() => dispatch({ type: "openCreate" })}
  isOpen={isSidebarOpen}
  onOpenChange={setIsSidebarOpen}
  isFiltering={isFiltering}
  counts={counts}
/>
```

- [ ] **Step 3: Accept `counts` in `DepartmentSidebar` and pass to content**

Open `src/features/departments/components/dept-sidebar.tsx`.

1. Add `counts: { active: number; inactive: number }` to the `Props` interface, after `isFiltering`:

```ts
interface Props {
  filtered: DepartmentWithChildren[];
  searchTerm: string;
  onSearchChange(value: string): void;
  onCreate(): void;
  isOpen: boolean;
  onOpenChange(open: boolean): void;
  isFiltering: boolean;
  counts: { active: number; inactive: number };
}
```

2. Destructure `counts` in the function signature alongside the other props.

3. Add `counts` to the `contentProps` object:

```tsx
const contentProps = {
  filtered,
  searchTerm,
  onSearchChange,
  onCreate,
  isFiltering,
  counts,
};
```

No other changes — `contentProps` is already spread to all three `<DepartmentSidebarContent>` instances (Drawer, Sheet, aside).

- [ ] **Step 4: Render the counter in `DepartmentSidebarContent`**

Open `src/features/departments/components/dept-sidebar-content.tsx`.

1. Add `counts: { active: number; inactive: number }` to the `Props` interface, after `isFiltering`:

```ts
interface Props {
  filtered: DepartmentWithChildren[];
  searchTerm: string;
  onSearchChange(value: string): void;
  onCreate(): void;
  isFiltering: boolean;
  counts: { active: number; inactive: number };
}
```

2. Destructure `counts` in the function signature.

3. Replace the existing subtitle paragraph:

```tsx
<p className="text-muted-foreground text-sm mb-4">
  Ver e gerir todos os departamentos do sistema.
</p>
```

with the derived counter:

```tsx
<p className="text-muted-foreground text-sm mb-4">
  {counts.inactive > 0
    ? `${counts.active} ativos · ${counts.inactive} inativos`
    : `${counts.active} departamento${counts.active === 1 ? "" : "s"}`}
</p>
```

- [ ] **Step 5: Typecheck**

Run: `pnpm exec tsc --noEmit`
Expected: no new errors in `src/features/departments/`. Pre-existing errors in `src/__tests__/users/components/user-metadata-panel.test.tsx` and `src/app/(auth)/login/page.tsx` are unrelated and OK.

- [ ] **Step 6: Manual smoke**

Run `pnpm dev` and visit `/settings/departments`. Verify:
- Sidebar subtitle shows the counter (e.g., `42 ativos · 3 inativos`).
- If all departments are active, the subtitle reads `42 departamentos` (or `1 departamento` for the single-active edge case).

- [ ] **Step 7: Commit**

Verify `git status` shows ONLY these three files modified. Then:

```bash
git add src/features/departments/components/dept-list-tree.tsx src/features/departments/components/dept-sidebar.tsx src/features/departments/components/dept-sidebar-content.tsx
git commit -m "feat(departments): replace sidebar subtitle with derived counter"
```

---

## Task 2: Pill tree rows, drop folder icons, drop inline `+`, dim overflow menu

**Why:** The current tree row uses `rounded-sm` selection + folder icons + dual hover-fade buttons (`+` and `⋯`). The mock direction (Option B with shadcn defaults) calls for `rounded-full` pills, no folder iconography (inactive shown via a small dot prefix), and a single always-visible `⋯` overflow menu. The `+` action is redundant since the dropdown already exposes "Criar Sub-departamento".

**Files:**
- Modify: `src/features/departments/components/dept-tree-item.tsx`

- [ ] **Step 1: Replace the entire file**

REPLACE the contents of `src/features/departments/components/dept-tree-item.tsx` with:

```tsx
import {
  Button,
  cn,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  IGRPIcon,
} from "@igrp/igrp-framework-react-design-system";
import type React from "react";
import type { DepartmentWithChildren } from "../dept-tree-utils";
import { useDeptTree } from "./dept-tree-context";

interface Props {
  dept: DepartmentWithChildren;
  level?: number;
}

const DepartmentTreeItem = ({ dept, level = 0 }: Props) => {
  const {
    selectedCode,
    expanded,
    select,
    toggle,
    onEdit,
    onCreateSub,
    onDelete,
  } = useDeptTree();

  const hasChildren = !!dept.children?.length;
  const isExpanded = expanded.has(dept.code);
  const isSelected = selectedCode === dept.code;
  const isActive = dept.status === "ACTIVE";

  return (
    <div style={{ contentVisibility: "auto", containIntrinsicSize: "40px" }}>
      <div
        className={cn(
          "group flex items-center gap-2 px-3 py-2 my-0.5 rounded-full text-sm transition-colors",
          isSelected
            ? "bg-accent text-accent-foreground font-medium"
            : "hover:bg-accent/60 text-foreground",
          !isActive && !isSelected && "text-muted-foreground",
        )}
        style={{ paddingLeft: `${level * 1.5 + 0.75}rem` }}
      >
        <button
          type="button"
          className="w-4 h-4 flex items-center justify-center shrink-0 disabled:cursor-default"
          onClick={() => hasChildren && toggle(dept.code)}
          disabled={!hasChildren}
          aria-expanded={hasChildren ? isExpanded : undefined}
          aria-label={
            hasChildren
              ? isExpanded
                ? "Recolher departamento"
                : "Expandir departamento"
              : undefined
          }
        >
          {hasChildren ? (
            <IGRPIcon
              iconName="ChevronRight"
              className={cn(
                "w-3.5 h-3.5 transition-transform",
                isExpanded && "rotate-90",
              )}
              strokeWidth={2}
            />
          ) : (
            <div className="w-3.5" />
          )}
        </button>

        <button
          type="button"
          onClick={() => select(dept.code)}
          className="flex items-center gap-2 flex-1 min-w-0 cursor-pointer"
        >
          {!isActive && (
            <span
              aria-hidden
              className="size-1.5 rounded-full bg-muted-foreground shrink-0"
            />
          )}
          <span className="flex-1 text-left truncate">{dept.name}</span>
        </button>

        <div className="opacity-40 group-hover:opacity-100 transition-opacity">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="h-6 w-6 p-0"
                onClick={(e: React.MouseEvent) => e.stopPropagation()}
                aria-label="Abrir menu"
              >
                <IGRPIcon
                  iconName="EllipsisVertical"
                  className="w-4 h-4"
                  strokeWidth={2}
                />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              onCloseAutoFocus={(e) => e.preventDefault()}
              align="end"
            >
              <DropdownMenuItem onSelect={() => onEdit(dept)}>
                <IGRPIcon
                  iconName="Pencil"
                  className="w-4 h-4 mr-2"
                  strokeWidth={2}
                />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => onCreateSub(dept)}>
                <IGRPIcon
                  iconName="FolderPlus"
                  className="w-4 h-4 mr-2"
                  strokeWidth={2}
                />
                Criar Sub-departamento
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onSelect={() => onDelete(dept.code, dept.name)}
              >
                <IGRPIcon
                  iconName="Trash"
                  className="w-4 h-4 mr-2"
                  strokeWidth={2}
                />
                Eliminar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {hasChildren &&
        isExpanded &&
        dept.children?.map((child) => (
          <DepartmentTreeItem
            key={child.code}
            dept={child}
            level={level + 1}
          />
        ))}
    </div>
  );
};

export default DepartmentTreeItem;
```

Notes intentionally applied:
- `Tooltip`, `TooltipContent`, `TooltipTrigger` imports removed (no longer needed — the inline `+` button and its tooltip are gone).
- Outer row class changes: `rounded-sm` → `rounded-full`, selected uses solid `bg-accent` with `text-accent-foreground`, unselected uses `hover:bg-accent/60`, transition narrowed from `transition-all` to `transition-colors`, `py-2.5 my-1.5` → `py-2 my-0.5` for tighter pill rhythm.
- Inactive-without-selection styling: `text-muted-foreground` (the `!isSelected` guard keeps text readable when an inactive row is the selected pill).
- Folder icon block and its red-dot inactive indicator both removed.
- Inactive dot prefix added before the name: `size-1.5 rounded-full bg-muted-foreground`. Only rendered when `!isActive`.
- `<span className="font-medium">` weight removed from the name; the outer pill carries `font-medium` only when selected.
- Inline `+` `<Tooltip>` block removed entirely. The action lives in the dropdown's "Criar Sub-departamento" item.
- Overflow menu container opacity changes: `opacity-0` → `opacity-40` (visible at rest, full opacity on hover).
- `sr-only` span on the dropdown trigger removed; `aria-label="Abrir menu"` on the Button is the accessible name (matches the existing pattern in the codebase).

- [ ] **Step 2: Typecheck**

Run: `pnpm exec tsc --noEmit`
Expected: no new errors in `src/features/departments/`.

- [ ] **Step 3: Run departments tests**

Run: `pnpm test --run src/__tests__/departments`
Expected: 20/20 passing. This file has no automated tests, but the integration ensures we haven't broken context-consumption or row recursion.

- [ ] **Step 4: Manual smoke**

Run `pnpm dev` and verify:
- Tree rows are pill-shaped (`rounded-full`).
- Hovering an unselected row tints it (`bg-accent/60`).
- The selected row is a solid `bg-accent` pill with `font-medium`.
- No folder icons anywhere. The chevron toggle still appears on rows that have children.
- An inactive department renders with a small grayscale dot prefix before its name, and muted text (unless it's the selected row).
- Each row's `⋯` button is visible at ~40% opacity at rest, ~100% on hover.
- The `+` tooltip-button is gone.
- The dropdown still shows Edit / Criar Sub-departamento / Eliminar. All three actions still fire correctly.
- Selecting a sub-department closes the mobile sidebar (PR 1 behavior unchanged).
- Three-level-deep tree still aligns by depth.

- [ ] **Step 5: Commit**

Verify `git status` shows ONLY `src/features/departments/components/dept-tree-item.tsx` modified. Then:

```bash
git add src/features/departments/components/dept-tree-item.tsx
git commit -m "style(departments): pill tree rows, drop folder icons, dim overflow menu"
```

---

## Task 3: Monospace `#code` chip in the detail header

**Why:** The current detail header renders `#{department.code}` as a plain `text-muted-foreground text-xs` span. Wrapping it in a monospace chip with `bg-muted` background gives it the visual rhythm of an identifier and matches the mock.

**Files:**
- Modify: `src/features/departments/components/dept-detail.tsx`

- [ ] **Step 1: Replace the `#code` span**

In `src/features/departments/components/dept-detail.tsx`, find the line:

```tsx
<span className="text-muted-foreground text-xs">#{department.code}</span>
```

Replace it with:

```tsx
<span className="font-mono text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded">
  #{department.code}
</span>
```

No other changes to this file. The surrounding `<div className="flex items-center">` wrapper and the `<CopyToClipboard value={department.code} />` after it stay intact. The status `<Badge className={getStatusColor(...)}>` stays exactly as-is.

- [ ] **Step 2: Typecheck**

Run: `pnpm exec tsc --noEmit`
Expected: no new errors.

- [ ] **Step 3: Manual smoke**

Run `pnpm dev` and pick any department. The `#CODE` text in the header should now appear as a small monospace chip with a light gray background, padded `px-2 py-0.5`, rounded corners. `CopyToClipboard` continues to sit to its right unchanged.

- [ ] **Step 4: Commit**

Verify `git status` shows ONLY `src/features/departments/components/dept-detail.tsx` modified. Then:

```bash
git add src/features/departments/components/dept-detail.tsx
git commit -m "style(departments): render department code as monospace chip"
```

---

## Task 4: Final verification

**Files:** none modified.

- [ ] **Step 1: Typecheck**

Run: `pnpm exec tsc --noEmit`
Expected: no errors in `src/features/departments/` or `src/app/(igrp)/(home)/settings/departments/`. Pre-existing errors elsewhere are unrelated.

- [ ] **Step 2: Run focused tests**

Run: `pnpm test --run src/__tests__/departments`
Expected: 20/20 passing (15 from the original refactor + 5 from PR 1's `error.test.tsx`).

- [ ] **Step 3: Manual verification checklist**

Run `pnpm dev` and open `/settings/departments`. Walk through each item:

- [ ] Sidebar subtitle reads `<n> ativos · <m> inativos` when at least one department is inactive; reads `<n> departamento(s)` when all are active. Verify both branches by toggling a department's status if possible (or with mock data).
- [ ] Tree rows are pill-shaped (`rounded-full`). Hovering an unselected row tints it (`bg-accent/60`). Selected row is a solid `bg-accent` pill with `font-medium`.
- [ ] No folder icons. Chevron still appears on parent rows. Inactive departments render with muted text and a small dot prefix on the name. A selected + inactive row stays readable.
- [ ] `⋯` overflow menu trigger visible at ~40% opacity at rest, ~100% on hover. No `+` button anywhere on the row. Dropdown menu still has Edit / Criar Sub-departamento / Eliminar; all three actions fire.
- [ ] Detail header `#code` renders as a small monospace chip with `bg-muted` background. `CopyToClipboard` button to its right works (click copies, toast or icon-flip appears as before).
- [ ] Status `<Badge>` is **unchanged** — same color logic via `getStatusColor`. (Visual diff against `main` should show no change to the badge.)
- [ ] Three-level-deep tree: indent math still aligns by depth.
- [ ] Mobile Drawer (<sm) and Sheet (sm-lg) still open from hamburger; tree rows inside them have the new pill treatment too (since `DepartmentSidebarContent` is shared).
- [ ] No console warnings on load. No React key warnings, no missing `Title` warnings on Drawer/Sheet.

- [ ] **Step 4: No commit needed for verification**

If any check fails, return to the offending task to fix it rather than patching here.

---

## Verification Checklist (run after Task 4)

- [ ] `pnpm exec tsc --noEmit` — clean for departments-related files
- [ ] `pnpm test --run src/__tests__/departments` — 20/20 passing
- [ ] Manual verification checklist above — all items checked
- [ ] No console warnings on a fresh page load
- [ ] Visual diff against `main` for `/settings/departments`: badge unchanged, everything else matches mock direction

---

## Notes for the implementer

- **Do not run `pnpm lint` on the whole repo.** Past tasks triggered Biome auto-fix across 17 unrelated files. If a single file needs lint, scope it: `pnpm exec biome check <path>`.
- **The `<Badge>` with `getStatusColor` stays unchanged.** Do not touch the status indicator in `dept-detail.tsx`. The only change there is the `#code` span.
- **No new dependencies.** No motion library, no fonts, no new design-system primitives.
- **The reference mock** at `.superpowers/brainstorm/1889-1779798262/content/option-b-shadcn-defaults.html` is the source of visual truth for pill treatment and chip styling. Open it in a browser side-by-side with `/settings/departments` during smoke.
- **If a visual choice from the mock conflicts with a class shown in this plan, the plan wins.** The mock is an approximation; the spec/plan carries the exact classes.
- **`bg-accent/60` hover contrast.** If hover on unselected rows isn't visibly distinct from rest in the live theme, the spec authorizes switching to `bg-muted` for hover. Don't change it speculatively — verify during smoke first.
- **Inactive dot weight.** `size-1.5` (6px) is the default. If too quiet at real viewport sizes, bump to `size-2` (8px). Do not tint the dot.
- **No regressions to PR 1 features.** `useDeferredValue` filter behavior, `content-visibility` on rows, Drawer/Sheet/aside responsive shell, and `error.tsx` boundary all must continue to work. The recursive `<div style={{ contentVisibility ... }}>` wrapper stays in `dept-tree-item.tsx`.
