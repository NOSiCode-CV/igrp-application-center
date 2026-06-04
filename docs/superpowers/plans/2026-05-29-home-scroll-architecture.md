# Home Launcher — Viewport-Locked Scroll Architecture Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace document-level page scroll on the home launcher with a contained, viewport-locked inner scroll where the hero scrolls away and the search row becomes sticky at the top of the scroll viewport.

**Architecture:** A single `ScrollViewport` div with native `overflow-y-auto` contains the hero, a 1px sentinel, the sticky search row, and the two-column card body. The home page wrapper is `max-h`-locked to a CSS variable (`--home-scroll-h`) so the document body doesn't scroll. An `IntersectionObserver` watches the sentinel to toggle the search row between "at rest" (transparent) and "stuck" (opaque + bottom border) visual states.

**Tech Stack:** React 19, Next.js 15, Tailwind v4 (with `100dvh` + `var()`), native `IntersectionObserver`. No new dependencies.

**Spec:** [`docs/superpowers/specs/2026-05-29-home-scroll-architecture-design.md`](../specs/2026-05-29-home-scroll-architecture-design.md)

**Testing approach:** Layout/CSS work has no meaningful unit tests — behavior depends on browser layout. Each task ends with a **manual verification** step (specific user actions + expected behavior). Run `pnpm dev` once before Task 1 and keep it running; verify in the browser between tasks.

---

## Task 1: Add CSS variable + scroll viewport styling

**Files:**
- Modify: `src/styles/globals.css`

- [ ] **Step 1: Add the `--home-scroll-h` variable to `:root`**

Open `src/styles/globals.css`. Find the existing `:root { ... }` block (search for "Success colors" comment around line 75 to find it). Add the new variable at the end of the block, just before the closing brace:

```css
  /* Home launcher viewport-fit height.
   * 100dvh — IGRP header (~4rem) — framework p-4 wrapper top padding (1rem).
   * Adjust the rem value here if the framework header height changes. */
  --home-scroll-h: calc(100dvh - 5rem);
```

- [ ] **Step 2: Add the `.home-scroll-viewport` class for native scrollbar styling**

In the same file, find the "Custom utility classes" comment (around line 255) and add after the existing utility classes:

```css
.home-scroll-viewport {
  scrollbar-width: thin;
  scrollbar-color: var(--border) transparent;
}
.home-scroll-viewport::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}
.home-scroll-viewport::-webkit-scrollbar-thumb {
  background: var(--border);
  border-radius: 4px;
}
.home-scroll-viewport::-webkit-scrollbar-track {
  background: transparent;
}
```

- [ ] **Step 3: Lint**

Run: `pnpm biome check src/styles/globals.css`
Expected: `Checked 1 file ... No fixes applied.`

- [ ] **Step 4: Manual verification**

Open the browser DevTools console on the home page and run:
```js
getComputedStyle(document.documentElement).getPropertyValue('--home-scroll-h')
```
Expected: a `calc(...)` string resolving to a positive pixel value (~720-900px depending on your viewport).

- [ ] **Step 5: Commit**

```bash
git add src/styles/globals.css
git commit -m "$(cat <<'EOF'
feat(home): add scroll-viewport CSS scaffolding

Adds --home-scroll-h variable (100dvh - IGRP header - framework padding)
and .home-scroll-viewport class for the native scrollbar styling on the
upcoming launcher scroll container.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: Revert HomeLayout container

**Files:**
- Modify: `src/app/(igrp)/(home)/layout.tsx`

The earlier `h-full flex flex-col min-h-0` was a failed attempt at height propagation. It now affects every home route (settings, profile). Restore the original simple container.

- [ ] **Step 1: Revert the container className**

Open `src/app/(igrp)/(home)/layout.tsx`. Find the JSX returning `<IGRPLayoutFull>`. Replace the children wrapper line.

Before:
```tsx
<div className="container mx-auto max-w-7xl h-full flex flex-col min-h-0">
  {children}
