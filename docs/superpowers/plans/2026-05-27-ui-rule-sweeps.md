# Mechanical UI-Rule Sweeps Implementation Plan (Plan B)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminate the shadcn Critical-Rule violations across `src/**/*.tsx` so the `check:ui` gate (Plan A) can flip to blocking, grouped into one cosmetic MR plus three semantic MRs by risk class.

**Architecture:** Each task is a self-contained sweep verified by `pnpm check:ui` (the deterministic worklist), `pnpm lint`, and `pnpm build`. Cosmetic changes (no rendered-output effect) ship in one MR; semantic changes (can alter appearance) ship per-rule for focused visual review.

**Tech Stack:** Biome 2.4.15, the `check:ui` scanner from Plan A, the IGRP design system (shadcn-based) — `Skeleton`, `Badge`, `Separator` primitives, semantic Tailwind tokens.

**Prerequisite:** Plan A merged (`pnpm check:ui` exists).

---

## Excluded files (do NOT touch in this plan)

These three are rebuilt in Plan C; touching them here causes merge collisions. They will still report violations after Plan B — that is expected and resolved by Plan C:

- `src/app/(igrp)/(home)/page.tsx`
- `src/features/applications/components/app-list-home.tsx`
- `src/features/users/components/user-list-table.tsx`

**The authoritative worklist for each rule is `pnpm check:ui` output filtered by `ruleId`.** The file lists below are the snapshot at planning time; trust the gate output at execution time.

## Transformation reference

| Rule | From | To |
|---|---|---|
| `no-space-xy` | `space-y-4` / `space-x-2` | `flex flex-col gap-4` / `flex gap-2` (add `flex`/`flex-col` to the element) |
| `use-size` | `w-10 h-10` | `size-10` |
| `use-separator` | `<hr />` / `<div className="border-t" />` | `<Separator />` (import from design system) |
| `no-raw-color` | `bg-emerald-600`, `text-amber-600` | `Badge` variant or semantic token (see Task 3 mapping) |
| `no-animate-pulse` | `<div className="... animate-pulse" />` | `<Skeleton className="..." />` |
| `no-dark-color` | `text-slate-900 dark:text-white` | `text-foreground` (semantic token, no `dark:`) |

---

### Task 1: Cosmetic sweep — space→gap, size-N, hr/border-t→Separator (one MR)

**Files (snapshot — confirm via gate; exclude the 3 deep-refactor files):**
- `space-x/y`: app-form.tsx, manage-apps-modal.tsx, manage-menus-modal.tsx, menu-form-dialog.tsx, resource-manage-modal.tsx, profile-role-list.tsx, role-form-dialog.tsx, role-permissions-dialog.tsx, user-edit-form.tsx, user-invite-dialog.tsx, user-profile-form.tsx, user-role-dialog.tsx, user-role-list.tsx, user-roles-list.tsx, user-signature.tsx, settings/page.tsx
- `w-N h-N`: logout/page.tsx, confirmation-modal.tsx, app-details.tsx, manage-apps-modal.tsx, manage-menus-modal.tsx, dept-detail.tsx, dept-list-simple-container.tsx, dept-list-simple-tree.tsx, dept-menu-tree.tsx, dept-menu.tsx, dept-sidebar-content.tsx, dept-sidebar.tsx, dept-tree-item.tsx, menu-tree-row.tsx, permission-list.tsx, resource-manage-modal.tsx, role-tree-list.tsx, role.tree-row.tsx, user-avatar-uploader.tsx, user-name-editor.tsx, user-profile-actions-menu.tsx, user-profile-avatar.tsx, user-profile-editable-name.tsx, user-profile-form.tsx, user-profile-status-dialog.tsx, user-signature.tsx, user-status-toggle.tsx, settings/page.tsx
- `<hr>`/`border-t`: app-card.tsx, app-form.tsx

- [ ] **Step 1: Capture the cosmetic worklist**

Run: `pnpm check:ui 2>&1 | grep -E "no-space-xy|use-size|use-separator"`
Expected: a list of `file:line  [level] ruleId → "match"` entries. This is your checklist. Ignore any entry in the 3 excluded files.

- [ ] **Step 2: Apply `size-N` replacements**

