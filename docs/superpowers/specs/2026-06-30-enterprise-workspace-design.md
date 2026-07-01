# Enterprise Workspace — Design Spec
**Date:** 2026-06-30  
**Branch:** design/v2  
**Status:** Approved

---

## Overview

Replace the existing home page (`/`) with an Enterprise Workspace that has two primary tabs: "Home & Apps" and "My Tasks Workspace". The IGRP shell (sidebar, header) remains untouched. The workspace renders inside the shell's content area using the spec's visual language (indigo-600 primary, rounded-xl cards, white/light-gray surfaces) blended with IGRP's existing layout components.

---

## Scope

**In scope:**
- New `features/workspace/` feature module
- Replace `ApplicationsListHome` on the home page (`/`)
- "Home & Apps" tab wired to real apps data (existing queries)
- "My Tasks Workspace" tab with static mock data
- Demo States Menu (floating button, switches mock datasets)
- Fully responsive (stacks to single column on mobile)

**Out of scope:**
- Real task backend / API integration (marked TODO)
- IGRP shell modifications (header, sidebar, footer)
- The spec's top utility bar and header bar (duplicated by IGRP shell)

---

## Architecture

### File Structure

```
src/features/workspace/
├── types.ts
├── data/
│   ├── mock-tasks.ts          # Three named seed arrays
│   └── demo-states.ts         # DemoState config
├── components/
│   ├── enterprise-workspace.tsx         # Root client component
│   ├── home-apps/
│   │   ├── home-apps-tab.tsx
│   │   ├── welcome-banner.tsx
│   │   ├── recently-accessed.tsx
│   │   ├── app-catalog.tsx
│   │   └── app-tile-card.tsx
│   └── tasks/
│       ├── tasks-tab.tsx
│       ├── task-list.tsx
│       ├── task-row.tsx
│       └── work-summary-sidebar.tsx
└── index.ts
```

### Page Wiring

`src/app/(igrp)/(home)/page.tsx` — server component:
1. Prefetch current user + applications via existing prefetch helpers
2. Wrap in `HydrationBoundary`
3. Render `<EnterpriseWorkspace />`

The existing `ApplicationsListHome` component and its prefetch are retired.

---

## Data Model

```ts
// features/workspace/types.ts

type Priority = 'HIGH' | 'MEDIUM' | 'NORMAL' | 'OVERDUE'
type TaskStatus = 'assigned' | 'candidate' | 'created' | 'completed'

type Task = {
  id: string
  ticketCode: string        // e.g. "SUP-2026-0182"
  category: string          // e.g. "Supplier Onboarding"
  title: string
  requester: string
  submittedAt: Date
  attachmentCount: number
  priority: Priority
  dueDate: Date
  status: TaskStatus
}

type DemoState = 'default' | 'empty' | 'overdue-heavy'
```

### Mock Data

Three named exports in `data/mock-tasks.ts`:
- `defaultTasks`: balanced mix of priorities and statuses (~14 tasks)
- `emptyTasks`: `[]`
- `overdueHeavyTasks`: majority OVERDUE / HIGH priority tasks

`dueDate` values are computed relative to `new Date()` so labels ("due today", "overdue by N days") are always current.

---

## Component Behaviour

### `enterprise-workspace.tsx`
- Client component; owns `activeTab` and `demoState` state
- Derives `tasks: Task[]` from `demoState` (selects one of three mock arrays)
- Renders tab bar + active tab content
- Renders floating Demo States Menu (fixed bottom-right)
- Tab bar: underline style, `border-b-2 border-indigo-600` active indicator
- Count badge on Tasks tab: `tasks.filter(t => t.status !== 'completed').length`

### `welcome-banner.tsx`
- Receives real `user` (from `useCurrentUser()`) and `tasks` prop
- Greeting: computed from `new Date().getHours()` ("Good morning / afternoon / evening")
- `pendingCount`: `tasks.filter(t => t.status !== 'completed').length`
- `dueTodayCount`: tasks where `dueDate` date matches today

### `app-catalog.tsx`
- Client; owns `search`, `showFavoritesOnly`, `viewMode`, `sortBy`
- Consumes real apps from existing `useApplications()` hook
- Filters/sorts derived in `useMemo` — no extra queries
- Grid: `grid-cols-2 md:grid-cols-3 lg:grid-cols-4`
- List: `flex flex-col gap-2`

