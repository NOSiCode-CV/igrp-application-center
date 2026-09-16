---
timestamp: 2026-09-16T15-55-28Z
slug: src-app-igrp-home
---
# Critique — Home / Workspace surface

Method: dual-agent (A: design review · B: detector + browser evidence)
Target: `src/app/(igrp)/(home)` + `src/features/workspace/`
Register: product (app UI — design serves the task)
Note: no PRODUCT.md in repo; audience/brand intent inferred from code.

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 2 | Every query destructures `data = []` and discards `isPending`/`isError`. No loading, refetching or failure signal after hydration. Greeting flips "Welcome" to "Good afternoon" on mount. |
| 2 | Match System / Real World | 2 | Document title is Portuguese (`src/app/layout.tsx:15`), 100% of the UI is English, no i18n dependency. "Favorites" and "favourites" in one file. |
| 3 | User Control and Freedom | 3 | Favourites reversible with optimistic rollback; no "clear filters" escape when search + favourites-only yield zero. |
| 4 | Consistency and Standards | 1 | Eight hand-rolled button vocabularies, zero design-system components. Grid card and compact card look alike but behave differently. Two competing `@keyframes fadeIn`. |
| 5 | Error Prevention | 2 | `getAppHref()` falls back to `""` and the caller casts `href as Route`, defeating `typedRoutes`. `showStatus()` can return `undefined` -> empty coloured pill. |
| 6 | Recognition Rather Than Recall | 3 | Recents rail and favourites both work; `+N more` roles are a dead `<span>` with no way to see them. |
| 7 | Flexibility and Efficiency | 2 | Header command palette indexes menus only, not applications. No `/` or Cmd+K to search. Recents capped at 8 with no "show more". |
| 8 | Aesthetic and Minimalist Design | 2 | A tab strip with exactly one tab. Type scale inverted: 24px on read-only counters, 16px `<h1>`, 12px uppercase muted on the real content heading. |
| 9 | Error Recovery | 1 | No error UI on this surface at all. Mutations toast; queries do not. Violates AGENTS.md:89. |
| 10 | Help and Documentation | 2 | Both empty states genuinely teach. Nothing explains what "Recommended" ranks by, what the green dot means, or what the counters count. |
| **Total** | | **20/40** | **Acceptable — bottom of band.** |

## Anti-Patterns Verdict

**LLM assessment:** Not slop-by-generation — slop-by-drift. No gradient hero, no display font, no orchestrated entrance. It fails the *product* way: inconsistent component vocabulary. Eight distinct interactive vocabularies on one screen, none from the design system; two hover idioms (`brightness-*` filter vs `bg-accent` token), two focus idioms (`focus:` vs `focus-visible:`), one control with neither.

**Deterministic scan:** `detect.mjs` over both directories — exit 0, zero findings. Repo's own blocking gate `check:ui` — 0 strict, 0 advisory. Assessment B did not take the clean result at face value: it ran four positive controls through the same entrypoint (including a `.tsx` nested under a parenthesised route-group directory, passed as a directory) and confirmed exit 2 is reachable and parenthesised paths traverse correctly. Also confirmed no `.impeccable/config.json` suppressing rules. The green is earned, not a no-op.

**Where they disagree:** they don't. The detector is silent because every finding here is above its altitude — judgment, consistency and state coverage, not raw colour literals or banned utilities. Zero false positives to triage.

**Visual overlays:** not available. `curl` confirms `http://localhost:3000/` returns `307 -> /login`; the route is behind auth and signing in was out of scope, so there is no authenticated document to inject into.

## What's Working

1. **The `-subtle` token layer is real design-system work.** `app-center.css:127-187` defines paired `--x-subtle` / `--x-subtle-foreground` stops with measured ratios in the comments and a stated contract. `app-utils.ts:7-25` then refuses to borrow `--chart-*` for app tiles with a correct argument. Survives re-theming and is verifiable.
2. **Both empty states teach rather than apologise.** The recents rail names what would fill it and offers the action; the favourites state names the literal gesture ("Click the star on any app"). Exactly what the product register asks for.
3. **The stretched-link pattern is right, and unusual.** Link on the app name, stretched with `after:inset-0`, star lifted to `z-10`, `has-[a:focus-visible]:ring-2` on the wrapper — one link in the a11y tree named after the app, rather than a card-sized anchor swallowing the favourite button.

## Priority Issues

