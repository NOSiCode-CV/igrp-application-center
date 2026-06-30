# Workspace Interactions & Dark Mode — Addendum Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Amend the Enterprise Workspace components with app card enhancements, catalog interaction polish, and full dark mode support across all 8 surface components.

**Architecture:** Four focused amendment tasks executed after the original 13-task plan completes. Task A adds a custom CSS animation utility to globals.css. Tasks B and C replace two component files wholesale with enriched versions. Task D adds `dark:` variants to the remaining six components in-place.

**Tech Stack:** Tailwind CSS v4 (`@utility` for custom utilities, `@custom-variant dark (&:is(.dark *))`), TypeScript strict, lucide-react, `@igrp/platform-access-management-client-ts` (ApplicationDTO).

## Global Constraints

- Execute only after the original plan (`2026-06-30-enterprise-workspace.md`) is complete
- No new dependencies — no Framer Motion, no animation libraries
- Dark mode is managed by the IGRP shell via the `dark` class on `<html>`; components use `dark:` variants only
- Tailwind v4 syntax: `@utility` for custom utilities, NOT `@layer utilities { .class { ... } }`
- Favorites data layer unchanged — stays wired to real API (`useAddCurrentUserFavoriteApplication` / `useRemoveCurrentUserFavoriteApplication`)
- Test command: `npx vitest run`
- TypeScript check: `npx tsc --noEmit`

---

## File Map

| File | Action | What changes |
|------|--------|-------------|
| `src/styles/globals.css` | Modify | Add `@keyframes fadeIn` + `@utility animate-fadeIn` |
| `src/features/workspace/components/home-apps/app-tile-card.tsx` | Replace | description prop, extended status badges, dark mode, stopPropagation |
| `src/features/workspace/components/home-apps/app-catalog.tsx` | Replace | pill animation, grid fade-in key, no-favorites empty state, dark mode |
| `src/features/workspace/components/home-apps/recently-accessed.tsx` | Modify | dark: variants on link and label |
| `src/features/workspace/components/home-apps/welcome-banner.tsx` | Replace | dark: variants throughout |
| `src/features/workspace/components/tasks/task-row.tsx` | Replace | dark: variants on all surfaces and badge maps |
| `src/features/workspace/components/tasks/work-summary-sidebar.tsx` | Replace | dark: variants on all surfaces and stat cards |
| `src/features/workspace/components/tasks/task-list.tsx` | Replace | dark: variants on container, tabs, input, badges |
| `src/features/workspace/components/enterprise-workspace.tsx` | Replace | dark: variants on tab bar, demo panel, demo button |

---

## Task A: fadeIn Animation Utility

**Files:**
- Modify: `src/styles/globals.css`

**Interfaces:**
- Produces: `animate-fadeIn` Tailwind utility class — used by AppCatalog grid container in Task B

- [ ] **Step 1: Add keyframes and utility to globals.css**

Add the following lines at the end of `src/styles/globals.css` (after the closing `*/` of the sidebar comment block, before EOF):

```css
/* ── Workspace animations ──────────────────────────────────────────────────── */
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

@utility animate-fadeIn {
  animation: fadeIn 150ms ease-out both;
}
```

- [ ] **Step 2: Verify Tailwind picks it up**

```bash
npx tsc --noEmit
```

Expected: No errors. (The utility will be tree-shaken until used; TypeScript compilation confirms the CSS file is valid.)

- [ ] **Step 3: Commit**

```bash
git add src/styles/globals.css
git commit -m "feat(workspace): add fadeIn animation utility to globals.css"
```

---

## Task B: AppTileCard — Description, Status Badges, Dark Mode, stopPropagation

**Files:**
- Replace: `src/features/workspace/components/home-apps/app-tile-card.tsx`

**Interfaces:**
- Consumes: `ApplicationDTO` from `@igrp/platform-access-management-client-ts`, `getAppTileColor` from `../../lib/app-utils`
- Produces: `<AppTileCard app isFavorite onToggleFavorite lastOpenedLabel? description? />`

