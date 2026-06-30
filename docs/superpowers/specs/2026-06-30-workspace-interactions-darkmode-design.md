# Workspace Interactions & Dark Mode — Design Spec (Addendum)
**Date:** 2026-06-30
**Branch:** design/v2
**Status:** Approved
**Amends:** `docs/superpowers/specs/2026-06-30-enterprise-workspace-design.md`

---

## Overview

This spec amends the Enterprise Workspace design with three focused additions:

1. **App card structure enhancements** — description field, extended status badges, richer layout
2. **App catalog interaction polish** — animated favorites pill, grid fade-in on filter change, empty state
3. **Full dark mode** — `dark:` Tailwind variants on all 8 workspace surface components

These run as an addendum plan executed after the original 13-task plan completes.

---

## Scope

**In scope:**
- `AppTileCard` — description prop, divider, OPERATIONAL badge, dark mode
- `AppCatalog` — pill animation, grid fade-in, no-favorites empty state, dark mode
- All other workspace surface components — dark mode `dark:` variants only
- `globals.css` — `@keyframes fadeIn` + `animate-fadeIn` utility

**Out of scope:**
- Changing the favorites data layer (stays real API — `useAddCurrentUserFavoriteApplication` / `useRemoveCurrentUserFavoriteApplication`)
- Adding Framer Motion or any new animation library
- Dark mode on non-workspace components (IGRP shell handles its own dark mode)
- Any new routes, types, or mock data

---

## Decision Log

| Decision | Choice | Reason |
|---|---|---|
| Favorites persistence | Real API (no localStorage) | Project already has a backend favorites API; localStorage would diverge from the rest of the app |
| Dark mode scope | Full `dark:` variants on all workspace components | IGRP shell already manages `dark` class on `<html>`; components just need the variants |
| Grid exit animation | None (instant) | No Framer Motion in project; fade-in on remount is sufficient and avoids library overhead |
| Card animation | `key`-based remount + CSS `@keyframes fadeIn` | Pure CSS, no dependencies |

---

## Task A: AppTileCard Enhancements

### New prop

```ts
type Props = {
  app: ApplicationDTO
  isFavorite: boolean
  onToggleFavorite: (app: ApplicationDTO, isFavorite: boolean) => void
  lastOpenedLabel?: string
  description?: string   // NEW — omit to hide description + divider
}
```

### Updated card structure

```
┌──────────────────────────────────────┐
│  [icon]  App Name              [★]   │
│          description text here       │  ← shown only when description provided
│          (2 lines max, muted)         │
│  ─────────────────────────────────── │  ← <hr> divider, only when description exists
│  [OPERATIONAL] or [MAINTENANCE]      │  ← status badge (conditional)
└──────────────────────────────────────┘
```

### Status badge color mapping

| `app.status` value | Classes |
|---|---|
| `"OPERATIONAL"` | `bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300` |
| `"MAINTENANCE"` | `bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300` |
| anything else / absent | no badge rendered |

### Dark mode token mapping for AppTileCard

| Light | Dark |
|---|---|
| `bg-white` | `dark:bg-gray-900` |
| `border-gray-200` | `dark:border-gray-700` |
| `hover:shadow-md` | `dark:hover:shadow-gray-800` |
| `text-gray-900` (app name) | `dark:text-gray-100` |
| `text-gray-400` (last opened label) | stays `dark:text-gray-500` |
| `text-gray-300` (star outline) | `dark:text-gray-600` |

---

## Task B: AppCatalog Enhancements

### 1. Favorites pill animation

Add `transition-all duration-150 ease-in-out` to the favorites button `className`. The background tint and star fill color will transition smoothly between states.

Default (unselected):
```
border-gray-200 bg-white text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300
```

Active (selected):
```
border-amber-400 bg-amber-50 text-amber-700 dark:border-amber-500 dark:bg-amber-950 dark:text-amber-400
```

Both states include `transition-all duration-150 ease-in-out`.

### 2. Grid fade-in on filter change

Add `animate-fadeIn` to the grid container. Force remount via a derived `key`:

```tsx
const gridKey = `${showFavoritesOnly}-${search}-${sortBy}`

<div key={gridKey} className="... animate-fadeIn">
  {filtered.map(...)}
</div>
```

`animate-fadeIn` is defined in `globals.css` (see Task D).

### 3. No-favorites empty state

When `showFavoritesOnly === true` and `filtered.length === 0`:

