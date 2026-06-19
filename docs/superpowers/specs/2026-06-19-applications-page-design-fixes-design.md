# Applications Settings Page — Design & A11y Fixes — Design

**Status:** Draft
**Date:** 2026-06-19
**Author:** Fidel da Luz (with Claude)
**Scope:** `src/app/(igrp)/(home)/settings/applications/*` and the `src/features/applications` components it renders, plus two shared components (`loading`, `faceted-filter`) and one shared util (`getStatusColor`).

## Goal

Apply a focused round of accessibility, dark-mode, and consistency fixes to the Applications settings page, surfaced by a three-lens review (Web Interface Guidelines, shadcn patterns, frontend-design). No new features and no architectural changes — the data layer (`use-applications`, `prefetch`, server actions) is untouched. This is polish on the existing card-grid + dialog flow.

## Non-Goals

- No virtualization of the grid (the application list is realistically small; `useDeferredValue` + `useMemo` already cover filtering perf).
- No redesign of the card layout, toolbar layout, or dialog form fields.
- No change to the create/edit/update behavior or schemas (covered by the prior review's correctness fixes).
- No change to shared components beyond the two named below; `getStatusColor` is shared, so its change is validated against all call sites, not just applications.

## Context

The page uses IGRP's design-system wrappers (`@igrp/igrp-framework-react-design-system`), not raw shadcn/ui. Where IGRP provides a primitive (Form, Badge, DropdownMenu), we compose it; we do **not** introduce raw shadcn `Empty`/`Skeleton`/`Field` components unless IGRP lacks an equivalent. Task 0 verifies which primitives are available before implementation.

## Files

**Modify**

- `src/components/loading.tsx` — add live-region semantics + reduced-motion guard to the spinner.
- `src/lib/utilities.ts` — fix `getStatusColor` so INACTIVE uses a semantic, dark-mode-safe treatment (not raw `bg-amber-100 text-amber-800`).
- `src/features/applications/components/applications-toolbar.tsx` — accessible name on the search input; `aria-hidden` on the decorative icon; ellipsis + spellcheck.
- `src/features/applications/components/applications-grid.tsx` — align the no-results empty state with the list empty state.
- `src/features/applications/components/app-list.tsx` — unify CTA copy; extract the empty state to share with the grid.
- `src/components/data-table/faceted-filter.tsx` — remove the stray leading separator; `aria-hidden` on decorative icons.
- `src/features/applications/components/app-form.tsx` — `autoComplete`/`spellCheck` on inputs; `aria-hidden` on the required-asterisk markers; placeholder ellipsis; remove native `required` that competes with zod.
- `src/features/applications/components/app-card.tsx` — extract the duplicated hover-override className to a shared constant (or drop in favor of the built-in ghost hover).
- `src/app/(igrp)/(home)/settings/applications/error.tsx` & `src/components/inline-error.tsx` — stop surfacing raw `error.message`; show a recovery hint and log the technical message.

**Create**

- (Optional, Task 6) `src/features/applications/components/applications-empty-state.tsx` — single shared empty-state component used by both `app-list` and `applications-grid`, if extraction is cleaner than prop-passing.

## Changes by Priority

### Task 0 — Verify IGRP primitives (no code)

Confirm whether the IGRP design system exports an `Empty`/`EmptyState` component, a `Skeleton`, and a status `Badge` variant. Record findings; they decide whether Tasks 1 and 6 use an IGRP primitive or keep the current custom markup with token fixes.

### High

**Task 1 — `loading.tsx` accessibility + reduced motion** (`src/components/loading.tsx:5,10`)
- Wrap the spinner container with `role="status"` and `aria-live="polite"`; render the description as the live text (keep visible).
- Mark the spinner icon `aria-hidden`.
- Guard the spin animation: `motion-safe:animate-spin` (or equivalent) so `prefers-reduced-motion` users don't see it spin.
- Caller text "Carregando aplicações…" uses a real ellipsis `…`.
- Shared component — verify no other caller regresses (it's already a generic loader).

**Task 2 — Search input accessible name** (`src/features/applications/components/applications-toolbar.tsx:26,31,33`)
- Add `aria-label="Pesquisar aplicações"` to the search `Input` (placeholder is not an accessible name).
- Add `aria-hidden` to the decorative Search `IGRPIcon` (verify `IGRPIcon` forwards the attribute; if not, wrap in a `<span aria-hidden>`).
- `spellCheck={false}` on the search field; placeholder ends with `…`.

**Task 3 — Status color: fix INACTIVE** (`src/lib/utilities.ts:3-5`)
- `getStatusColor` currently returns `"bg-amber-100 text-amber-800"` for non-ACTIVE — raw palette, no `dark:`, and amber reads as a *warning* rather than a neutral "off."
- Replace with a semantic, dark-mode-safe treatment consistent with the ACTIVE `status-active` class (e.g. a `status-inactive` token class, or `Badge variant="secondary"` semantics). Define the token in `src/styles/globals.css` alongside `status-active` if a class is used.
- **Shared util:** grep call sites (`app-card.tsx:66`, `resource-manage-modal.tsx:216`, others) and confirm the new treatment reads correctly everywhere before landing.

### Medium

**Task 4 — Faceted filter stray separator** (`src/components/data-table/faceted-filter.tsx:43,38,66`)
- Remove the `DropdownMenuSeparator` that renders as the first child before any item.
- `aria-hidden` on the `ListFilter` and `X` decorative icons.

**Task 5 — Error copy: stop leaking raw messages** (`src/app/(igrp)/(home)/settings/applications/error.tsx:25`, `src/components/inline-error.tsx:24`)
- In the applications `error.tsx` fallback and `InlineError`, render a recovery-oriented message in the interface's voice (e.g. "Tente novamente ou contacte o suporte se o problema persistir.") instead of `error.message`.
- Keep `console.error` logging the technical error (already present in `error.tsx`).
- `InlineError` is shared: change its default copy carefully or pass an applications-specific message from the caller rather than altering the component default. Decide during implementation; prefer caller-supplied message to avoid regressing other usages.

**Task 6 — Unify empty states + CTA copy** (`src/features/applications/components/app-list.tsx:44-56,62`, `applications-grid.tsx:51`)
- The list empty state (bordered box + CTA) and the grid no-results state (plain centered text) diverge. Make them visually consistent — same container treatment, same muted styling.
- Unify the CTA label: header button says "Nova Aplicação" (`app-list.tsx:62`) while the empty-state button says "Criar Nova Aplicação" (`app-list.tsx:53`). Pick **one** label ("Nova Aplicação") and use it in both places (WIG: an action keeps its name through the whole flow).
- If a shared `ApplicationsEmptyState` component is cleaner than threading nodes, create it (see Files → Create); otherwise keep the existing `emptyState` node pattern and just align the styles.

### Low

**Task 7 — Form input hygiene** (`src/features/applications/components/app-form.tsx`)
- `autoComplete="off"` on `code` and `url` inputs (`:184,:273`); inputs need `autocomplete` + meaningful `name` (RHF supplies `name`).
- Wrap the required-asterisk markers (`after:content-["*"]` at `:159,:180,:269`) in `aria-hidden`, or apply via `aria-hidden` span so AT doesn't read "star"; mark the field required programmatically instead.
- Placeholders end with `…` where they read as prompts.
- Remove native `required` on the RHF-controlled `name`/`code` inputs (`:166,:190`) — zod owns validation; the duplicate triggers native browser validation UI that conflicts.

**Task 8 — Extract duplicated hover override** (`src/features/applications/components/app-card.tsx:83,95,110`)
- The string `hover:bg-primary/90 hover:text-primary-foreground/90 dark:hover:text-accent-foreground dark:hover:bg-accent/50` is repeated on three ghost buttons and overrides component-owned colors.
- Either extract to a module-level constant in `app-card.tsx` referenced via `cn(...)`, or drop it in favor of the design system's built-in ghost hover. Prefer dropping if the built-in hover is acceptable visually; otherwise extract.

## Testing

This repo's existing applications tests focus on behavior (hooks, schema, filtering), not className/a11y attributes. Add targeted assertions only where the change is observable and non-mechanical:

**Add**

- `applications-toolbar` test: search input exposes an accessible name (`getByRole("searchbox", { name: /pesquisar/i })` or `getByLabelText`).
- `getStatusColor` unit test: INACTIVE returns the semantic class/treatment (not the raw amber string), ACTIVE unchanged.
- `faceted-filter` test: opening the menu renders no leading separator before the first checkbox item.

**Not tested**

- `aria-hidden` on decorative icons, placeholder ellipsis, `autoComplete` attributes (mechanical attribute additions).
- Reduced-motion class on the spinner (CSS-media-query behavior; not unit-testable meaningfully).
- Empty-state visual alignment and CTA copy unification (visual; covered by manual/dev check).

**Verify against baseline:** the recorded `__tests__/users/*` failures are pre-existing (see Test Baseline memory) and out of scope; confirm no *new* failures in applications.

## Error Handling

- `loading.tsx` and `faceted-filter.tsx` changes are presentational — no new error paths.
- `getStatusColor` keeps its total function shape (always returns a class string); only the INACTIVE branch's value changes.
- Error-copy change (Task 5) preserves the existing `StatusAwareError` → `InlineError` fallback chain; only the human-facing string and the leaked technical detail change.

## Risks & Mitigations

| Risk | Mitigation |
|---|---|
| `getStatusColor` is shared; changing INACTIVE could regress permissions/resource badges | Task 3 enumerates call sites and validates each; the new token mirrors `status-active`'s semantics. |
| `IGRPIcon` may not forward `aria-hidden` | Task 2/4 wrap decorative icons in `<span aria-hidden>` if the prop isn't forwarded. |
| Editing `InlineError` defaults could change copy elsewhere | Prefer caller-supplied message; only touch the default if all callers agree. |
| Removing native `required` could drop a validation layer if zod isn't wired for that field | `app-form` already uses `zodResolver` with `CreateApplicationSchema`/`UpdateApplicationSchema`; zod covers `name`/`code`. Confirm before removal. |
| No IGRP `Empty`/`Skeleton` primitive exists | Task 0 decides; fall back to token-fixed custom markup (no raw shadcn import). |

## Out of Scope

- Grid virtualization and any data-fetching changes.
- Card layout / dialog form-field redesign.
- The INTERNAL-app "Abrir" external-link semantics (flagged in the prior correctness review; tracked separately).
- Replacing the toast pattern or the `StatusAwareError` architecture.
- Broader design-system token work beyond adding a status-inactive token next to status-active.
