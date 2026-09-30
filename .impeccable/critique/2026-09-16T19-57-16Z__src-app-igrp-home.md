---
timestamp: 2026-09-16T19-57-16Z
slug: src-app-igrp-home
---
# Critique (re-run) — Home / Workspace surface

Method: dual-agent (A: design review · B: detector + static verification)
Target: `src/app/(igrp)/(home)` + `src/features/workspace/`
Register: product. Judged against `PRODUCT.md` (new since the last run).
Baseline: 20/40, snapshot `2026-09-16T15-55-28Z__src-app-igrp-home.md`

## Design Health Score — 30/40 (was 20/40)

| # | Heuristic | Was | Now | Key remaining issue |
|---|-----------|-----|-----|---------------------|
| 1 | Visibility of System Status | 2 | 3 | No `isPending` anywhere; retry has no busy state; no `aria-live` on filtering. |
| 2 | Match System / Real World | 2 | 3 | `showStatus()` emits raw English enum codes for DELETED/PENDING. |
| 3 | User Control and Freedom | 3 | 3 | View mode and sort reset every visit. |
| 4 | Consistency and Standards | 1 | 3 | Star is first in DOM in grid, last in list; two adjacent toggles use different pressed idioms. |
| 5 | Error Prevention | 2 | 3 | `href as Route` still casts past `typedRoutes`. |
| 6 | Recognition Rather Than Recall | 3 | 3 | Which view is selected is a 1.10:1 wash. |
| 7 | Flexibility and Efficiency | 2 | 3 | Command palette still indexes menus, not applications. |
| 8 | Aesthetic and Minimalist Design | 2 | 3 | `bg-muted/10` still invisible; sr-only h1 duplicates the visible h2. |
| 9 | Error Recovery | 1 | 3 | Raw `error.message` passed to users; roles/departments queries still swallow failure. |
| 10 | Help and Documentation | 2 | 3 | Nothing explains what "Predefinido" orders by, or what the counters count. |
| **Total** | | **20** | **30** | **Good — solid foundation, weak areas named.** |

No heuristic reached 4.

## Anti-patterns verdict

Not slop. The register is now correct and the remaining defects are engineering
defects, not taste defects. No gradient hero, no display type, no glassmorphism,
no emoji, no exclamation mark. The previous central charge — eight hand-rolled
button vocabularies — is verified gone: zero `<button>` and zero `<input>` remain
under `home-apps/`.

Deterministic scan: `detect.mjs` exit 0, zero findings; `check:ui` 0 strict /
0 advisory; `typecheck` clean; workspace tests 37 passing.

**Coverage caveat that the clean result must be read against:** the detector's
registry holds 45 rules, but source-scan mode runs only the 9 regex rules. The
other 36 — `low-contrast`, `tiny-text`, `skipped-heading`, `text-overflow`,
`nested-cards`, the `design-system-*` family — need a rendered DOM and did not
execute. Exit 0 means "no regex-detectable tells", not "clean". The login wall
is what blocks the rest.

## Verified fixed (static sweep, file:line evidence)

- No `text-ring` remains as a text colour anywhere on the surface.
- Every `outline-none` is paired with a `focus-visible:` replacement or a
  `has-[a:focus-visible]` wrapper rule, in both card variants.
- No hand-rolled controls; all design-system components.
- `loading.tsx` matches the real layout character-for-character on container
  max-width, toolbar control count, grid breakpoints and the absent tab strip.
- Reduced-motion guard covers the only animation class in use, twice.
- Global `html, body { scrollbar-width: none }` is gone; what remains is opt-in.
- The `/` handler cannot swallow the key while typing in an input.

## Priority issues

### [P1] Every status badge fails AA in light mode, using the idiom this repo's own CSS contract forbids

Measured on `--card` (white), light theme:

| Class | Ratio | Needs |
|---|---|---|
| `.status-inactive` | 4.35:1 | 4.5:1 |
| `.status-active` | 4.35:1 | 4.5:1 |
| `.status-deleted` | 4.39:1 | 4.5:1 |
| `.status-pending` | 1.97:1 | 4.5:1 |

