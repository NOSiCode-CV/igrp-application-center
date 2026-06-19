# Applications Settings Page Design & A11y Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply the accessibility, dark-mode, and consistency fixes specified in `docs/superpowers/specs/2026-06-19-applications-page-design-fixes-design.md` to the Applications settings page and the shared components it renders. Polish only — no new features, no data-layer changes.

**Architecture:** The page is a thin RSC shell (`page.tsx`) that prefetches via TanStack Query and hydrates the `ApplicationList` client tree. This plan touches only presentational concerns: the loading spinner, the status-color util, the toolbar search input, the faceted-filter menu, the empty states, the form's input hygiene, the card's hover styling, and the error copy. The data layer (`use-applications`, `prefetch`, server actions, schemas) is untouched.

**Tech Stack:** Next.js 15 App Router (RSC), React 19, TanStack Query v5, `@igrp/igrp-framework-react-design-system`, Tailwind v4, Vitest + React Testing Library.

**Shared-surface caution:** `getStatusColor` (`src/lib/utilities.ts`) and `InlineError` (`src/components/inline-error.tsx`) are used outside applications. Their tasks (3, 5) enumerate and validate every call site before changing defaults.

---

## File Structure

**Modify**
- `src/components/loading.tsx` — live-region + reduced-motion (Task 1).
- `src/features/applications/components/applications-toolbar.tsx` — search accessible name, decorative icon, ellipsis, spellcheck (Task 2).
- `src/lib/utilities.ts` — `getStatusColor` INACTIVE branch (Task 3).
- `src/styles/globals.css` — add `status-inactive` token if a class approach is chosen (Task 3).
- `src/components/data-table/faceted-filter.tsx` — drop leading separator, `aria-hidden` icons (Task 4).
- `src/app/(igrp)/(home)/settings/applications/error.tsx` — recovery copy, keep logging (Task 5).
- `src/components/inline-error.tsx` — caller-supplied message; default untouched unless all callers agree (Task 5).
- `src/features/applications/components/app-list.tsx` — unify CTA copy + empty-state styling (Task 6).
- `src/features/applications/components/applications-grid.tsx` — align no-results state with list empty state (Task 6).
- `src/features/applications/components/app-form.tsx` — autoComplete/spellCheck, aria-hidden asterisks, placeholder ellipsis, drop native `required` (Task 7).
- `src/features/applications/components/app-card.tsx` — extract/drop duplicated hover override (Task 8).

**Create (conditional)**
- `src/features/applications/components/applications-empty-state.tsx` — only if extraction is cleaner than node-passing (Task 6).
- Test files listed under each task.

---

## Phase 0 — Verification (no code)

### Task 0: Confirm available IGRP primitives

- [x] Check whether `@igrp/igrp-framework-react-design-system` exports an `Empty`/`EmptyState`, a `Skeleton`, and a status `Badge` variant. Use the design system's barrel or `docs/DESIGN_SYSTEM.md`.
- [x] Record findings in the PR description. Decision: if no `Empty`/`Skeleton`, keep token-fixed custom markup (do **not** import raw shadcn).
- [x] Inspect `src/styles/globals.css` for the existing `status-active` definition to mirror it for `status-inactive`.

---

## Phase 1 — High priority

Each task is independent and lands as its own commit.

### Task 1: `loading.tsx` accessibility + reduced motion

**Files:** Modify `src/components/loading.tsx:5,10`