</div>
```

After:
```tsx
<div className="container mx-auto max-w-7xl">{children}</div>
```

- [ ] **Step 2: Lint**

Run: `pnpm biome check "src/app/(igrp)/(home)/layout.tsx"`
Expected: `Checked 1 file ... No fixes applied.`

- [ ] **Step 3: Manual verification**

Navigate to `/settings/applications` and `/profile` (any home child route). Both should render exactly as before — no layout shift, no broken sizing. The home launcher will still look weird until later tasks; that's expected.

- [ ] **Step 4: Commit**

```bash
git add "src/app/(igrp)/(home)/layout.tsx"
git commit -m "$(cat <<'EOF'
refactor(home): revert HomeLayout container to plain max-w wrapper

Reverts the h-full/flex/min-h-0 layout-level changes. Height locking
moves to the home route's page.tsx so it doesn't affect sibling routes.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: Lock the home page wrapper to viewport height

**Files:**
- Modify: `src/app/(igrp)/(home)/page.tsx`

- [ ] **Step 1: Update the page wrapper className**

Open `src/app/(igrp)/(home)/page.tsx`. Replace the `<div>` wrapper inside `HydrationBoundary`.

Before:
```tsx
<div className="flex-1 min-h-0 flex flex-col p-6">
  <ApplicationsListHome />
</div>
```

After:
```tsx
<div className="max-h-[var(--home-scroll-h)] overflow-hidden flex flex-col">
  <ApplicationsListHome />
</div>
```

The `p-6` padding is removed — it will move inside the ScrollViewport in Task 4 so it scrolls with content rather than clipping the scrollbar.

- [ ] **Step 2: Lint + typecheck**

Run: `pnpm biome check "src/app/(igrp)/(home)/page.tsx"`
Expected: `Checked 1 file ... No fixes applied.`

Run: `pnpm typecheck 2>&1 | grep page.tsx`
Expected: no output (no errors).

- [ ] **Step 3: Manual verification**

Reload the home page. The card grid below the hero will look squashed / clipped — that's expected and resolves in Task 4. What we want to verify here: there is **no document-level scrollbar** on the right edge of the browser. Page content may be cut off at the bottom (no scroll yet), but the right scrollbar should be gone.

- [ ] **Step 4: Commit**