### [P1] The surface has no error state at all
**What:** `welcome-banner.tsx:85-88`, `recently-accessed.tsx:82-83`, `app-catalog.tsx:41-42` all destructure `data = []` and discard `isError`/`refetch`. A failed `getCurrentUserApplications()` renders "No applications match your search."
**Why it matters:** The system lies. A broken backend reads as "you have no access" — the one message that sends an internal-portal user to the service desk instead of hitting reload. Violates AGENTS.md:89. The copy is wrong even when genuinely empty: nothing was searched.
**Fix:** Branch three ways at `app-catalog.tsx:204-207` — `isError` -> Alert + retry wired to `refetch()`; `apps.length === 0` -> "You don't have access to any applications yet. Contact your administrator."; filtered-empty -> current copy plus a "Clear search" button resetting `search` and `showFavoritesOnly`. Same for the rail.
**Command:** `$impeccable harden src/features/workspace`

### [P1] Focus invisible on two interactive regions; three text colours fail AA
**What:** Verified independently against the token values:
- `text-ring` as label text = **2.63:1** light / **3.69:1** dark. Fails AA. Used for both KPI labels, the catalogue count, and the search placeholder.
- Favourite star at `text-muted-foreground/50` = **1.65:1**. The only secondary action on every tile.
- `text-muted-foreground` (the repo's own token for this job) = **4.77:1** light / **6.79:1** dark — already passing.
- `app-tile-card.tsx:105,110` — compact card's anchor has `outline-none` with no `focus-visible:` replacement and no wrapper rule, unlike the grid variant. Tabbing the rail moves focus into a hidden-scrollbar container with no visible indication of position.
- `app-catalog.tsx:166,179` — grid/list toggle has no focus style at all (confirmed by grep).
- Active role conveyed by colour + `title` on a non-focusable `<span>`.
**Why it matters:** Internal government portal; AA is typically procurement, not preference. A keyboard-only user cannot navigate the recents rail.
**Fix:** Swap every `text-ring` used as text to `text-muted-foreground`; star likewise. Mirror the grid card's `has-[a:focus-visible]` pattern onto the compact wrapper. Add `focus-visible:ring-2 focus-visible:ring-ring` to the toggle. Give the active role a visible marker plus `aria-label`, not `title`.
**Command:** `$impeccable audit src/features/workspace`

### [P1] Eight hand-rolled button vocabularies; zero design-system components
**What:** `grep IGRPButton|IGRPInputText src/features/workspace/` returns nothing, while the Horizon button/avatar/card components all ship in the package. The sort trigger has no hover state. AGENTS.md:65-66 marks this rule "load-bearing."
**Why it matters:** Every string is a future divergence — when the design system retunes its focus ring or control height, this page won't follow. It is the whole reason the screen reads subtly-off. `check:ui` cannot catch it.
**Fix:** Replace the six buttons with `IGRPButton` variants and the raw `<input>` with `IGRPInputText`. Drop `hover:brightness-95`/`110` — a filter is not a state token and barely renders on `primary-subtle` in light mode.
**Command:** `$impeccable extract src/features/workspace`

### [P2] The single-tab tab bar and the inverted type scale
**What:** `enterprise-workspace.tsx` builds a one-item tab list because "My Tasks" is commented out; the primitive renders the full `TabsList` + `border-b` regardless. Meanwhile `text-2xl` goes to two read-only counters, the `<h1>` is `text-base`, and the real content heading is `text-xs uppercase muted`.
**Why it matters:** ~330px of chrome before the first tile on a laptop, and the eye lands on a number nobody can act on.
**Fix:** Render `<HomeAppsTab />` directly until Tasks ships (keep the `flex-1 min-h-0` scroll chain). Demote the counters to `text-sm`; promote the catalogue heading to `text-sm font-semibold text-foreground`.
**Command:** `$impeccable layout src/features/workspace`

### [P2] "List view" isn't a list, and identical-looking cards behave differently
**What:** The list toggle switches the container to `flex-col` but passes the same non-compact `AppTileCard` — a one-column grid of grid tiles. Separately the compact card has no status badge and no "No launch URL" notice, so a recents card for a URL-less app looks live and silently does nothing.
**Why it matters:** A control the user pays attention cost for and gets nothing from; and the same interaction behaving two ways in two places.
**Fix:** Pass `compact={viewMode === "list"}` and give the compact branch a real row layout, or delete the toggle. Move the no-URL notice out of the compact/grid split.
**Command:** `$impeccable distill src/features/workspace`

## Persona Red Flags

**Alex (power user, 20 apps, three daily)**
- The header command palette indexes `MENU_PAGE`/`EXTERNAL_PAGE`/`SYSTEM_PAGE` — **not applications** (confirmed in `src/lib/header-search.ts:33-37`). The shell's one accelerator cannot reach this page's whole subject.
- No `/` or Cmd+K to the catalogue search; reaching it means mouse or ~10 tab stops.
- "View all applications" `scrollIntoView`s to a section already on screen at desktop width.
- The paging buttons' `after:-inset-1.5` hit areas overlap across their `gap-1.5` gutter — clicking the 6px gap always fires "next", because it is later in the DOM.

**Sam (NVDA + keyboard only)**
- Focus ring vanishes entering the recents rail (`outline-none`, no replacement).
- Grid/list toggle: no focus style, no visible label, two unexplained icons at 200% zoom.
- `text-ring` labels at 2.63:1 and the star at 1.65:1 fail AA outright.
- Active role = colour + `title` on a non-focusable span: meaning by colour alone.
- The `<h1>` is the greeting, so the page announces itself as "Good afternoon, Fidel" rather than "Applications".
- Global `html, body { scrollbar-width: none }` removes the scroll indicator on **every route in the app** to serve one page's aesthetic.

**Riley (stress tester)**
- Kills the network -> "No applications match your search", no error, no retry. Files it as data corruption, because that is what it looks like.
- `status: "PENDING"` -> `showStatus()` returns `undefined` -> empty coloured pill; PENDING/INACTIVE/DELETED collapse to one look.
- App with no `url` and no `slug` -> honest "No launch URL" in the catalogue, silently dead card in the rail. Two answers to one question.
- `slug: "payroll"` -> `href as Route` casts past `typedRoutes`, `<Link>` resolves it relative to the current route -> silent 404.
- Search + Favorites with no matches -> the *favourites* empty state tells him to click a star, while an invisible search filter is what's hiding everything.

## Minor Observations

- **Reduced-motion guard misses the class it should cover.** The hand-written guard lists `.animate-fade-in`; the workspace uses `animate-fadeIn` (different name). What actually saves it is the unrelated global `*` reset in `globals.css:16-24`. Narrow or remove that reset and this becomes a real accessibility regression. Detector-only find — a reviewer reading the targeted guard would conclude it was covered.
- **Two `@keyframes fadeIn`** with different values (`globals.css:53` wins over `app-center.css:202` via import hoisting). Five other feature files get a `translateY` they weren't written for.
- **Loading skeleton doesn't match what loads:** two tab pills vs one, three toolbar controls vs four, `grid-cols-2` from 0px vs `grid-cols-1` below 400px, and no `mx-auto max-w-7xl` — four avoidable layout shifts at the exact moment the user judges how fast the app feels.
- **`bg-muted/10` is invisible** at `page.tsx:12` — indistinguishable from `--background`. The "second neutral layer" the product register asks for doesn't visually exist.
- **Dead code with a live dependency:** `components/tasks/*` and `mock-tasks.ts` are unreferenced, yet `welcome-banner.tsx` imports `getGreeting` from `lib/task-utils.ts`.
- **`+N more` roles are unreachable** — a dead `<span>`. Make it a popover or link to `/profile`.
- **Spelling:** "Favorites" vs "favourites" in the same file.
- **Off-rhythm spacing** (`w-69`, `size-13`, `h-17`, `w-75`) compiles fine under Tailwind v4's dynamic scale but sits off the project's 4/8px rhythm.

## Questions to Consider

1. **Does the welcome banner earn its 110px?** Strip it to a line and the counters become a sentence: "12 applications available - 3 opened this week." What are the avatar, presence dot and badge block for on a page whose only job is launching apps?
2. **Who is the green presence dot telling, and about whom?** It is hardcoded — it never reflects any state. Decoration wearing a state indicator's clothes.
3. **Should "Recently accessed" and "Applications" be two sections, or one grid with recents pinned first?** The mental model is "my apps"; the page splits it into two scroll regions, two card layouts, two interaction contracts, then adds a button to jump between them.
4. **What happens at 40 apps?** No grouping, no pagination, and a sort labelled "Recommended" whose `default` branch ranks nothing. Department is already on the user record — why isn't the catalogue grouped by it?
5. **Why is the tab title Portuguese and the interface English?** Either the audience reads Portuguese and this needs i18n before polish, or `layout.tsx:15` is wrong. Right now the answer is "nobody decided."
6. **Was hiding the document scrollbar globally a decision or a side effect?** One page wanted to read scroll-free; every other route lost its scroll position indicator.