```tsx
<div className="rounded-xl border border-dashed border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950 py-12 text-center">
  <Star size={24} className="mx-auto text-amber-300 mb-3" />
  <p className="text-sm font-medium text-amber-700 dark:text-amber-400">No favorites yet</p>
  <p className="text-xs text-amber-500 dark:text-amber-500 mt-1">
    Click the ★ on any app to add it here
  </p>
</div>
```

The existing "no results" empty state (gray dashed border) remains for when search produces no matches.

### Dark mode for AppCatalog

| Element | Light | Dark |
|---|---|---|
| Section label | `text-gray-400` | same (already muted) |
| Search input | `bg-white border-gray-200 text-gray-700` | `dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200` |
| Sort select | `bg-white border-gray-200 text-gray-600` | `dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300` |
| View toggle container | `border-gray-200` | `dark:border-gray-700` |
| View toggle inactive | `bg-white text-gray-500` | `dark:bg-gray-800 dark:text-gray-400` |
| View toggle active | `bg-indigo-50 text-indigo-600` | `dark:bg-indigo-950 dark:text-indigo-400` |
| Empty state (no results) | `border-gray-200 bg-gray-50 text-gray-400` | `dark:border-gray-700 dark:bg-gray-800 dark:text-gray-500` |

---

## Task C: Dark Mode — All Remaining Components

### Global token mapping (applies to all components)

| Role | Light | Dark |
|---|---|---|
| Card surface | `bg-white` | `dark:bg-gray-900` |
| Page / section bg | `bg-gray-50` | `dark:bg-gray-800` |
| Card border | `border-gray-200` | `dark:border-gray-700` |
| Primary text | `text-gray-900` | `dark:text-gray-100` |
| Secondary text | `text-gray-700` | `dark:text-gray-300` |
| Muted text | `text-gray-500` | `dark:text-gray-400` |
| Very muted | `text-gray-400` | `dark:text-gray-500` |
| Indigo banner bg | `bg-indigo-50 border-indigo-100` | `dark:bg-indigo-950 dark:border-indigo-800` |
| Indigo badge bg | `bg-indigo-100 text-indigo-700` | `dark:bg-indigo-900 dark:text-indigo-300` |
| Stat card overdue | `bg-red-50` | `dark:bg-red-950` |
| Stat card today | `bg-amber-50` | `dark:bg-amber-950` |
| Stat card week | `bg-blue-50` | `dark:bg-blue-950` |
| Stat card neutral | `bg-gray-50` | `dark:bg-gray-800` |
| Progress bar track | `bg-gray-100` | `dark:bg-gray-700` |
| Input / select | `bg-gray-50 border-gray-200` | `dark:bg-gray-800 dark:border-gray-700` |
| Tab bar border | `border-gray-200` | `dark:border-gray-700` |
| Demo menu panel | `bg-white border-gray-200` | `dark:bg-gray-900 dark:border-gray-700` |
| Demo menu item hover | `hover:bg-gray-50` | `dark:hover:bg-gray-800` |
| Demo menu item active | `bg-indigo-50 text-indigo-700` | `dark:bg-indigo-950 dark:text-indigo-400` |
| Demo button | `bg-gray-900 text-white` | `dark:bg-gray-100 dark:text-gray-900` |

### Per-component coverage

| Component | Dark mode touches |
|---|---|
| `app-tile-card.tsx` | card bg, border, name text, star color (see Task A) |
| `recently-accessed.tsx` | section label, scroll container — minimal, inherits from cards |
| `app-catalog.tsx` | full pass (see Task B) |
| `welcome-banner.tsx` | banner bg/border, role pill, date pill, name text, subtext |
| `task-row.tsx` | card bg/border, title text, meta text, priority badge tints, due-date text |
| `work-summary-sidebar.tsx` | card bg/border, header text, all 4 stat card tints, progress bar track |
| `task-list.tsx` | container bg/border, sub-tab bar, active/inactive tab text, filter input |
| `enterprise-workspace.tsx` | tab bar bg/border, active/inactive tab colors, demo panel, demo button |

---

## Task D: fadeIn Animation in globals.css

Add to `src/styles/globals.css`:

```css
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fadeIn {
  animation: fadeIn 150ms ease-out both;
}
```

This utility is used exclusively by the `AppCatalog` grid container.

---

## What Is NOT Changing

- Favorites data layer: real API calls remain unchanged
- `AppTileCard` star click already has `stopPropagation` (from original Task 3)
- Immediate filtered-view removal on un-favorite already works via reactive `favCodes` set
- `TaskRow`, `WorkSummarySidebar` logic — no behavioral changes, dark mode CSS only
- Home page wiring (`page.tsx`) — no changes
- Types, mock data — no changes