```bash
git add "src/app/(igrp)/(home)/page.tsx"
git commit -m "$(cat <<'EOF'
feat(home): lock page wrapper to viewport height

Caps the home page wrapper to var(--home-scroll-h) with overflow-hidden,
removing the document scrollbar. The internal ScrollViewport (next task)
will provide the actual scroll area.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: Restructure ApplicationsListHome root + add ScrollViewport

**Files:**
- Modify: `src/features/applications/components/app-list-home.tsx`

The component's outer JSX currently wraps everything in a single `flex flex-col gap-6 flex-1 min-h-0` div with an inner Apps `<section>` that has its own `flex-1 min-h-0`. We're flattening that to: outer flex column → inner ScrollViewport that owns the scroll → everything else inside the viewport.

- [ ] **Step 1: Locate the root return statement**

Open `src/features/applications/components/app-list-home.tsx`. Find the `return (` inside `ApplicationsListHome()` — it currently starts with:
```tsx
return (
  <div className="flex flex-col gap-6 flex-1 min-h-0">
    <CommandPalette ... />
    <header ...>
```

- [ ] **Step 2: Replace the outer div + wrap content in a ScrollViewport**

Replace the entire outer `<div>` opening and the structure inside it. The new structure is:

```tsx
return (
  <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
    <CommandPalette
      open={paletteOpen}
      onOpenChange={setPaletteOpen}
      applications={visibleApps}
      favoriteIds={favoriteIds}
      recentIds={recentIds}
    />

    <div className="home-scroll-viewport flex-1 min-h-0 overflow-y-auto px-6 py-6">
      {/* Sentinel — 1px element above the sticky row. When this leaves
          the viewport (user scrolled past), we know the sticky row is
          actually stuck. Set up in Task 5. */}
      <div aria-hidden className="h-px" />

      {/* Hero — moves here from outside; same JSX as before. */}
      <header className="relative overflow-hidden rounded-2xl border border-border/60 bg-card p-5 md:p-6">
        {/* ... existing hero content unchanged ... */}
      </header>

      {/* Apps section content — search button + body */}
      <section className="flex flex-col gap-6 mt-6">
        {/* search button — Task 6 will add sticky classes */}
        <button
          ref={searchWrapperRef}
          type="button"
          onClick={() => setPaletteOpen(true)}
          aria-label="Abrir paleta de comandos para pesquisar aplicações"
          className="group relative w-full sm:w-80 md:w-96 h-10 shrink-0 flex items-center gap-2 rounded-md border border-border bg-card pl-3 pr-2 text-sm text-muted-foreground hover:border-primary/40 hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 transition-colors cursor-pointer"
        >
          {/* ... existing search button content unchanged ... */}
        </button>

        {/* Body (isLoading / empty / two-column) — keep existing structure, but
            remove the inner `<div className="flex-1 min-h-0 overflow-y-auto ...">`
            wrapper that the previous attempt added around it. The ScrollViewport
            above is now the single scroll context. */}
        {isLoading ? (
          <GridSkeleton />
        ) : !applications || applications.length === 0 ? (
          <AppCenterNotFound iconName="AppWindow" title="Nenhuma aplicação encontrada.">
            Parece que você ainda não tem aplicações disponíveis.
          </AppCenterNotFound>
        ) : (
          <div className="flex flex-col lg:flex-row gap-8">
            {/* ... existing two-column body unchanged ... */}
          </div>
        )}
      </section>
    </div>
  </div>
);
```

**Key changes from current state:**
- Outer `<div>`: `flex flex-col gap-6 flex-1 min-h-0` → `flex flex-col flex-1 min-h-0 overflow-hidden` (drop `gap-6`, add `overflow-hidden`).
- New wrapper `<div className="home-scroll-viewport flex-1 min-h-0 overflow-y-auto px-6 py-6">` becomes the ScrollViewport.
- The previous inner `<div className="flex-1 min-h-0 overflow-y-auto -mx-2 px-2 pb-4">` wrapper around the `{isLoading ? ... : ...}` ternary is **removed**.
- The Apps `<section>` loses `flex-1 min-h-0` (no longer needed) and gains `mt-6` for spacing below the hero.
- Hero moves *inside* the ScrollViewport (was outside, sibling of section).
- A new 1px sentinel `<div aria-hidden className="h-px" />` sits at the top of the ScrollViewport. It's referenced in Task 5.

**Don't rewrite the inner content** of the hero, search button, or body — only their wrappers change. Preserve all classes and children of those inner blocks exactly as they exist today.

- [ ] **Step 3: Lint + typecheck**

Run: `pnpm biome check src/features/applications/components/app-list-home.tsx`
Expected: `Checked 1 file ...` and either 0 fixes or only whitespace-style autofixes.

Run: `pnpm typecheck 2>&1 | grep app-list-home`
Expected: no output (no errors).

- [ ] **Step 4: Manual verification**

Reload the home page.
- Hero is visible at top.
- Search button visible below the hero.
- Card grids render below the search.
- Scrolling with the mouse wheel should scroll the inner ScrollViewport — the document body does **not** scroll (no document scrollbar on the right edge).
- The scrollbar appears on the right edge of the ScrollViewport area only (it has the thin, branded styling from Task 1).
- Hero scrolls **out of view** as you scroll down.
- Search row scrolls along with the hero — it does **not** stick yet (we wire that in Tasks 5 and 6).

If hero stays anchored and doesn't scroll, you've left it outside the ScrollViewport — check the JSX hierarchy.

- [ ] **Step 5: Commit**

```bash
git add src/features/applications/components/app-list-home.tsx
git commit -m "$(cat <<'EOF'
feat(home): wrap launcher content in single ScrollViewport

Restructures ApplicationsListHome so hero, search, and card body share
one inner scroll container (overflow-y-auto). Hero now scrolls with
content; the previous separate body-scroll wrapper is removed.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Task 5: Add sentinel ref + IntersectionObserver for `isStuck` state

**Files:**
- Modify: `src/features/applications/components/app-list-home.tsx`

- [ ] **Step 1: Add refs and `isStuck` state at the top of `ApplicationsListHome`**

Find the existing `useRef<HTMLButtonElement>(null)` line for `searchWrapperRef` and add two new refs + a state hook nearby:

```tsx
const searchWrapperRef = useRef<HTMLButtonElement>(null);
const scrollRef = useRef<HTMLDivElement>(null);
const sentinelRef = useRef<HTMLDivElement>(null);
const [isStuck, setIsStuck] = useState(false);
```

- [ ] **Step 2: Add the IntersectionObserver effect**

Add this `useEffect` near the other effects (next to the localStorage ones is fine):

```tsx
// Toggle isStuck based on whether the sentinel (1px element above the
// sticky search row) is still visible inside the ScrollViewport. When
// the sentinel scrolls out of view, the search row is stuck at top-0.
useEffect(() => {
  const sentinel = sentinelRef.current;
  const root = scrollRef.current;
  if (!sentinel || !root) return;
  const observer = new IntersectionObserver(
    ([entry]) => setIsStuck(!entry.isIntersecting),
    { root, threshold: 0 },
  );
  observer.observe(sentinel);
  return () => observer.disconnect();
}, []);
```

- [ ] **Step 3: Wire refs into the JSX**

In the JSX, attach `scrollRef` to the ScrollViewport div and `sentinelRef` to the 1px sentinel.

Before:
```tsx
<div className="home-scroll-viewport flex-1 min-h-0 overflow-y-auto px-6 py-6">
  <div aria-hidden className="h-px" />
```

After:
```tsx
<div
  ref={scrollRef}
  className="home-scroll-viewport flex-1 min-h-0 overflow-y-auto px-6 py-6"
>
  <div ref={sentinelRef} aria-hidden className="h-px" />
```

- [ ] **Step 4: Lint + typecheck**

Run: `pnpm biome check src/features/applications/components/app-list-home.tsx`
Expected: clean.

Run: `pnpm typecheck 2>&1 | grep app-list-home`
Expected: no output.

- [ ] **Step 5: Manual verification (with DevTools)**

Open the home page. Open React DevTools (or browser console). Inspect the ApplicationsListHome component state.
- At scroll position 0: `isStuck` should be `false`.
- Scroll down past the hero (~250px or so): `isStuck` should flip to `true`.
- Scroll back up: `isStuck` should flip back to `false`.

If you don't have React DevTools handy, add a temporary `console.log(isStuck)` inside the component body — verify in the console, then remove.

No visual changes yet — that's Task 6.

- [ ] **Step 6: Commit**

```bash
git add src/features/applications/components/app-list-home.tsx
git commit -m "$(cat <<'EOF'
feat(home): track sticky state via IntersectionObserver sentinel

Adds a 1px sentinel above the search row and an IntersectionObserver
that toggles isStuck when the sentinel leaves the ScrollViewport.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Task 6: Apply sticky classes + isStuck visual states to the search row

**Files:**
- Modify: `src/features/applications/components/app-list-home.tsx`

We're wrapping the existing search `<button>` in a `<div>` that owns the sticky positioning and the two visual states. The button itself doesn't need to change — wrapping keeps the button's existing focus/hover styles intact.

- [ ] **Step 1: Wrap the search button in a sticky container**

Find the search button (it has `aria-label="Abrir paleta de comandos para pesquisar aplicações"`). Wrap it inside a new `<div>` and remove the button's `shrink-0` (it's no longer in a flex layout where shrink matters).

Before:
```tsx
<button
  ref={searchWrapperRef}
  type="button"
  onClick={() => setPaletteOpen(true)}
  aria-label="Abrir paleta de comandos para pesquisar aplicações"
  className="group relative w-full sm:w-80 md:w-96 h-10 shrink-0 flex items-center gap-2 rounded-md border border-border bg-card pl-3 pr-2 text-sm text-muted-foreground hover:border-primary/40 hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 transition-colors cursor-pointer"
>
  {/* ... button content ... */}
</button>
```

After:
```tsx
<div
  className={`sticky top-0 z-20 -mx-6 px-6 py-3 transition-colors ${
    isStuck
      ? "bg-background/90 backdrop-blur-sm border-b border-border"
      : "bg-transparent border-b border-transparent"
  }`}
>
  <button
    ref={searchWrapperRef}
    type="button"
    onClick={() => setPaletteOpen(true)}
    aria-label="Abrir paleta de comandos para pesquisar aplicações"
    className="group relative w-full sm:w-80 md:w-96 h-10 flex items-center gap-2 rounded-md border border-border bg-card pl-3 pr-2 text-sm text-muted-foreground hover:border-primary/40 hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 transition-colors cursor-pointer"
  >
    {/* ... button content (unchanged) ... */}
  </button>
</div>
```

**What the wrapper does:**
- `sticky top-0 z-20`: sticks to the top of the ScrollViewport, sits above other content.
- `-mx-6 px-6`: spans the ScrollViewport edge-to-edge (the ScrollViewport has `px-6`; negative margins cancel it, padding re-adds it inside).
- `py-3`: vertical breathing room around the button.
- `transition-colors`: animates between the two visual states.
- Conditional classes from `isStuck` swap background and border.

- [ ] **Step 2: Lint + typecheck**

Run: `pnpm biome check src/features/applications/components/app-list-home.tsx`
Expected: clean (possibly minor format autofix).

Run: `pnpm typecheck 2>&1 | grep app-list-home`
Expected: no output.

- [ ] **Step 3: Manual verification**

Reload the page.
- At scroll position 0: search row sits in normal flow (transparent background, no border below it).
- Scroll down: hero scrolls up; **search row reaches the top and sticks**; background becomes semi-opaque + a bottom border appears.
- Cards continue scrolling under the sticky search row.
- Scroll back to top: search row unsticks; background returns to transparent.

If the search row doesn't stick: verify the parent ScrollViewport has `overflow-y-auto`, not `overflow-hidden`, and that no intermediate parent has `overflow: hidden` that breaks sticky.

If the search row clips at the edges: the negative margins (`-mx-6`) don't match the ScrollViewport padding (`px-6`). Make sure both are `6`.

- [ ] **Step 4: Commit**

```bash
git add src/features/applications/components/app-list-home.tsx
git commit -m "$(cat <<'EOF'
feat(home): sticky search row with at-rest and stuck visual states

Wraps the search button in a sticky-top container that swaps between
transparent (at rest) and opaque-with-border (stuck) based on isStuck.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Task 7: Update Favoritos sidebar top offset

**Files:**
- Modify: `src/features/applications/components/app-list-home.tsx`

The Favoritos sidebar currently sticks at `lg:top-6` (24px). With the sticky search row above it, it needs to clear the search row's effective stuck height plus a breathing gap.

- [ ] **Step 1: Find the Favoritos `<aside>` element**

Search for `<aside ` inside `app-list-home.tsx`. It currently has:
```tsx
<aside
  className="w-full lg:w-72 xl:w-80 shrink-0 lg:sticky lg:top-6 lg:self-start order-1 lg:order-2 animate-slide-in-up opacity-0"
  style={{ animationDelay: "20ms" }}
>
```

- [ ] **Step 2: Change `lg:top-6` to `lg:top-20`**

Replace `lg:top-6` with `lg:top-20`.

```tsx
<aside
  className="w-full lg:w-72 xl:w-80 shrink-0 lg:sticky lg:top-20 lg:self-start order-1 lg:order-2 animate-slide-in-up opacity-0"
  style={{ animationDelay: "20ms" }}
>
```

**Rationale:** `lg:top-20` = 80px = sticky search row height (~56px = `py-3` 24px + button h-10 40px - 8px overlap) + 24px gap. Documented in the spec.

- [ ] **Step 3: Lint**

Run: `pnpm biome check src/features/applications/components/app-list-home.tsx`
Expected: clean.

- [ ] **Step 4: Manual verification**

On a wide viewport (`lg+`, ≥1024px):
- Scroll the page down. The Favoritos sidebar should remain visible inside its column on the right.
- The Favoritos panel's top edge should sit just below the sticky search row (24px gap visible between the search row's bottom border and the Favoritos panel's top edge).
- The Favoritos panel should NOT slide under the sticky search row.

On a narrow viewport (`< lg`, simulate via DevTools or resize):
- Favoritos panel still appears above the Recentes/Todas section (`order-1 lg:order-2`).
- It scrolls naturally with the rest of the content. `lg:top-20` only applies at `lg+`.

- [ ] **Step 5: Commit**

```bash
git add src/features/applications/components/app-list-home.tsx
git commit -m "$(cat <<'EOF'
fix(home): offset Favoritos sticky sidebar to clear sticky search row

lg:top-6 → lg:top-20 so the favorites panel sits ~24px below the
sticky search row instead of sliding behind it.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Task 8: Full manual verification + push

**Files:** None modified.

Run through the full testing checklist from the spec.

- [ ] **Step 1: Reload the page; verify steps 1-13 from the spec**

For each item, confirm in the browser:

1. Page loads — no document scrollbar visible. ✓
2. Hero visible at top of viewport. ✓
3. Search row sits below hero, transparent background. ✓
4. Scroll with wheel — hero scrolls up out of view. ✓
5. As search row reaches top, it sticks. Background becomes opaque + bottom border appears. ✓
6. Continue scrolling — cards pass under the search row. Search row stays anchored. ✓
7. Favoritos sidebar pins at `top-20`, doesn't slide under the sticky search row. ✓
8. Scroll back to top — search unsticks, background returns to transparent. ✓
9. Resize browser smaller — no horizontal scrollbar. ✓
10. Open Chrome DevTools, switch to mobile viewport (e.g., iPhone 14, 390×844). Favoritos appears above cards, sticky logic works (search row pins). ✓
11. Open `⌘K` palette, then close it — scroll position unchanged. ✓
12. Collapse a section (Recentes or Todas) using its header — no unexpected page jump. ✓
13. Browser zoom: 80%, 110%, 150% — heights re-flow, no document scrollbar. ✓

If any item fails, fix inline and re-verify before continuing.

- [ ] **Step 2: Run typecheck and lint full passes**

Run: `pnpm typecheck 2>&1 | tail -5`
Expected: no errors related to home files.

Run: `pnpm biome check --write src/`
Expected: `Checked N files ... No fixes applied.` (or only whitespace fixes).

If lint applied fixes:
```bash
git add -A
git commit -m "chore: biome formatting"
```

- [ ] **Step 3: Push**

```bash
git push
```

Expected: branch updates pushed to origin.

---

## File Structure Summary

After this plan completes, the following files have changed:

| File | What changed |
|---|---|
| `src/styles/globals.css` | + `--home-scroll-h` CSS var, + `.home-scroll-viewport` scrollbar styling |
| `src/app/(igrp)/(home)/layout.tsx` | Reverted container to plain `container mx-auto max-w-7xl` |
| `src/app/(igrp)/(home)/page.tsx` | Wrapper switched to `max-h-[var(--home-scroll-h)] overflow-hidden flex flex-col`; removed `p-6` |
| `src/features/applications/components/app-list-home.tsx` | Outer restructured; new ScrollViewport owns the scroll; new sentinel + IntersectionObserver wires `isStuck`; search wrapped in sticky div; Favoritos `lg:top-6` → `lg:top-20` |

No new files. No new dependencies. ~120 lines net change.