For every `use-size` hit, replace the equal pair with `size-N`. Example — `src/features/users/components/user-profile-avatar.tsx`:

```tsx
// before
<div className="flex items-center justify-center w-full h-full bg-muted/50 animate-pulse">
// after (size rule only — leave bg-muted/animate-pulse for later tasks)
<div className="flex items-center justify-center w-full h-full bg-muted/50 animate-pulse">
```

(`w-full h-full` is NOT an equal numeric pair → not flagged; only numeric `w-N h-N` like `w-5 h-5`→`size-5`.) Apply to each flagged line, e.g. `w-2 h-2`→`size-2`, `w-5 h-5`→`size-5`, `w-1.5 h-1.5`→`size-1.5`.

- [ ] **Step 3: Apply `space-x/y`→`gap` replacements**

For each `no-space-xy` hit, replace `space-y-N` with `flex flex-col gap-N` and `space-x-N` with `flex gap-N` on the same element. Example — `src/features/users/components/user-role-list.tsx`:

```tsx
// before
<div className="space-y-3">
// after
<div className="flex flex-col gap-3">
```

If the element already has `flex`/`flex-col`, only swap the `space-*` token for `gap-*`. If it relies on non-flex layout (e.g. it's a block with margins between children that must NOT become flex), instead wrap children or use `gap` via a flex container — verify the layout visually in Step 6.

- [ ] **Step 4: Apply `<hr>`/`border-t`→`Separator`**

In `src/features/applications/components/app-card.tsx` and `app-form.tsx`, add the import and replace dividers:

```tsx
import { Separator } from "@igrp/igrp-framework-react-design-system";
// before:  <hr className="my-4" />   OR   <div className="border-t" />
// after:   <Separator className="my-4" />
```

- [ ] **Step 5: Re-run the gate for these three rules**

Run: `pnpm check:ui 2>&1 | grep -E "no-space-xy|use-size|use-separator" | grep -vE "page.tsx|app-list-home|user-list-table"`
Expected: **no output** (all non-excluded hits cleared).

- [ ] **Step 6: Lint, build, visual check**

Run: `pnpm lint && pnpm build`
Expected: both pass. Then `pnpm dev` and visually confirm the touched screens (a dialog, the dept tree, an app card) render with unchanged spacing/dividers.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "style(ui): cosmetic shadcn-rule sweep — gap, size-N, Separator"
```

---

### Task 2: Semantic sweep — `animate-pulse`→`Skeleton` (own MR)

**Files (snapshot; exclude the 3 deep-refactor files):**
logout/page.tsx, app-details.tsx, manage-apps-modal.tsx, manage-menus-modal.tsx, menu-form-dialog.tsx, resource-manage-modal.tsx, user-avatar-uploader.tsx, user-details-tabs.tsx, user-profile-avatar.tsx

- [ ] **Step 1: Capture the worklist**

Run: `pnpm check:ui 2>&1 | grep no-animate-pulse`
Expected: list of `animate-pulse` hits.

- [ ] **Step 2: Replace loading-placeholder pulses with `Skeleton`**

For pulses that are **loading placeholders** (avatar/image loaders, tab skeletons), swap the hand-rolled div for the primitive. Example — `src/features/users/components/user-details-tabs.tsx:23`:

```tsx
import { Skeleton } from "@igrp/igrp-framework-react-design-system";
// before
<div className="flex flex-col gap-3 p-4 animate-pulse">
  {/* ...placeholder bars... */}
</div>
// after
<div className="flex flex-col gap-3 p-4">
  <Skeleton className="h-4 w-1/3" />
  <Skeleton className="h-4 w-2/3" />
  <Skeleton className="h-4 w-1/2" />
</div>
```

For avatar loaders (`user-avatar-uploader.tsx:88`, `user-profile-avatar.tsx:71`, `app-details.tsx:164`):

```tsx
// before
<div className="flex items-center justify-center w-full h-full bg-muted/50 animate-pulse">
// after
<Skeleton className="size-full" />
```

- [ ] **Step 3: Replace decorative "live" pulses with a static or token treatment**

The `w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse` "online dot" (manage-apps-modal.tsx:291, manage-menus-modal.tsx:351, resource-manage-modal.tsx:243) is NOT a loading skeleton — `Skeleton` is wrong here. Remove `animate-pulse` and let Task 3 convert the color to a status `Badge`/token. For this task, just drop `animate-pulse`:

```tsx
// before
<div className="size-1.5 rounded-full bg-emerald-600 animate-pulse" />
// after (color handled in Task 3)
<div className="size-1.5 rounded-full bg-emerald-600" />
```

- [ ] **Step 4: Re-run the gate**

Run: `pnpm check:ui 2>&1 | grep no-animate-pulse | grep -vE "page.tsx|app-list-home|user-list-table"`
Expected: no output.

- [ ] **Step 5: Lint, build, visual check**

Run: `pnpm lint && pnpm build`
Expected: pass. Then confirm a loading state (open a user detail tab, an avatar uploader) shows a `Skeleton`, not a blank box.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "refactor(ui): replace custom animate-pulse with Skeleton primitive"
```

---

### Task 3: Semantic sweep — raw colors → `Badge`/semantic tokens (own MR)

**Files (snapshot; exclude the 3 deep-refactor files):**
logout/page.tsx, app-card-home.tsx, dept-list-simple-tree.tsx, dept-menu.tsx, manage-apps-modal.tsx, manage-menus-modal.tsx, permission-list.tsx, resource-manage-modal.tsx, profile-role-list.tsx, invite-step-header.tsx

**Token mapping:**

| Raw color (intent) | Replace with |
|---|---|
| `bg-emerald-*` / `bg-green-*` (success/active) | `bg-primary` or a `Badge variant="default"`; for a status dot `bg-primary` |
| `text-amber-*` / `bg-amber-*` (warning) | semantic warning token if defined, else `Badge variant="secondary"`; keep amber only if no token exists (note it) |
| `bg-red-*` / `text-red-*` (danger) | `bg-destructive` / `text-destructive` |
| `text-slate-*` / `text-gray-*` (muted text) | `text-muted-foreground` |
| `bg-green-800 text-white` (role chip) | `Badge variant="default"` |
| `fill-yellow-400 text-yellow-400` (favorite star) | keep semantic intent: define a `text-warning`/token or leave star fill as a deliberate brand accent — **decide per case, document choice** |

- [ ] **Step 1: Capture the worklist**

Run: `pnpm check:ui 2>&1 | grep no-raw-color`
Expected: list of raw-color hits.

- [ ] **Step 2: Convert status dots to tokens**

manage-apps-modal.tsx, manage-menus-modal.tsx, resource-manage-modal.tsx — the online dot:

```tsx
// before
<div className="size-1.5 rounded-full bg-emerald-600" />
// after
<div className="size-1.5 rounded-full bg-primary" />
```

And `data-[state=checked]:bg-emerald-500` / `data-[state=checked]:bg-green-200` on switches/checkboxes → `data-[state=checked]:bg-primary`.

- [ ] **Step 3: Convert status labels to `Badge`**

`src/features/users/components/invite/invite-step-header.tsx:14-16`:

```tsx
// before
const styles = {
  warning: "bg-amber-500/10 text-amber-600",
  success: "bg-emerald-500/10 text-emerald-600",
};
// after — use Badge variants instead of a styles map
import { Badge } from "@igrp/igrp-framework-react-design-system";
// render: <Badge variant={step.kind === "success" ? "default" : "secondary"}>...</Badge>
```

`src/features/profile/components/profile-role-list.tsx:89` (`bg-green-800 text-white`):

```tsx
// before
<span className="bg-green-800 text-white text-xs">{role}</span>
// after
<Badge variant="default" className="text-xs">{role}</Badge>
```

- [ ] **Step 4: Convert muted text and the logout page**

`src/app/(auth)/logout/page.tsx:42,45`:

```tsx
// before
<h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
<p className="text-slate-600 dark:text-slate-400">
// after
<h2 className="text-2xl font-bold text-foreground mb-2">
<p className="text-muted-foreground">
```

(This also clears the `no-dark-color` hits in this file — Task 4 confirms.)

- [ ] **Step 5: Handle the favorite star and dept badges deliberately**

`app-card-home.tsx:83` favorite star `fill-yellow-400 text-yellow-400` and `dept-list-simple-tree.tsx:87` `bg-red-500/50`, `dept-menu.tsx:549` `text-amber-500`: decide per case — if it's a deliberate brand accent, the cleanest fix is to add a semantic token (e.g. `--color-warning`) in `src/styles/globals.css` and use `text-warning`. If no token is warranted, convert danger→`text-destructive`. Document the choice in the commit body.

- [ ] **Step 6: Re-run the gate**

Run: `pnpm check:ui 2>&1 | grep no-raw-color | grep -vE "page.tsx|app-list-home|user-list-table"`
Expected: no output (or only documented deliberate-accent exceptions, which must instead be resolved with a token so the gate is clean).

- [ ] **Step 7: Lint, build, visual check**

Run: `pnpm lint && pnpm build`
Expected: pass. Confirm status dots, role badges, the invite header, and the logout page render correctly in **both light and dark mode**.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "refactor(ui): replace raw color literals with Badge/semantic tokens"
```

---

### Task 4: Semantic sweep — manual `dark:` color overrides → tokens (own MR)

**Files (snapshot; exclude the 3 deep-refactor files):**
logout/page.tsx (cleared in Task 3), app-card.tsx, menu-delete-dialog.tsx, role-delete-dialog.tsx

- [ ] **Step 1: Capture the worklist**

Run: `pnpm check:ui 2>&1 | grep no-dark-color`
Expected: list of `dark:` color hits (logout/page.tsx should already be gone if Task 3 merged first).

- [ ] **Step 2: Replace `dark:` color overrides with semantic tokens**

For each hit, remove the `dark:` color utility and the light-mode color it pairs with, replacing both with the semantic token that adapts automatically. Example pattern — `menu-delete-dialog.tsx` / `role-delete-dialog.tsx`:

```tsx
// before (manual light+dark pair)
<div className="bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300">
// after
<div className="bg-destructive/10 text-destructive">
```

`app-card.tsx`: replace any `dark:` color with the matching token (`bg-card`, `text-card-foreground`, `border-border`, etc.).

- [ ] **Step 3: Re-run the gate**

Run: `pnpm check:ui 2>&1 | grep no-dark-color | grep -vE "page.tsx|app-list-home|user-list-table"`
Expected: no output.

- [ ] **Step 4: Lint, build, dark-mode check**

Run: `pnpm lint && pnpm build`
Expected: pass. Toggle dark mode and confirm the delete dialogs and app cards still have correct contrast.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "refactor(ui): replace manual dark: color overrides with semantic tokens"
```

---

### Task 5: Confirm strict count is limited to the excluded files

**Files:** (none — verification)

- [ ] **Step 1: Run the full gate**

Run: `pnpm check:ui`
Expected: the only remaining **strict** violations are inside the three excluded files (`(home)/page.tsx`, `app-list-home.tsx`, `user-list-table.tsx`). Advisory (`use-size`) may remain in excluded files. If any strict hit exists in a non-excluded file, return to the relevant task.

- [ ] **Step 2: Record the residual for Plan C**

Note the residual strict count and which excluded files contribute. Plan C's refactors of those files must clear them; only then does Plan A Task 6 (flip the gate to blocking) run.

---

## Self-Review

**Spec coverage:** #3 cosmetic (space/size/separator) → Task 1; #4 raw-colors → Task 3; #5 animate-pulse → Task 2; #6 dark: → Task 4; gate verification → Task 5. ✓ (Issue numbers per the grill backlog: #3 cosmetic, #4 raw-color, #5 skeleton, #6 dark — note Task ordering here groups by risk, not issue number.)

**Placeholder scan:** File lists are explicit snapshots with the gate as the authoritative live worklist (deterministic tool, not a vague "fix the rest"). Each transformation has before/after code. The one genuine judgment call (favorite star / brand accents, Task 3 Step 5) is called out explicitly with a decision rule, not left implicit. ✓

**Type/consistency:** Imports (`Separator`, `Skeleton`, `Badge`) all from `@igrp/igrp-framework-react-design-system`, consistent across tasks. The excluded-file list is identical in every task and matches Plan C's targets. ✓

**Cross-plan note:** Tasks 2 and 3 both touch the "online dot" lines (Task 2 removes `animate-pulse`, Task 3 changes the color). If executed as separate MRs, expect a small conflict on those 3 lines — land Task 2 before Task 3, or rebase. Documented intentionally.