### `app-tile-card.tsx`
- Receives app + `onToggleFavorite` callback
- Star toggle calls existing favorite mutation; falls back to local state if mutation unavailable
- No status pill: `ApplicationDTO.status` is `ACTIVE | INACTIVE | DELETED` — no maintenance concept exists in the real API

### `task-list.tsx`
- Client; owns `activeSubTab: TaskStatus`, `filter: string`, `processFilter`
- Receives `tasks` from parent
- Filters: `tasks.filter(t => t.status === activeSubTab && titleMatchesFilter(t, filter))`
- Custom thin scrollbar via `scrollbar-thin scrollbar-thumb-gray-200`

### `work-summary-sidebar.tsx`
- Pure display component; receives full `tasks` array
- All stats computed from `tasks`:
  - Overdue: `priority === 'OVERDUE'`
  - Due today: `dueDate` matches today
  - Due this week: `dueDate` within current week
  - Total pending: `status !== 'completed'`
- Progress: `completed.length / total.length`
- Progress bar width: `style={{ width: \`${pct}%\` }}`

---

## Visual Design

### Color Tokens (Tailwind utilities)

| Role | Class |
|---|---|
| Primary / active | `text-indigo-600`, `bg-indigo-600`, `border-indigo-600` |
| Overdue | `text-red-500`, `bg-red-50`, `border-red-500` |
| Warning / due today | `text-amber-500`, `bg-amber-50`, `border-amber-500` |
| Informational | `text-blue-500`, `bg-blue-50`, `border-blue-500` |
| Neutral | `text-gray-500` |
| Monospace | `font-mono` (ticket codes, role scope) |

### Cards
`rounded-xl border border-gray-200 bg-white` base. `hover:shadow-md transition-shadow` on interactive cards.

### Welcome Banner
`bg-indigo-50 border border-indigo-100 rounded-xl p-6`. Role pill: `bg-white border text-xs font-semibold uppercase tracking-wide`. "Customize home" button: `bg-indigo-600 text-white rounded-lg`.

### Tab Bar
`border-b border-gray-200`. Active tab: `border-b-2 border-indigo-600 text-indigo-600 font-medium`. Inactive: `text-gray-500 hover:text-gray-700`.

### Task Row
Priority badge: `rounded-full px-2 py-0.5 text-xs font-bold uppercase`:
- HIGH: `bg-amber-100 text-amber-700`
- MEDIUM: `bg-blue-100 text-blue-700`
- NORMAL: `bg-gray-100 text-gray-600`
- OVERDUE: `bg-red-100 text-red-700`

Due date color: `text-red-500` overdue, `text-amber-500` today, `text-gray-700` otherwise.

### Work Summary Sidebar Cards
`rounded-lg p-3 border-l-4`:
- Overdue: `border-red-500 bg-red-50`
- Due today: `border-amber-500 bg-amber-50`
- Due this week: `border-blue-500 bg-blue-50`
- Total: `border-gray-300 bg-gray-50`

### Two-Column Task Layout
`grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6`

### Demo States Menu
```
fixed bottom-6 right-6 z-50
```
Button: `bg-gray-900 text-white rounded-full px-4 py-2 shadow-lg text-sm font-medium`  
Panel: `bg-white rounded-xl border shadow-lg p-3 mb-2 w-48`  
Active row: `bg-indigo-50 text-indigo-700 rounded-lg`

### Recently Accessed Row
`flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-200`  
Each card: `min-w-[160px]` (5 visible before scrolling on desktop)

---

## Interactions

| Interaction | Implementation |
|---|---|
| Tab switching | `useState` in `enterprise-workspace.tsx` |
| Sub-tab switching (tasks) | `useState` in `task-list.tsx` |
| App search | `useState` in `app-catalog.tsx`, filtered in `useMemo` |
| Task filter | `useState` in `task-list.tsx` |
| Favorite toggle | Existing favorite mutation; local state fallback |
| Grid/list toggle | `useState` in `app-catalog.tsx` |
| Demo States Menu | `useState` in `enterprise-workspace.tsx` |

---

## What's NOT Changing

- IGRP shell (sidebar, header, top bar, footer)
- Auth flow, middleware, NextAuth config
- Settings pages (`/settings/*`)
- Profile page (`/profile`)
- All existing feature modules (applications, users, departments, etc.)
- Server actions and API routes

---

## Future Work (out of scope)

- Wire `My Tasks Workspace` to a real task management API
- "Customize home" modal
- Full-text search across apps + tasks + actions (⌘K palette)
- Notification bell data
