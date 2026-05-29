# Home launcher — viewport-locked scroll architecture

**Date:** 2026-05-29
**Status:** Approved — ready for implementation
**Scope:** `src/app/(igrp)/(home)/` and `src/features/applications/components/app-list-home.tsx`

## Goal

Replace the current document-level page scroll on the home launcher with a contained, viewport-locked scroll inside the Apps area. The hero card scrolls away naturally; the search row becomes sticky at the top of the scroll viewport once reached; the cards (Recentes + Todas as Aplicações) and the Favoritos sidebar continue to scroll below it.

After this change, the document body does not show a vertical scrollbar on the home route. The only scrollbar visible is on the inner ScrollViewport.

## Why

The IGRP layout shell (`IGRPLayoutFull` → `IGRPRootProvidersFull`) uses `flex min-h-screen flex-col w-full` on its root container, which is content-driven. There is no `<main overflow-y-auto>` wrapper for pages to slot into; pages naturally cause the document body to scroll when content overflows the viewport.

The launcher's information architecture (hero + persistent search + paginated card grids + sticky favorites sidebar) wants a contained scroll: the user's mental model is "I'm scrolling the apps area, not the whole page." Achieving that requires us to lock our outer container to viewport height and create an inner scroll context.

## Decision summary

| Decision | Choice |
|---|---|
| Hero behavior on scroll | Hero scrolls away inside the same scroll container as the cards |
| Search behavior on scroll | Sticky at `top-0` of the scroll viewport once reached |
| Scroll mechanism | Native `overflow-y-auto` (not shadcn ScrollArea) |
| Height-locking strategy | Viewport-calc on the page wrapper via a CSS variable |
| Magic number | `5rem` (IGRP topbar ~4rem + framework `p-4` top padding 1rem) |
| "Stuck" detection | `IntersectionObserver` on a 1px sentinel above the sticky row |
| Favoritos sidebar offset | `lg:top-20` (clears the sticky search row + 24px gap) |

Approaches considered and rejected:

- **shadcn ScrollArea (Radix-based)**: rejected. Known issues with `position: sticky` inside the Radix viewport — the inner translated div breaks sticky positioning. Workarounds (lifting the sticky element outside the ScrollArea) defeat the purpose. We use native overflow.
- **CSS escape hatch (body overflow lock via class toggle)**: rejected. Mutates global body state. Must un-set on route change. Risk to modals/dialogs that may rely on document scroll behavior.
- **ResizeObserver dynamic header measurement**: rejected. Adds JS, DOM coupling to framework-owned elements, and a paint-of-mismatch on first render. The framework header height has been stable; a hardcoded value behind a CSS variable is the simpler tradeoff.

## Architecture

```
IGRPLayoutFull (framework)
└── <header>                          ← IGRP topbar, ~4rem tall
└── <div className="p-4">             ← framework's p-4 wrapper
    └── HomeLayout container           ← `container mx-auto max-w-7xl` (no height locking)
        └── page.tsx wrapper           ← max-h-[var(--home-scroll-h)] overflow-hidden flex flex-col
            └── ApplicationsListHome
                ├── CommandPalette     ← modal portal, outside the scroll
                └── ScrollViewport     ← flex-1 min-h-0 overflow-y-auto, owns the scroll
                    ├── Hero            ← normal flow, scrolls away
                    ├── Sentinel        ← 1px invisible div for IntersectionObserver
                    ├── StickyHeader    ← sticky top-0 z-20, contains the search button
                    └── Body            ← two-column [Recentes+Todas | Favoritos lg:sticky lg:top-20]
```

## Component changes

### 1. `src/app/(igrp)/(home)/layout.tsx`

**Revert** the earlier change that added `h-full flex flex-col min-h-0` to the home layout container. That was a failed attempt at height propagation and now affects sibling home routes (settings, profile). Restore the original:

```tsx
<div className="container mx-auto max-w-7xl">{children}</div>
```

### 2. `src/app/(igrp)/(home)/page.tsx`

Wrap the hydration children in a height-locked container:

```tsx
<HydrationBoundary state={dehydrate(queryClient)}>
  <div className="max-h-[var(--home-scroll-h)] overflow-hidden flex flex-col">
    <ApplicationsListHome />
  </div>
</HydrationBoundary>
```

The page wrapper no longer has `p-6` — the padding moves inside the ScrollViewport so it scrolls with content and the scrollbar sits flush with the page edge.

### 3. `src/styles/globals.css`

Add the single CSS variable scoped to `:root`:

```css
:root {
  /* Home launcher viewport-fit height.
   * 100dvh — IGRP header (~4rem) — framework p-4 wrapper top padding (1rem).
   * If the framework header height changes, adjust the rem value here. */
  --home-scroll-h: calc(100dvh - 5rem);
}
```

Also add scrollbar styling for the launcher viewport:

```css
.home-scroll-viewport {
  scrollbar-width: thin;
  scrollbar-color: var(--border) transparent;
}
.home-scroll-viewport::-webkit-scrollbar { width: 8px; }
.home-scroll-viewport::-webkit-scrollbar-thumb {
  background: var(--border);
  border-radius: 4px;
}
.home-scroll-viewport::-webkit-scrollbar-track { background: transparent; }
```

### 4. `src/features/applications/components/app-list-home.tsx`

The outer JSX structure of `ApplicationsListHome` becomes:

```tsx
<div className="flex flex-col flex-1 min-h-0 overflow-hidden">
  <CommandPalette {...} />

  <div
    ref={scrollRef}
    className="home-scroll-viewport flex-1 min-h-0 overflow-y-auto px-6 py-6"
  >
    {/* Sentinel — picked up by IntersectionObserver. Placed before the sticky
        row so the sticky transitions only when this 1px element leaves view. */}
    <div ref={sentinelRef} aria-hidden className="h-px" />

    {/* Hero */}
    <header className="..."> ... </header>

    {/* Sticky search row.
        - sticky top-0 z-20 inside the ScrollViewport.
        - Negative x-margins + matching padding so the row spans the scroll
          viewport edge-to-edge (otherwise px-6 from the parent leaves a gap).
        - Background and border swap based on `isStuck` state. */}
    <div
      className={cn(
        "sticky top-0 z-20 -mx-6 px-6 py-3 mt-6 transition-colors",
        isStuck
          ? "bg-background/90 backdrop-blur-sm border-b border-border"
          : "bg-transparent border-b border-transparent",
      )}
    >
      <button {...search trigger props} />
    </div>

    {/* Body — two-column. Favoritos sidebar sticky-top now `lg:top-20`. */}
    {isLoading ? ... : !applications?.length ? ... : (
      <div className="flex flex-col lg:flex-row gap-8 mt-6">
        {/* Recentes + Todas */}
        <div className="flex-1 min-w-0 flex flex-col gap-10 order-2 lg:order-1">
          ...
        </div>

        {/* Favoritos sidebar */}
        <aside className="... lg:sticky lg:top-20 lg:self-start order-1 lg:order-2 ...">
          ...
        </aside>
      </div>
    )}
  </div>
</div>
```

#### `isStuck` state