Changes from original:
- Adds `description?: string` prop — renders below name with `line-clamp-2`; when present, a `<hr>` divider separates it from the status badge
- Extends status mapping to include `OPERATIONAL` (emerald) alongside `MAINTENANCE` (amber)
- Adds `dark:` variants on all surface classes
- Adds `e.stopPropagation()` to star button click handler

- [ ] **Step 1: Replace app-tile-card.tsx with full updated component**

```tsx
// src/features/workspace/components/home-apps/app-tile-card.tsx
"use client"

import type { ApplicationDTO } from "@igrp/platform-access-management-client-ts"
import { Star } from "lucide-react"
import { getAppTileColor } from "../../lib/app-utils"

type Props = {
  app: ApplicationDTO
  isFavorite: boolean
  onToggleFavorite: (app: ApplicationDTO, isFavorite: boolean) => void
  lastOpenedLabel?: string
  description?: string
}

const STATUS_STYLES: Record<string, string> = {
  OPERATIONAL:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300",
  MAINTENANCE:
    "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
}

export function AppTileCard({
  app,
  isFavorite,
  onToggleFavorite,
  lastOpenedLabel,
  description,
}: Props) {
  const color = getAppTileColor(app.code)
  const initial = (app.name ?? app.code).charAt(0).toUpperCase()
  const statusStyle = app.status ? STATUS_STYLES[app.status] : undefined

  return (
    <div className="relative rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 hover:shadow-md dark:hover:shadow-gray-800 transition-shadow flex flex-col gap-3 min-w-0">
      <button
        type="button"
        aria-label={isFavorite ? "Remove from favourites" : "Add to favourites"}
        className="absolute top-3 right-3 text-gray-300 dark:text-gray-600 hover:text-amber-400 transition-colors"
        onClick={(e) => {
          e.stopPropagation()
          onToggleFavorite(app, isFavorite)
        }}
      >
        <Star
          size={16}
          className={isFavorite ? "fill-amber-400 text-amber-400" : ""}
        />
      </button>

      <div className="flex items-center gap-3">
        <div
          className={`flex items-center justify-center size-10 rounded-lg font-bold text-sm shrink-0 ${color.bg} ${color.text}`}
        >
          {initial}
        </div>

        <div className="flex flex-col gap-0.5 min-w-0 pr-5">
          <span className="font-semibold text-sm text-gray-900 dark:text-gray-100 truncate">
            {app.name}
          </span>
          {lastOpenedLabel && (
            <span className="text-xs text-gray-400 dark:text-gray-500">
              {lastOpenedLabel}
            </span>
          )}
        </div>
      </div>

      {description && (
        <>
          <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed">
            {description}
          </p>
          <hr className="border-gray-100 dark:border-gray-800" />
        </>
      )}

      {statusStyle && (
        <span
          className={`self-start rounded-full text-xs font-medium px-2 py-0.5 ${statusStyle}`}
        >
          {app.status}
        </span>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/features/workspace/components/home-apps/app-tile-card.tsx
git commit -m "feat(workspace): enhance AppTileCard with description, status badges, dark mode"
```

---

## Task C: AppCatalog — Pill Animation, Grid Fade, Empty State, Dark Mode

**Files:**
- Replace: `src/features/workspace/components/home-apps/app-catalog.tsx`

**Interfaces:**
- Consumes: `useCurrentUserApplications`, `useCurrentUserFavoriteApplications`, `useAddCurrentUserFavoriteApplication`, `useRemoveCurrentUserFavoriteApplication` from `@/features/users/use-users`, `AppTileCard`, `animate-fadeIn` (from globals.css — Task A must be complete)
- Produces: `<AppCatalog />`