- [x] Add `role="status"` and `aria-live="polite"` to the outer container; keep `description` as the visible live text.
- [x] Add `aria-hidden` to the `LoaderCircle` `IGRPIcon` (wrap in `<span aria-hidden>` if `IGRPIcon` doesn't forward it — verify).
- [~] ~~Change `animate-spin` → `motion-safe:animate-spin`~~ — **not needed**: `globals.css:16-25` already disables all animation under `prefers-reduced-motion` globally.
- [x] Fix the caller string in `applications/loading.tsx` (and `app-list.tsx:36`) to use a real ellipsis `…`.
- [x] Shared loader: typecheck + existing callers unaffected (no running-app visual check performed).

### Task 2: Search input accessible name

**Files:** Modify `src/features/applications/components/applications-toolbar.tsx:26,31,33`

- [x] Add `aria-label="Pesquisar aplicações"` to the search `Input`.
- [x] Add `aria-hidden` to the decorative Search `IGRPIcon` (wrap if not forwarded).
- [x] Add `spellCheck={false}`; change placeholder to end with `…`.
- [x] **Test** — add to (or create) `src/__tests__/applications/applications-toolbar.test.tsx`:
  - `it("exposes an accessible name for the search field")` — `getByRole("searchbox", { name: /pesquisar/i })` resolves.

### Task 3: Status color — fix INACTIVE (shared util)

**Files:** Modify `src/lib/utilities.ts:3-5`; possibly `src/styles/globals.css`

- [x] Grep all `getStatusColor` call sites: `app-card.tsx:66`, `resource-manage-modal.tsx:216`, and any others. List them in the commit.
- [x] Replaced raw `"bg-amber-100 text-amber-800"` with the **existing** `status-inactive` token (`app-center.css:281` → `@apply bg-muted text-muted-foreground`), dark-mode-safe. No new token needed.
- [~] Verified call sites compose via `cn()` (both use it); running-app light/dark visual check **not** performed.
- [x] **Test** — `src/__tests__/lib/utilities.test.ts` (add or extend):
  - `it("returns the semantic inactive treatment for INACTIVE")` — asserts the new class, not the raw amber string.
  - `it("returns status-active for ACTIVE")` — unchanged.

---

## Phase 2 — Medium priority

### Task 4: Faceted filter — stray separator + decorative icons

**Files:** Modify `src/components/data-table/faceted-filter.tsx:43,38,66`

- [x] Remove the `DropdownMenuSeparator` that renders before the first item (line 43).
- [x] Add `aria-hidden` to the `ListFilter` and `X` icons.
- [~] ~~Test: no leading separator~~ — **not added**: the existing `faceted-filter.test.tsx` mocks `DropdownMenuSeparator` as `() => null`, so a separator assertion isn't observable. Existing suite still passes.

### Task 5: Error copy — stop leaking raw messages (shared component)

**Files:** Modify `src/app/(igrp)/(home)/settings/applications/error.tsx:25`; review `src/components/inline-error.tsx:24`

- [x] In the applications `error.tsx` fallback, replace `message={error.message}` with a recovery-oriented string (e.g. "Tente novamente ou contacte o suporte se o problema persistir.").
- [x] Confirm `console.error(...)` still logs the technical error (already at `error.tsx:16`).
- [x] For `InlineError`: left the component default untouched; passed friendly messages from both callers (`error.tsx` and `app-list.tsx`). The `ApplicationList` inline-error caller was also updated (previously leaked `error.message`).
- [~] Running-app error-state check **not** performed; `console.error` logging confirmed present in `error.tsx`.

### Task 6: Unify empty states + CTA copy

**Files:** Modify `src/features/applications/components/app-list.tsx:44-56,62`, `applications-grid.tsx:51`; optional create `applications-empty-state.tsx`

- [x] Align the grid no-results state (`applications-grid.tsx:51`) styling with the list empty state (same container/muted treatment).
- [x] Change the empty-state CTA label from "Criar Nova Aplicação" (`app-list.tsx:53`) to "Nova Aplicação" to match the header button (`app-list.tsx:62`).
- [x] If cleaner, extract a shared `ApplicationsEmptyState` component; otherwise keep the `emptyState` node and just align styles.
- [~] No test (visual); running-app check with zero apps / no-match search **not** performed.

---

## Phase 3 — Low priority

### Task 7: Form input hygiene

**Files:** Modify `src/features/applications/components/app-form.tsx`

- [x] Add `autoComplete="off"` to `code` (`:184`) and `url` (`:273`) inputs.
- [x] Wrap required-asterisk markers (`:159,:180,:269`) so AT doesn't read "star" (`aria-hidden` on the marker), and mark the field required programmatically.
- [x] Placeholders that read as prompts end with `…`.
- [x] Remove native `required` on RHF-controlled `name`/`code` (`:166,:190`) — confirm zod (`CreateApplicationSchema`/`UpdateApplicationSchema`) covers both before removing.
- [x] No new test (mechanical attributes); run existing app-form/schema tests to confirm no regression.

### Task 8: Extract/drop duplicated hover override

**Files:** Modify `src/features/applications/components/app-card.tsx:83,95,110`

- [x] Decide: drop the override in favor of the design-system ghost hover (preferred if visually acceptable), or extract the repeated string to a module-level constant referenced via `cn(...)`.
- [x] Apply consistently to all three action buttons.
- [x] No test (presentational).

---

## Verification (after each phase)

- [x] `npx tsc --noEmit` — no **new** errors beyond the recorded `__tests__/users/*` baseline (see Test Baseline memory).
- [x] `npx prettier --write` on changed files.
- [x] Run the project's lint (biome) on changed files — clean (one stale suppression comment removed).
- [x] Run the applications + lib test suites — 34 passed (incl. 2 new test files).
- [ ] Manual dev check of the page (loading, empty, no-match, error, light/dark mode, keyboard focus) — **not run** (no dev server started this session).

## Commit Strategy

One commit per task (8 commits + optional Task 0 notes in PR body), each scoped so High-priority a11y/dark-mode fixes can be cherry-picked independently of the Low-priority polish.