```tsx
const sentinelRef = useRef<HTMLDivElement>(null);
const scrollRef = useRef<HTMLDivElement>(null);
const [isStuck, setIsStuck] = useState(false);

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

The observer's `root` is the scroll viewport itself (not the document), so it correctly tracks when the sentinel leaves the inner scroll area.

### What `min-h-0` does

Flex children default to `min-height: auto`, which prevents shrinking below content size. That breaks `overflow-y-auto` because the scroll container can't shrink to its parent's bound. Setting `min-h-0` on every flex child in the chain is what lets each one collapse and lets `overflow-y-auto` activate. Every flex container in the chain (`ApplicationsListHome` outer, the ScrollViewport itself) gets `min-h-0`.

## Visual details

### Sticky search — two visual states

**At rest** (sentinel still in view):
- Background: transparent
- Bottom border: transparent

**Stuck** (sentinel out of view, user scrolled past):
- Background: `bg-background/90 backdrop-blur-sm` — semi-opaque so cards behind blur subtly
- Bottom border: `border-b border-border` — clear edge against scrolling content

Transition is `transition-colors` for a soft swap (not jarring).

### Favoritos sidebar offset

`lg:top-6` (24px) → `lg:top-20` (80px = 56px search-row-height + 24px gap). Stored as a Tailwind utility value rather than a CSS variable to keep it close to the component. Document inline in the JSX why.

### Scrollbar styling

The `.home-scroll-viewport` class provides:
- `scrollbar-width: thin` and `scrollbar-color` for Firefox/standard
- WebKit-specific `::-webkit-scrollbar-*` rules for Chrome/Safari
- Thumb uses `var(--border)`, track is transparent — matches the framework's existing token system

## Edge cases

| Case | Behavior |
|---|---|
| Empty apps (`AppCenterNotFound` renders) | Renders inside ScrollViewport in normal flow. Sticky search row visible at top. |
| Loading skeleton | `GridSkeleton` renders inside ScrollViewport. Sticky row dormant since sentinel doesn't leave. |
| All content fits without scrolling | No scrollbar appears. Sentinel never leaves viewport. Search stays in at-rest state. |
| `⌘K` palette opens | Modal portal renders outside ScrollViewport. Scroll position preserved on close. |
| Section collapse (Recentes / Todas) | Section content unmounts; ScrollViewport reflows. If user was scrolled past it, search may un-stick — correct. |
| Browser zoom | `100dvh` adjusts to the zoomed viewport; calc recomputes. Works at any zoom. |
| Long hero content | Hero takes more space at top; still scrolls away normally. |
| Mobile (`< lg`) | Two-column stacks; Favoritos panel above cards (`order-1`). Sticky logic still works; favoritos sidebar's `lg:top-20` only applies at `lg+`, so on mobile it scrolls naturally. |
| iOS Safari URL bar collapsing | `100dvh` handles this correctly (unlike `100vh`). |

## Testing — manual verification checklist

1. Page loads → no document scrollbar visible
2. Hero visible at top of the launcher area
3. Search row sits below hero, transparent background
4. Scroll with wheel → hero moves up; search row scrolls toward the top
5. As search row reaches `top-0` of ScrollViewport → it sticks; background becomes opaque + bottom border appears
6. Continue scrolling → cards pass under the search row; search row stays anchored
7. Favoritos sidebar pins at `lg:top-20`, never slides under the sticky search row
8. Scroll back to top → search row unsticks; background returns to transparent
9. Resize browser horizontally → no horizontal scrollbar appears
10. Mobile viewport (Chrome devtools narrow) → columns stack, Favoritos above cards, sticky logic still functions
11. Open `⌘K` palette and close → scroll position unchanged
12. Collapse a Recentes/Todas section → page doesn't jump unpredictably
13. Browser zoom at 80%, 110%, 150% → heights still resolve correctly

## Out of scope

- Modifying the IGRP framework shell to provide a viewport-bound `<main>`. That's a framework-level change, not a route-level one.
- Sticky behavior on routes other than home (settings, profile keep their current natural scroll).
- Custom keyboard handling for the scroll (Page Down, Home/End). Native scrolling already handles these inside an `overflow-y-auto` container.
- Scroll position persistence across navigations (not currently a stated need).

## Risk and mitigation

- **Magic number drift**: if IGRP changes their header height in a future version, `5rem` will be wrong. **Mitigation:** CSS variable centralizes the value to one location; comment explains the calculation; a manual visual check would catch it within seconds.
- **`100dvh` browser support**: Chrome 108+, Safari 15.4+, Firefox 101+ — wide coverage as of 2026. For older browsers, `100vh` is a graceful fallback (slightly less accurate on mobile but still works).
- **`IntersectionObserver` browser support**: universal in modern browsers since 2019.
- **Sticky inside flex column**: `position: sticky` works correctly inside `overflow-y-auto`, but requires the sticky element's containing block to not have `overflow: visible`. Confirmed our structure satisfies this.