Changes from original:
- `transition-all duration-150 ease-in-out` on favorites pill button
- `key={gridKey}` on grid/list container where `gridKey = \`${showFavoritesOnly}-${search}-${sortBy}\``
- `animate-fadeIn` class on grid/list container
- Empty state when `showFavoritesOnly && filtered.length === 0`
- Full `dark:` variants on all inputs, selects, buttons, and empty states

- [ ] **Step 1: Replace app-catalog.tsx with full updated component**

```tsx
// src/features/workspace/components/home-apps/app-catalog.tsx
"use client"

import type { ApplicationDTO } from "@igrp/platform-access-management-client-ts"
import { LayoutGrid, List, Star } from "lucide-react"
import { useMemo, useState } from "react"
import {
  useAddCurrentUserFavoriteApplication,
  useCurrentUserApplications,
  useCurrentUserFavoriteApplications,
  useRemoveCurrentUserFavoriteApplication,
} from "@/features/users/use-users"
import { AppTileCard } from "./app-tile-card"

type ViewMode = "grid" | "list"
type SortBy = "name" | "default"

export function AppCatalog() {
  const [search, setSearch] = useState("")
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>("grid")
  const [sortBy, setSortBy] = useState<SortBy>("default")

  const { data: apps = [] } = useCurrentUserApplications()
  const { data: favorites = [] } = useCurrentUserFavoriteApplications()
  const addFav = useAddCurrentUserFavoriteApplication()
  const removeFav = useRemoveCurrentUserFavoriteApplication()

  const favCodes = useMemo(
    () => new Set(favorites.map((f) => f.code)),
    [favorites],
  )

  const filtered = useMemo(() => {
    let list = apps
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter((a) => a.name.toLowerCase().includes(q))
    }
    if (showFavoritesOnly) {
      list = list.filter((a) => favCodes.has(a.code))
    }
    if (sortBy === "name") {
      list = [...list].sort((a, b) => a.name.localeCompare(b.name))
    }
    return list
  }, [apps, search, showFavoritesOnly, sortBy, favCodes])

  function handleToggle(app: ApplicationDTO, isFavorite: boolean) {
    if (isFavorite) {
      removeFav.mutate(app.code)
    } else {
      addFav.mutate({ applicationCode: app.code, app })
    }
  }

  const gridKey = `${showFavoritesOnly}-${search}-${sortBy}`

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
          Application Directory{" "}
          <span className="normal-case font-normal text-gray-400">
            — Showing {filtered.length} of {apps.length} systems
          </span>
        </span>
      </div>

      <div className="flex flex-wrap gap-2 mb-4 items-center">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search available applications catalogue..."
          className="flex-1 min-w-[200px] rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-1.5 text-sm text-gray-700 dark:text-gray-200 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-300"
        />

        <button
          type="button"
          onClick={() => setShowFavoritesOnly((v) => !v)}
          className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition-all duration-150 ease-in-out ${
            showFavoritesOnly
              ? "border-amber-400 bg-amber-50 text-amber-700 dark:border-amber-500 dark:bg-amber-950 dark:text-amber-400"
              : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
          }`}
        >
          <Star
            size={14}
            className={
              showFavoritesOnly
                ? "fill-amber-400 text-amber-400 transition-colors duration-150"
                : "transition-colors duration-150"
            }
          />
          Favorites
        </button>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortBy)}
          className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-1.5 text-sm text-gray-600 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-300"
        >
          <option value="default">Sort: Recommended</option>
          <option value="name">Sort: Name A–Z</option>
        </select>

        <div className="flex items-center border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
          <button
            type="button"
            onClick={() => setViewMode("grid")}
            className={`p-1.5 transition-colors ${
              viewMode === "grid"
                ? "bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400"
                : "bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
            }`}
            aria-label="Grid view"
          >
            <LayoutGrid size={16} />
          </button>
          <button
            type="button"
            onClick={() => setViewMode("list")}
            className={`p-1.5 transition-colors ${
              viewMode === "list"
                ? "bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400"
                : "bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
            }`}
            aria-label="List view"
          >
            <List size={16} />
          </button>
        </div>
      </div>

      {showFavoritesOnly && filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950 py-12 text-center">
          <Star
            size={24}
            className="mx-auto text-amber-300 dark:text-amber-600 mb-3"
          />
          <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
            No favorites yet
          </p>
          <p className="text-xs text-amber-500 dark:text-amber-500 mt-1">
            Click the ★ on any app to add it here
          </p>
        </div>
      ) : !showFavoritesOnly && filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 py-12 text-center text-sm text-gray-400 dark:text-gray-500">
          No applications match your search.
        </div>
      ) : (
        <div
          key={gridKey}
          className={
            viewMode === "grid"
              ? "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 animate-fadeIn"
              : "flex flex-col gap-2 animate-fadeIn"
          }
        >
          {filtered.map((app) => (
            <AppTileCard
              key={app.code}
              app={app}
              isFavorite={favCodes.has(app.code)}
              onToggleFavorite={handleToggle}
            />
          ))}
        </div>
      )}
    </section>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/features/workspace/components/home-apps/app-catalog.tsx