`app-center.css:266-280` defines them as `bg-x/15 text-x` — the exact pattern the
same file argues against at lines 127-136 ("a token over a 15% wash of itself has
a contrast ratio that is a pure function of the token's lightness, so it cannot
be validated"). The `-subtle` pairs that fix it already exist and are already used
for the "Nova" badge two lines away in `app-tile-card.tsx` at 6.66:1.

PRODUCT.md makes AA contractual and merge-blocking. These are used app-wide, not
only here.

**Fix:** rewrite `.status-*` in terms of the subtle pairs. `statusClass` keeps its
signature; no component changes.

### [P1] Focus rings are invisible in light mode — 1.45:1

- Design-system default `focus-visible:ring-ring/50` → **1.45:1** on white.
- Custom `focus-visible:ring-2 focus-visible:ring-ring` (solid) → **2.63:1**.

WCAG 2.1 §1.4.11 requires 3:1 for non-text indicators. This applies to the card
focus rings, the toolbar controls and the `+N mais` link.

This is a **regression in detectability, not in behaviour**: the previous critique
found "no focus style at all" on two regions. There is now a focus style
everywhere — drawn in a colour you cannot see. A reviewer grepping for
`focus-visible:` will find hits and conclude it is closed.

Decision needed: override `--ring` locally (diverges from the design system) or
file upstream and ship an AA failure meanwhile.

### [P1] The view toggle's selected state is a 1.10:1 wash

`ToggleGroup` takes the design-system default `data-[state=on]:bg-accent`.
`--accent` against `--card` is **1.10:1** — the selected item is nearly
indistinguishable from the unselected one.

The sibling "Favoritos" `Toggle` got a bespoke `data-[state=on]:bg-warning-subtle`
override and reads clearly. Two adjacent toggles, two answers to "what does
pressed look like" — the inconsistency the design-system migration was meant to
remove.

**Fix:** give the `ToggleGroupItem`s the same treatment with
`data-[state=on]:bg-primary-subtle data-[state=on]:text-primary-subtle-foreground`
(6.35:1, already defined).

### [P1] The favourite star: 28px target, and "on" is less visible than "off"

`size="icon-sm"` is 28×28px, against PRODUCT.md's own ~44px rule. And the
favourited state (`--warning`, **2.15:1**) is *half as visible* as the
unfavourited one (`--muted-foreground`, **4.77:1**) in light mode. Dark mode is
fine at 10.39:1 — this is a light-mode-only inversion, and it is the only
per-card action on the page.

Note: this was a deliberate trade made earlier in the session — the brighter amber
was chosen to match dark mode on request. PRODUCT.md's contractual AA now
overrides that preference.

### [P2] Filtering is silent to assistive technology

No `aria-live` anywhere on the surface. A screen-reader user presses `/`, types
three letters, and the grid silently goes from 24 cards to 2 with no announcement.
The `/`-then-type path this redesign deliberately built is the one path that works
for nobody using a screen reader. `InlineError` has `role="alert"`, so failures
announce correctly — the gap is filtering, not failure.

### [P2] Grid cards put the favourite button before the app name in tab order

Star is the first DOM child in grid (`app-tile-card.tsx:162`), last in compact
(`:144`). Tabbing a 24-app grid hits the secondary action before every app name,
and the order reverses when the user switches views. Visual order and focus order
disagree (WCAG 2.4.3). The star is already absolutely positioned, so DOM order is
free to change.

## Smaller defects found this run

- `scrollToCatalog` (`recently-accessed.tsx:26`) hardcodes `behavior: "smooth"`
  while its sibling `scrollByPage` routes through the reduced-motion helper. An
  explicit `behavior` overrides the CSS reset, so it animates for users who asked
  it not to. One-word fix.
- Raw `error?.message` is rendered to users in two places — a network failure puts
  the browser's English "Failed to fetch" inside an otherwise Portuguese alert.
- The `/` handler does not guard `HTMLSelectElement` or an open Radix menu:
  opening the sort dropdown and typing `/` yanks focus into the search box and
  suppresses Radix typeahead.
- External-app tiles get `target="_blank"` with no new-window warning in the
  accessible name.
- `getLastOpenedLabel` returns "Aberta recentemente" for a missing timestamp —
  asserting something the system does not know, against PRODUCT.md principle 2.
- "Abertas esta semana" counts the last 7 days, not the calendar week.
- `"Aberta segunda-feira"` is missing its preposition — pt-PT reads "Aberta na
  segunda-feira".
- `getDueDateLabel` in `task-utils.ts` is still English, and `welcome-banner.tsx`
  imports `getGreeting` from that same otherwise-dead module.
- `enterprise-workspace.tsx:41` carries English copy in the commented-out Tasks
  tab, which ships untranslated the moment it is uncommented.
- The sr-only `h1` duplicates the visible `h2`; both say "Aplicações".
- Neither `<section>` has an accessible name, so neither appears in landmark
  navigation.

## Corrections to the assessments

- Assessment A reported `.status-active` at 4.01:1 and `.status-deleted` at
  3.99:1. Measured: 4.35:1 and 4.39:1. Both still fail 4.5:1, so the finding
  stands, but the numbers were slightly pessimistic.
- Assessment A implied the toggle's on-state *text* is unreadable. Measured,
  `--accent-foreground` on `--accent` is 16.28:1 — the icons are perfectly
  legible. The defect is the 1.10:1 background wash that distinguishes selected
  from unselected, not the foreground.
- Assessment B flagged the `/` hint `<kbd>` as taught-but-unpressable for mobile
  screen-reader users. It is `hidden sm:inline-block`; `hidden` is `display: none`,
  which removes the element from the accessibility tree entirely below `sm`.
  False positive.

## Regression watch

1. The focus-state fix moved the defect rather than removing it (see P1 above).
2. Moving the view toggle onto `ToggleGroup` traded a visible selected state for
   an invisible one.
3. The compact card now renders the status badge — correct in itself, but it
   roughly doubles the occurrence of the sub-4.5:1 badge.
4. The `/` shortcut installs a document-level handler that overrides Firefox's
   quick-find and interferes with open Radix menus.

## Open questions

1. What are the two banner counters for? They were demoted, not answered.
2. Why does a launcher for someone with 12 apps have a sort control?
3. The design system's focus ring is 1.45:1 in light mode. Whose bug is that —
   local override, or upstream fix?
4. Should "Acedidas recentemente" be a section, or the first four cards of the
   catalogue?
5. Why does only the catalogue get four-branch state handling, when the banner's
   three queries still swallow failure into rendered-nothing?
