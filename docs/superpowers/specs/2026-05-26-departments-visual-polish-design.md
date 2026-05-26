# Departments Page — Visual Polish (PR 2)

**Date:** 2026-05-26
**Status:** Design — ready for implementation planning
**Follows:** [2026-05-26 Departments Best-Practices Sweep (PR 1)](2026-05-26-departments-best-practices-sweep-design.md)

## Goal

Apply a focused, scoped visual refresh to `/settings/departments` using the project's existing shadcn token system. No new fonts, no motion library, no atmosphere effects. The result should feel intentional and less generic while staying fully inside the design system's grayscale palette and standard primitives. A later polish PR will pick up the deferred items (display font, segmented tabs, motion, atmosphere).

The reference mock lives at `.superpowers/brainstorm/1889-1779798262/content/option-b-shadcn-defaults.html` for visual comparison during implementation and review.

## Scope

In scope:

- **Pill-shaped sidebar rows.** Selected row uses `bg-accent` filled pill; hover uses `bg-accent/60`. Replaces the current `rounded-sm bg-accent/50` selection treatment.
- **Drop folder icons on tree rows.** Inactive departments get a small grayscale dot prefix on their name and `text-muted-foreground`. The chevron toggle remains as the "has children" affordance.
- **Always-visible row overflow menu.** The per-row `⋯` `DropdownMenu` trigger sits at 40% opacity by default and goes to 100% on hover. The redundant inline `+` ("Criar Sub-departamento") tooltip button goes away — the same action lives inside the dropdown.
- **Sidebar subtitle becomes a derived counter.** Replace the static `"Ver e gerir todos os departamentos do sistema."` paragraph with `"<active> ativos · <inactive> inativos"`. Fall back to `"<n> departamento(s)"` when there are zero inactive departments.
- **Monospace chip for `#code` in the detail header.** Wrap `#{department.code}` in `font-mono text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded`. `CopyToClipboard` stays adjacent, unchanged.

Out of scope (deferred to a later polish PR):

- Status pill with leading dot in the detail header — the existing `<Badge className={getStatusColor(...)}>` stays exactly as-is.
- Display / serif heading font.
- Segmented pill tabs.
- Sliding selection motion (Motion / framer-motion).
- Rounded-full primary CTA and outline action buttons.
- Empty-state illustration redesign.
- Atmosphere effects (gradient mesh, noise overlay, hairline separators).
- Best-practices items still pending after PR 1: `size-*` / `data-icon` mechanical sweep, `DepartmentDialogs` consistency, `useCallback` stabilization, `next/dynamic` on tabs.

## File Plan

**Create:** none.

**Modify:**

- `src/features/departments/components/dept-list-tree.tsx` — derive a `counts` object and thread it through.
- `src/features/departments/components/dept-sidebar.tsx` — prop-thread `counts` to content.
- `src/features/departments/components/dept-sidebar-content.tsx` — replace subtitle paragraph with derived counter.
- `src/features/departments/components/dept-tree-item.tsx` — pill row treatment, drop folder icons, drop inline `+`, change overflow-menu opacity baseline.
- `src/features/departments/components/dept-detail.tsx` — wrap `#code` in a monospace chip.

**Delete:** none.

## Architecture

### Counts derivation (orchestrator)

In `dept-list-tree.tsx`, after `useDepartments()` and before the state declarations:

```tsx
const counts = useMemo(
  () => ({
    active: departments?.filter((d) => d.status === "ACTIVE").length ?? 0,
    inactive: departments?.filter((d) => d.status !== "ACTIVE").length ?? 0,
  }),
  [departments],
);
```

Pass `counts={counts}` to `<DepartmentSidebar />`. No other orchestrator change.

### `DepartmentSidebar` (pass-through)

Add to `Props`:

```ts
counts: { active: number; inactive: number };
```

Add to the `contentProps` literal and to `<DepartmentSidebarContent {...contentProps} />` callers. Pure prop-thread; no logic change.

### `DepartmentSidebarContent` (subtitle)

Add `counts` to `Props`. Replace the subtitle paragraph with:

```tsx
<p className="text-muted-foreground text-sm mb-4">
  {counts.inactive > 0
    ? `${counts.active} ativos · ${counts.inactive} inativos`
    : `${counts.active} departamento${counts.active === 1 ? "" : "s"}`}
</p>
```

### `DepartmentTreeItem` (row treatment)

Three localized edits.

**1. Outer row className.** Replace the current `rounded-sm` + `bg-accent/50` selection logic with:

```tsx
className={cn(
  "group flex items-center gap-2 px-3 py-2 my-0.5 rounded-full text-sm transition-colors",
  isSelected
    ? "bg-accent text-accent-foreground font-medium"
    : "hover:bg-accent/60 text-foreground",
  !isActive && "text-muted-foreground",
)}
```

The `style={{ paddingLeft: ... }}` left-indent for level depth stays. `py-2.5` becomes `py-2` for a slightly tighter pill height; verify against the mock during smoke.