git commit -m "feat(workspace): add pill animation, grid fade, favorites empty state, dark mode to AppCatalog"
```

---

## Task D: Dark Mode — All Remaining Components

**Files:**
- Modify: `src/features/workspace/components/home-apps/recently-accessed.tsx`
- Replace: `src/features/workspace/components/home-apps/welcome-banner.tsx`
- Replace: `src/features/workspace/components/tasks/task-row.tsx`
- Replace: `src/features/workspace/components/tasks/work-summary-sidebar.tsx`
- Replace: `src/features/workspace/components/tasks/task-list.tsx`
- Replace: `src/features/workspace/components/enterprise-workspace.tsx`

- [ ] **Step 1: Update recently-accessed.tsx (minimal — link color only)**

Replace the two className strings that need dark variants in `src/features/workspace/components/home-apps/recently-accessed.tsx`:

```tsx
// src/features/workspace/components/home-apps/recently-accessed.tsx
"use client"

import type { ApplicationDTO } from "@igrp/platform-access-management-client-ts"
import {
  useAddCurrentUserFavoriteApplication,
  useCurrentUserFavoriteApplications,
  useGetCurrentUserRecentApplications,
  useRemoveCurrentUserFavoriteApplication,
} from "@/features/users/use-users"
import { AppTileCard } from "./app-tile-card"