**2. Drop folder block and replace with inactive dot.** The current row content includes:

```tsx
<div className="relative">
  <IGRPIcon iconName={isExpanded ? "FolderOpen" : "Folder"} ... />
  {!isActive && <div className="absolute -right-0.5 -bottom-0.5 w-2 h-2 rounded-full bg-red-500/50 border border-background" />}
</div>
```

Replace the entire `<div className="relative">...</div>` plus the existing `<span className="flex-1 text-left truncate font-medium">{dept.name}</span>` with:

```tsx
{!isActive && (
  <span
    aria-hidden
    className="size-1.5 rounded-full bg-muted-foreground shrink-0"
  />
)}
<span className="flex-1 text-left truncate">{dept.name}</span>
```

The `font-medium` weight stays on the outer pill className when selected; we drop it from the name span so unselected rows are regular weight.

**3. Drop the inline `+` tooltip button.** Remove the entire `<Tooltip>` + `<TooltipTrigger asChild><Button ... onClick={() => onCreateSub(dept)}>...</Button></TooltipTrigger>` block. Keep the `<DropdownMenu>` block immediately following it. Change its parent wrapper opacity:

```tsx
// before
<div className="opacity-0 group-hover:opacity-100 transition-opacity">

// after
<div className="opacity-40 group-hover:opacity-100 transition-opacity">
```

The dropdown already exposes "Criar Sub-departamento" via the existing `onSelect={() => onCreateSub(dept)}` item.

### `DepartmentDetail` (#code chip)

Replace:

```tsx
<span className="text-muted-foreground text-xs">#{department.code}</span>
```

with:

```tsx
<span className="font-mono text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded">
  #{department.code}
</span>
```

The surrounding `<CopyToClipboard value={department.code} />` and the parent `flex items-center` row stay. The Badge using `getStatusColor` stays exactly as-is.

## Testing

No automated tests added. The changes are pure visual treatment; no behavior is altered (selection, expand/collapse, filtering, dialog actions all behave identically to PR 1's final state). Existing 20 departments tests must continue to pass — the `dept-tree-item` rewrite is the only file with behavioral surface area, and only its className/markup change.

## Manual Verification Checklist

Run after the full implementation. Reference: `.superpowers/brainstorm/1889-1779798262/content/option-b-shadcn-defaults.html`.

- [ ] Sidebar subtitle reads `<n> ativos · <m> inativos` when at least one department is inactive; reads `<n> departamento(s)` when all are active.
- [ ] Tree rows are pill-shaped (`rounded-full`). Hover changes background to `bg-accent/60`. Selected row is solid `bg-accent` with `font-medium`.
- [ ] Folder icons are gone. The chevron toggle still appears on rows with children.
- [ ] Inactive departments render with muted text and a small dot prefix on the name. Selected + inactive remains readable.
- [ ] Each row's `⋯` overflow menu trigger is visible at ~40% opacity at rest, ~100% on row hover. No `+` button anywhere on the row. The dropdown still shows Edit / Criar Sub-departamento / Eliminar.
- [ ] Detail header `#code` renders as a small monospace chip with `bg-muted`. `CopyToClipboard` is unchanged to its right.
- [ ] Status `<Badge>` is unchanged — it still uses `getStatusColor`.
- [ ] Three-level-deep tree: indent math still aligns by depth. Mobile (Drawer/Sheet) renders identically to desktop apart from the container.
- [ ] No console warnings. `pnpm test src/__tests__/departments` still passes (20/20).

## Risks & Open Questions

- **Hover contrast.** `bg-accent/60` over the white background gives ~50% opacity of an already-light gray. If hover doesn't read in real lighting, switch to `bg-muted` (same shade as `bg-accent` by default, but used here for affordance differentiation, not color). Decide during smoke, not during planning.
- **Inactive dot weight.** `size-1.5` is `6px`. If too quiet, bump to `size-2` (`8px`). Don't tint the dot — it would fight with the `bg-accent` pill when both an inactive row is selected.
- **`getStatusColor` import in `dept-detail.tsx`.** Stays imported because the Badge still uses it; no leftover dead import to clean up.
- **`option-b-shadcn-defaults.html` mock.** Lives under `.superpowers/brainstorm/.../content/`. If `.superpowers/` is gitignored, the file isn't tracked. The mock is reference-only and won't break implementation if the directory is later cleaned up; the spec carries the source of truth.

## Acceptance

PR 2 is ready to merge when:

- All five Manual Verification Checklist items above pass.
- `pnpm exec tsc --noEmit` is clean for the changed files.
- `pnpm test src/__tests__/departments` returns 20/20.
- The visual result on a real `/settings/departments` page (desktop and a mobile/Drawer width) matches the reference mock at a recognizable level — not pixel-perfect, but the pill row + selection treatment, dropped folder icons, dropped `+` button, dimmed overflow trigger, counter subtitle, and monospace `#code` chip are all visibly present.