export function RecentlyAccessed() {
  const { data: recent = [] } = useGetCurrentUserRecentApplications()
  const { data: favorites = [] } = useCurrentUserFavoriteApplications()
  const addFav = useAddCurrentUserFavoriteApplication()
  const removeFav = useRemoveCurrentUserFavoriteApplication()

  const favCodes = new Set(favorites.map((f) => f.code))

  function handleToggle(app: ApplicationDTO, isFavorite: boolean) {
    if (isFavorite) {
      removeFav.mutate(app.code)
    } else {
      addFav.mutate({ applicationCode: app.code, app })
    }
  }

  if (recent.length === 0) return null

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
          Recently Accessed
        </span>
        <button
          type="button"
          className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
        >
          View all catalog →
        </button>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-700">
        {recent.slice(0, 8).map((app) => (
          <div key={app.code} className="min-w-[180px]">
            <AppTileCard
              app={app}
              isFavorite={favCodes.has(app.code)}
              onToggleFavorite={handleToggle}
              lastOpenedLabel="Recently opened"
            />
          </div>
        ))}
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Replace welcome-banner.tsx with dark mode version**

```tsx
// src/features/workspace/components/home-apps/welcome-banner.tsx
"use client"

import { CalendarDays, Settings2 } from "lucide-react"
import { useEffect, useState } from "react"
import {
  useCurrentUser,
  useCurrentUserActiveRole,
} from "@/features/users/use-users"
import { computeTaskStats, getGreeting } from "../../lib/task-utils"
import type { Task } from "../../types"

type Props = { tasks: Task[] }

function formatDate(d: Date): string {
  return d.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

function firstName(full?: string): string {
  return full?.trim().split(/\s+/)[0] ?? ""
}

export function WelcomeBanner({ tasks }: Props) {
  const { data: user } = useCurrentUser()
  const { data: activeRole } = useCurrentUserActiveRole()

  const [greeting, setGreeting] = useState<string | null>(null)
  useEffect(() => {
    setGreeting(getGreeting())
  }, [])

  const stats = computeTaskStats(tasks)
  const roleName = activeRole?.code ?? "STAFF"

  return (
    <div className="rounded-xl border border-indigo-100 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950 p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
      <div className="relative shrink-0">
        <div className="size-12 rounded-full bg-indigo-200 dark:bg-indigo-800 flex items-center justify-center text-indigo-700 dark:text-indigo-300 font-bold text-lg select-none">
          {(user?.name ?? "U").charAt(0).toUpperCase()}
        </div>
        <span className="absolute bottom-0 right-0 size-3 rounded-full bg-green-400 ring-2 ring-white dark:ring-gray-900" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <h1 className="font-bold text-xl text-gray-900 dark:text-gray-100">
            {greeting ?? "Welcome"}, {firstName(user?.name)}
          </h1>
          <span className="rounded-full border border-indigo-200 dark:border-indigo-700 bg-white dark:bg-gray-900 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-indigo-700 dark:text-indigo-300">
            {roleName}
          </span>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Welcome back. You have{" "}
          <strong className="text-gray-700 dark:text-gray-300">
            {stats.totalPending} pending tasks
          </strong>
          , including{" "}
          <strong className="text-amber-600">{stats.dueTodayCount} due today</strong>.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2 shrink-0">
        <span className="flex items-center gap-1.5 rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-1 text-xs text-gray-600 dark:text-gray-400">
          <CalendarDays size={13} />
          {formatDate(new Date())}
        </span>
        <button
          type="button"
          className="flex items-center gap-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 px-3 py-1.5 text-xs font-medium text-white transition-colors"
        >
          <Settings2 size={13} />
          Customize home
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Commit home-apps dark mode**

```bash
git add src/features/workspace/components/home-apps/recently-accessed.tsx \
        src/features/workspace/components/home-apps/welcome-banner.tsx
git commit -m "feat(workspace): add dark mode to RecentlyAccessed and WelcomeBanner"
```

- [ ] **Step 4: Replace task-row.tsx with dark mode version**

```tsx
// src/features/workspace/components/tasks/task-row.tsx
import { Paperclip } from "lucide-react"
import { getDueDateLabel } from "../../lib/task-utils"
import type { Task } from "../../types"

const PRIORITY_STYLES: Record<Task["priority"], string> = {
  HIGH: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
  MEDIUM: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  NORMAL: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  OVERDUE: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
}

const DUE_COLOR: Record<"red" | "amber" | "normal", string> = {
  red: "text-red-500 font-semibold",
  amber: "text-amber-500 font-semibold",
  normal: "text-gray-700 dark:text-gray-300",
}

function relativeTime(date: Date): string {
  const diffMs = Date.now() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  if (diffDays === 0) return "today"
  if (diffDays === 1) return "yesterday"
  if (diffDays < 7) return `${diffDays} days ago`
  const weeks = Math.floor(diffDays / 7)
  return weeks === 1 ? "1 week ago" : `${weeks} weeks ago`
}

type Props = { task: Task }

export function TaskRow({ task }: Props) {
  const due = getDueDateLabel(task.dueDate)

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 hover:shadow-sm dark:hover:shadow-gray-800 transition-shadow">
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-bold uppercase ${PRIORITY_STYLES[task.priority]}`}
            >
              {task.priority}
            </span>
            <span className="font-mono text-xs text-gray-400 dark:text-gray-500">
              {task.ticketCode}
            </span>
            <span className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">
              {task.category}
            </span>
          </div>

          <p className="font-semibold text-sm text-gray-900 dark:text-gray-100 mb-1.5">
            {task.title}
          </p>

          <div className="flex flex-wrap items-center gap-2 text-xs text-gray-400 dark:text-gray-500">
            <span>Requester: {task.requester}</span>
            <span>•</span>
            <span>{relativeTime(task.submittedAt)}</span>
            {task.attachmentCount > 0 && (
              <>
                <span>•</span>
                <span className="flex items-center gap-0.5">
                  <Paperclip size={11} />
                  {task.attachmentCount} attachment
                  {task.attachmentCount !== 1 ? "s" : ""}
                </span>
              </>
            )}
          </div>
        </div>

        <div className="flex flex-col items-end gap-2 shrink-0 ml-2">
          <div className="text-right">
            <p className="text-xs text-gray-400 dark:text-gray-500">
              Due date threshold
            </p>
            <p className={`text-sm mt-0.5 ${DUE_COLOR[due.color]}`}>
              {due.label}
            </p>
          </div>
          <button
            type="button"
            className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors whitespace-nowrap"
          >
            Review →
          </button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Replace work-summary-sidebar.tsx with dark mode version**

```tsx
// src/features/workspace/components/tasks/work-summary-sidebar.tsx
import { Bookmark } from "lucide-react"
import { computeTaskStats } from "../../lib/task-utils"
import type { Task } from "../../types"

type Props = { tasks: Task[] }

type StatCardProps = {
  count: number
  label: string
  description: string
  accentClass: string
  bgClass: string
  badgeClass: string
}

function StatCard({
  count,
  label,
  description,
  accentClass,
  bgClass,
  badgeClass,
}: StatCardProps) {
  return (
    <div
      className={`rounded-lg p-3 flex items-center justify-between border-l-4 ${accentClass} ${bgClass}`}
    >
      <div>
        <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
          {label}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
          {description}
        </p>
      </div>
      <span className={`rounded-full px-2.5 py-1 text-sm font-bold ${badgeClass}`}>
        {count}
      </span>
    </div>
  )
}

export function WorkSummarySidebar({ tasks }: Props) {
  const stats = computeTaskStats(tasks)
  const pct =
    stats.total > 0
      ? Math.round((stats.completedCount / stats.total) * 100)
      : 0

  return (
    <aside className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 flex flex-col gap-4">
      <h2 className="flex items-center gap-2 font-semibold text-sm text-gray-800 dark:text-gray-200">
        <Bookmark size={15} className="text-indigo-600 dark:text-indigo-400" />
        Workspace Work Summary
      </h2>

      <div className="flex flex-col gap-2">
        <StatCard
          count={stats.overdueCount}
          label={`${stats.overdueCount} Overdue actions`}
          description="Attention required instantly"
          accentClass="border-red-500"
          bgClass="bg-red-50 dark:bg-red-950"
          badgeClass="bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300"
        />
        <StatCard
          count={stats.dueTodayCount}
          label={`${stats.dueTodayCount} Due today`}
          description="Complete before daily deadline"
          accentClass="border-amber-500"
          bgClass="bg-amber-50 dark:bg-amber-950"
          badgeClass="bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300"
        />
        <StatCard
          count={stats.dueThisWeekCount}
          label={`${stats.dueThisWeekCount} Due this week`}
          description="Regular backlog parameters"
          accentClass="border-blue-500"
          bgClass="bg-blue-50 dark:bg-blue-950"
          badgeClass="bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300"
        />
        <StatCard
          count={stats.totalPending}
          label={`${stats.totalPending} Total pending tasks`}
          description="Central process log depth"
          accentClass="border-gray-300 dark:border-gray-600"
          bgClass="bg-gray-50 dark:bg-gray-800"
          badgeClass="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Task Dispatch Resolution Rate
          </span>
          <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
            {stats.completedCount} of {stats.total} tasks completed
          </span>
        </div>
        <div className="h-2 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
          <div
            className="h-2 rounded-full bg-indigo-600 transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5">
          {pct}% Weekly completion quota compliance
        </p>
      </div>
    </aside>
  )
}
```

- [ ] **Step 6: Replace task-list.tsx with dark mode version**

```tsx
// src/features/workspace/components/tasks/task-list.tsx
"use client"

import { useState } from "react"
import type { Task, TaskStatus } from "../../types"
import { TaskRow } from "./task-row"

const TABS: { label: string; status: TaskStatus }[] = [
  { label: "Assigned to me", status: "assigned" },
  { label: "Candidate tasks", status: "candidate" },
  { label: "Created by me", status: "created" },
  { label: "Completed", status: "completed" },
]

type Props = { tasks: Task[]; roleScope: string }

export function TaskList({ tasks, roleScope }: Props) {
  const [activeTab, setActiveTab] = useState<TaskStatus>("assigned")
  const [filter, setFilter] = useState("")

  const counts: Record<TaskStatus, number> = {
    assigned: tasks.filter((t) => t.status === "assigned").length,
    candidate: tasks.filter((t) => t.status === "candidate").length,
    created: tasks.filter((t) => t.status === "created").length,
    completed: tasks.filter((t) => t.status === "completed").length,
  }

  const visible = tasks.filter((t) => {
    if (t.status !== activeTab) return false
    if (!filter.trim()) return true
    const q = filter.toLowerCase()
    return (
      t.title.toLowerCase().includes(q) ||
      t.ticketCode.toLowerCase().includes(q) ||
      t.category.toLowerCase().includes(q)
    )
  })

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-4 pt-4 pb-0">
        <h2 className="font-semibold text-sm text-gray-800 dark:text-gray-200">
          Process Workflow Center{" "}
          <span className="text-gray-400 dark:text-gray-500 font-normal">
            (My Work)
          </span>
        </h2>
        <span className="font-mono text-xs text-gray-400 dark:text-gray-500">
          Role Scope: {roleScope}
        </span>
      </div>

      <div className="flex gap-0 border-b border-gray-200 dark:border-gray-700 px-4 mt-3 overflow-x-auto">
        {TABS.map(({ label, status }) => (
          <button
            key={status}
            type="button"
            onClick={() => setActiveTab(status)}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium whitespace-nowrap transition-colors border-b-2 -mb-px ${
              activeTab === status
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            {label}
            <span
              className={`rounded-full px-1.5 py-0.5 text-xs font-bold ${
                activeTab === status
                  ? "bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
              }`}
            >
              {counts[status]}
            </span>
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 p-4 border-b border-gray-100 dark:border-gray-800">
        <input
          type="search"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filter task titles, workflow names, codes..."
          className="flex-1 min-w-[200px] rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-1.5 text-xs text-gray-700 dark:text-gray-200 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-300"
        />
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-700 max-h-[600px]">
        {visible.length === 0 ? (
          <div className="py-12 text-center text-sm text-gray-400 dark:text-gray-500">
            {filter
              ? "No tasks match your filter."
              : "No tasks in this category."}
          </div>
        ) : (
          visible.map((task) => <TaskRow key={task.id} task={task} />)
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 7: Replace enterprise-workspace.tsx with dark mode version**

```tsx
// src/features/workspace/components/enterprise-workspace.tsx
"use client"

import { CheckSquare, ChevronDown, Home, LayoutDashboard } from "lucide-react"
import { useState } from "react"
import {
  defaultTasks,
  emptyTasks,
  overdueHeavyTasks,
} from "../data/mock-tasks"
import { computeTaskStats } from "../lib/task-utils"
import type { DemoState, Task } from "../types"
import { HomeAppsTab } from "./home-apps/home-apps-tab"
import { TasksTab } from "./tasks/tasks-tab"

type Tab = "home" | "tasks"

const DEMO_STATES: { value: DemoState; label: string; tasks: Task[] }[] = [
  { value: "default", label: "Default", tasks: defaultTasks },
  { value: "empty", label: "Empty state", tasks: emptyTasks },
  { value: "overdue-heavy", label: "Heavy overdue", tasks: overdueHeavyTasks },
]

export function EnterpriseWorkspace() {
  const [activeTab, setActiveTab] = useState<Tab>("home")
  const [demoState, setDemoState] = useState<DemoState>("default")
  const [demoMenuOpen, setDemoMenuOpen] = useState(false)

  const tasks =
    DEMO_STATES.find((s) => s.value === demoState)?.tasks ?? defaultTasks
  const stats = computeTaskStats(tasks)
  const pendingCount = stats.totalPending

  return (
    <div className="relative min-h-0 flex flex-col">
      {/* Tab bar */}
      <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 sticky top-0 z-10">
        <div className="flex gap-0 px-4 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab("home")}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap ${
              activeTab === "home"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            <Home size={15} />
            Home &amp; Apps
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("tasks")}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap ${
              activeTab === "tasks"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            <CheckSquare size={15} />
            My Tasks Workspace
            {pendingCount > 0 && (
              <span className="rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 text-xs font-bold px-1.5 py-0.5 leading-none">
                {pendingCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto p-4 lg:p-6">
        {activeTab === "home" ? (
          <HomeAppsTab tasks={tasks} />
        ) : (
          <TasksTab tasks={tasks} />
        )}
      </div>

      {/* Demo States Menu — fixed bottom-right */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
        {demoMenuOpen && (
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-lg p-2 w-48 flex flex-col gap-1">
            {DEMO_STATES.map((s) => (
              <button
                key={s.value}
                type="button"
                onClick={() => {
                  setDemoState(s.value)
                  setDemoMenuOpen(false)
                }}
                className={`w-full text-left rounded-lg px-3 py-2 text-sm transition-colors ${
                  demoState === s.value
                    ? "bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-400 font-medium"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        )}

        <button
          type="button"
          onClick={() => setDemoMenuOpen((v) => !v)}
          className="flex items-center gap-2 rounded-full bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 px-4 py-2 shadow-lg text-sm font-medium hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
        >
          <LayoutDashboard size={14} />
          Demo States Menu
          <ChevronDown
            size={13}
            className={`transition-transform ${demoMenuOpen ? "rotate-180" : ""}`}
          />
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 8: Verify TypeScript compiles clean**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 9: Run full test suite**

```bash
npx vitest run
```

Expected: All tests pass.

- [ ] **Step 10: Commit task components dark mode**

```bash
git add src/features/workspace/components/tasks/task-row.tsx \
        src/features/workspace/components/tasks/work-summary-sidebar.tsx \
        src/features/workspace/components/tasks/task-list.tsx \
        src/features/workspace/components/enterprise-workspace.tsx
git commit -m "feat(workspace): add dark mode to task components and EnterpriseWorkspace"
```

---

## Final Verification

- [ ] Start dev server: `npm run dev`
- [ ] Toggle dark mode via the sun icon in the IGRP header — all workspace surfaces should invert correctly
- [ ] Toggle the Favorites filter button — pill should animate between neutral and amber states (150ms)
- [ ] Search for an app while favorites filter is on — both filters apply simultaneously
- [ ] Enable Favorites filter with zero favorited apps — amber empty state panel appears
- [ ] Change the sort order — grid fades in with the new order
- [ ] On a card with `status: "OPERATIONAL"` — emerald status badge renders
- [ ] On a card with a description prop — description + divider render below the name
- [ ] Click a star — `stopPropagation` prevents any parent click handler from firing
- [ ] Switch demo states (Default / Empty / Heavy overdue) in dark mode — all stat cards render correctly
