# Enterprise Workspace Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the home page (`/`) with a two-tab Enterprise Workspace: "Home & Apps" (real app data) and "My Tasks Workspace" (mock data), rendered inside the existing IGRP shell.

**Architecture:** New `features/workspace/` module with its own types, mock data, utility functions, and components. The IGRP shell stays untouched. The home page server component prefetches user + app data via the existing `prefetchCurrentUserDashboard`, then renders `EnterpriseWorkspace` inside `HydrationBoundary`.

**Tech Stack:** Next.js 15 App Router, TypeScript (strict), Tailwind CSS v4, TanStack Query v5, lucide-react, `@igrp/platform-access-management-client-ts` (ApplicationDTO, IGRPUserDTO), shadcn/ui (radix-luma).

## Global Constraints

- No new backend endpoints — apps use existing queries; tasks use mock data only
- All new components under `src/features/workspace/`
- Follow the existing import alias `@/` for `src/`
- Use Tailwind utility classes directly for the workspace visual style (indigo-600 primary); do NOT use IGRP Horizon design tokens for new workspace components unless they already match
- `"use client"` only where state or hooks are required; prefer server components where possible
- `ApplicationDTO` is imported from `@igrp/platform-access-management-client-ts`
- `IGRPUserDTO`, `RoleDTO` are imported from `@igrp/platform-access-management-client-ts`
- Test command: `npx vitest run <path>`
- Biome is the linter/formatter — run `npx biome check --write <file>` after editing

---

## File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `src/features/workspace/types.ts` | Create | Task, DemoState TypeScript types |
| `src/features/workspace/data/mock-tasks.ts` | Create | Three named seed arrays for demo states |
| `src/features/workspace/lib/task-utils.ts` | Create | Pure helper functions (greeting, due-date label, stats) |
| `src/features/workspace/lib/app-utils.ts` | Create | Pure helper (app tile color derivation) |
| `src/features/workspace/lib/task-utils.test.ts` | Create | Unit tests for task-utils |
| `src/features/workspace/lib/app-utils.test.ts` | Create | Unit tests for app-utils |
| `src/features/workspace/components/home-apps/app-tile-card.tsx` | Create | Reusable app card (star, colored icon) |
| `src/features/workspace/components/home-apps/recently-accessed.tsx` | Create | Horizontal scroll row of recent apps |
| `src/features/workspace/components/home-apps/app-catalog.tsx` | Create | Full catalog with search/filter/grid-list toggle |
| `src/features/workspace/components/home-apps/welcome-banner.tsx` | Create | Greeting banner with user info and task counts |
| `src/features/workspace/components/home-apps/home-apps-tab.tsx` | Create | Assembles all Home & Apps sub-components |
| `src/features/workspace/components/tasks/task-row.tsx` | Create | Individual task card (pure display) |
| `src/features/workspace/components/tasks/work-summary-sidebar.tsx` | Create | Right-column stats sidebar |
| `src/features/workspace/components/tasks/task-list.tsx` | Create | Left column: sub-tabs + filter + scrollable list |
| `src/features/workspace/components/tasks/tasks-tab.tsx` | Create | Two-column layout container |
| `src/features/workspace/components/enterprise-workspace.tsx` | Create | Root client component: tab bar + demo states menu |
| `src/features/workspace/index.ts` | Create | Public export barrel |
| `src/app/(igrp)/(home)/page.tsx` | Modify | Wire in EnterpriseWorkspace, retire ApplicationsListHome |

---

## Task 1: Types and Mock Data

**Files:**
- Create: `src/features/workspace/types.ts`
- Create: `src/features/workspace/data/mock-tasks.ts`

**Interfaces:**
- Produces: `Task`, `DemoState`, `defaultTasks`, `emptyTasks`, `overdueHeavyTasks`

- [ ] **Step 1: Create types**

```ts
// src/features/workspace/types.ts

export type Priority = 'HIGH' | 'MEDIUM' | 'NORMAL' | 'OVERDUE'
export type TaskStatus = 'assigned' | 'candidate' | 'created' | 'completed'

export type Task = {
  id: string
  ticketCode: string
  category: string
  title: string
  requester: string
  submittedAt: Date
  attachmentCount: number
  priority: Priority
  dueDate: Date
  status: TaskStatus
}

export type DemoState = 'default' | 'empty' | 'overdue-heavy'
```

- [ ] **Step 2: Create mock data**

```ts
// src/features/workspace/data/mock-tasks.ts
import type { Task } from '../types'

function daysFromNow(n: number): Date {
  const d = new Date()
  d.setDate(d.getDate() + n)
  d.setHours(17, 0, 0, 0)
  return d
}

function daysAgo(n: number): Date {
  return daysFromNow(-n)
}

export const defaultTasks: Task[] = [
  {
    id: '1',
    ticketCode: 'SUP-2026-0182',
    category: 'Supplier Onboarding',
    title: 'Review new supplier registration for MedEquip Lda',
    requester: 'Ana Monteiro',
    submittedAt: daysAgo(2),
    attachmentCount: 3,
    priority: 'HIGH',
    dueDate: daysFromNow(0),
    status: 'assigned',
  },
  {
    id: '2',
    ticketCode: 'PRO-2026-0091',
    category: 'Procurement Approval',
    title: 'Approve purchase order — IT infrastructure renewal Q3',
    requester: 'Carlos Évora',
    submittedAt: daysAgo(5),
    attachmentCount: 1,
    priority: 'OVERDUE',
    dueDate: daysFromNow(-2),
    status: 'assigned',
  },
  {
    id: '3',
    ticketCode: 'HR-2026-0044',
    category: 'HR Compliance',
    title: 'Validate updated employment contract for new hire',
    requester: 'Joana Ferreira',
    submittedAt: daysAgo(1),
    attachmentCount: 2,
    priority: 'MEDIUM',
    dueDate: daysFromNow(3),
    status: 'assigned',
  },
  {
    id: '4',
    ticketCode: 'FIN-2026-0210',
    category: 'Finance Review',
    title: 'Authorise budget transfer — Department Operations Fund',
    requester: 'Miguel Santos',
    submittedAt: daysAgo(3),
    attachmentCount: 0,
    priority: 'HIGH',
    dueDate: daysFromNow(1),
    status: 'assigned',
  },
  {
    id: '5',
    ticketCode: 'DOC-2026-0033',
    category: 'Document Verification',
    title: 'Certify scanned archives for internal audit trail',
    requester: 'Inês Tavares',
    submittedAt: daysAgo(7),
    attachmentCount: 8,
    priority: 'NORMAL',
    dueDate: daysFromNow(5),
    status: 'assigned',
  },
  {
    id: '6',
    ticketCode: 'SUP-2026-0195',
    category: 'Supplier Onboarding',
    title: 'Second review — BuildTech Cabo Verde compliance docs',
    requester: 'Rui Almada',
    submittedAt: daysAgo(1),
    attachmentCount: 4,
    priority: 'MEDIUM',
    dueDate: daysFromNow(2),
    status: 'candidate',
  },
  {
    id: '7',
    ticketCode: 'CON-2026-0017',
    category: 'Contract Management',
    title: 'Initial review — service contract extension Telenet',
    requester: 'Sofia Lopes',
    submittedAt: daysAgo(0),
    attachmentCount: 2,
    priority: 'NORMAL',
    dueDate: daysFromNow(7),
    status: 'candidate',
  },
  {
    id: '8',
    ticketCode: 'IT-2026-0058',
    category: 'IT Operations',
    title: 'Request new VPN credentials for remote team members',
    requester: 'Fidel da Luz',
    submittedAt: daysAgo(4),
    attachmentCount: 0,
    priority: 'NORMAL',
    dueDate: daysFromNow(10),
    status: 'created',
  },
  {
    id: '9',
    ticketCode: 'FIN-2026-0198',
    category: 'Finance Review',
    title: 'Quarterly expense report — Operations Division',
    requester: 'Ana Monteiro',
    submittedAt: daysAgo(14),
    attachmentCount: 5,
    priority: 'NORMAL',
    dueDate: daysFromNow(-7),
    status: 'completed',
  },
]

export const emptyTasks: Task[] = []

export const overdueHeavyTasks: Task[] = [
  {
    id: '10',
    ticketCode: 'SUP-2026-0170',
    category: 'Supplier Onboarding',
    title: 'URGENT — Incomplete documentation AgroFresh SA',
    requester: 'Ana Monteiro',
    submittedAt: daysAgo(10),
    attachmentCount: 1,
    priority: 'OVERDUE',
    dueDate: daysFromNow(-5),
    status: 'assigned',
  },
  {
    id: '11',
    ticketCode: 'PRO-2026-0080',
    category: 'Procurement Approval',
    title: 'Overdue — Emergency equipment procurement approval',
    requester: 'Carlos Évora',
    submittedAt: daysAgo(8),
    attachmentCount: 2,
    priority: 'OVERDUE',
    dueDate: daysFromNow(-3),
    status: 'assigned',
  },
  {
    id: '12',
    ticketCode: 'HR-2026-0039',
    category: 'HR Compliance',
    title: 'Past deadline — Annual performance review sign-off',
    requester: 'Joana Ferreira',
    submittedAt: daysAgo(12),
    attachmentCount: 0,
    priority: 'OVERDUE',
    dueDate: daysFromNow(-1),
    status: 'assigned',
  },
  {
    id: '13',
    ticketCode: 'FIN-2026-0201',
    category: 'Finance Review',
    title: 'Critical — Missing invoices FY2025 audit package',
    requester: 'Miguel Santos',
    submittedAt: daysAgo(6),
    attachmentCount: 0,
    priority: 'HIGH',
    dueDate: daysFromNow(0),
    status: 'assigned',
  },
  {
    id: '14',
    ticketCode: 'DOC-2026-0029',
    category: 'Document Verification',
    title: 'Overdue — Heritage archive digitisation sign-off',
    requester: 'Inês Tavares',
    submittedAt: daysAgo(9),
    attachmentCount: 6,
    priority: 'OVERDUE',
    dueDate: daysFromNow(-4),
    status: 'assigned',
  },
  {
    id: '15',
    ticketCode: 'CON-2026-0012',
    category: 'Contract Management',
    title: 'Overdue review — maintenance contract Atlas Elevadores',
    requester: 'Sofia Lopes',
    submittedAt: daysAgo(7),
    attachmentCount: 3,
    priority: 'OVERDUE',
    dueDate: daysFromNow(-2),
    status: 'candidate',
  },
  {
    id: '16',
    ticketCode: 'FIN-2026-0185',
    category: 'Finance Review',
    title: 'Late — Supplier payment reconciliation July batch',
    requester: 'Miguel Santos',
    submittedAt: daysAgo(15),
    attachmentCount: 4,
    priority: 'NORMAL',
    dueDate: daysFromNow(4),
    status: 'completed',
  },
]
```

- [ ] **Step 3: Commit**

```bash
git add src/features/workspace/types.ts src/features/workspace/data/mock-tasks.ts
git commit -m "feat(workspace): add Task types and mock task seed data"
```

---

## Task 2: Pure Utility Functions + Tests

**Files:**
- Create: `src/features/workspace/lib/task-utils.ts`
- Create: `src/features/workspace/lib/app-utils.ts`
- Create: `src/features/workspace/lib/task-utils.test.ts`
- Create: `src/features/workspace/lib/app-utils.test.ts`

**Interfaces:**
- Consumes: `Task` from `../types`
- Produces:
  - `getGreeting(date: Date): string`
  - `getDueDateLabel(dueDate: Date, now?: Date): { label: string; color: 'red' | 'amber' | 'normal' }`
  - `computeTaskStats(tasks: Task[]): TaskStats`
  - `getAppTileColor(code: string): { bg: string; text: string }`

- [ ] **Step 1: Write failing tests for task-utils**

```ts
// src/features/workspace/lib/task-utils.test.ts
import { describe, expect, it } from 'vitest'
import { computeTaskStats, getDueDateLabel, getGreeting } from './task-utils'
import type { Task } from '../types'

function makeDate(h: number) {
  const d = new Date()
  d.setHours(h, 0, 0, 0)
  return d
}

function daysFromNow(n: number): Date {
  const d = new Date()
  d.setDate(d.getDate() + n)
  d.setHours(17, 0, 0, 0)
  return d
}

describe('getGreeting', () => {
  it('returns morning for hour < 12', () => {
    expect(getGreeting(makeDate(8))).toBe('Good morning')
  })
  it('returns afternoon for 12 <= hour < 19', () => {
    expect(getGreeting(makeDate(14))).toBe('Good afternoon')
  })
  it('returns evening for hour >= 19', () => {
    expect(getGreeting(makeDate(20))).toBe('Good evening')
  })
})

describe('getDueDateLabel', () => {
  it('marks overdue when dueDate is in the past', () => {
    const result = getDueDateLabel(daysFromNow(-2))
    expect(result.color).toBe('red')
    expect(result.label).toMatch(/overdue/i)
  })
  it('marks today when dueDate is today', () => {
    const result = getDueDateLabel(daysFromNow(0))
    expect(result.color).toBe('amber')
    expect(result.label).toBe('Due today')
  })
  it('marks tomorrow', () => {
    const result = getDueDateLabel(daysFromNow(1))
    expect(result.color).toBe('normal')
    expect(result.label).toBe('Due tomorrow')
  })
  it('marks future days', () => {
    const result = getDueDateLabel(daysFromNow(5))
    expect(result.color).toBe('normal')
    expect(result.label).toBe('Due in 5 days')
  })
})

describe('computeTaskStats', () => {
  const now = new Date()

  function taskWith(overrides: Partial<Task>): Task {
    return {
      id: '1',
      ticketCode: 'T-001',
      category: 'Test',
      title: 'Test task',
      requester: 'User',
      submittedAt: new Date(),
      attachmentCount: 0,
      priority: 'NORMAL',
      dueDate: daysFromNow(10),
      status: 'assigned',
      ...overrides,
    }
  }

  it('counts overdue tasks (priority OVERDUE)', () => {
    const tasks = [
      taskWith({ id: '1', priority: 'OVERDUE', status: 'assigned' }),
      taskWith({ id: '2', priority: 'HIGH', status: 'assigned' }),
    ]
    expect(computeTaskStats(tasks).overdueCount).toBe(1)
  })

  it('counts due today', () => {
    const today = new Date()
    today.setHours(17, 0, 0, 0)
    const tasks = [
      taskWith({ id: '1', dueDate: today, status: 'assigned' }),
      taskWith({ id: '2', dueDate: daysFromNow(3), status: 'assigned' }),
    ]
    expect(computeTaskStats(tasks).dueTodayCount).toBe(1)
  })

  it('counts total pending (non-completed)', () => {
    const tasks = [
      taskWith({ id: '1', status: 'assigned' }),
      taskWith({ id: '2', status: 'candidate' }),
      taskWith({ id: '3', status: 'completed' }),
    ]
    expect(computeTaskStats(tasks).totalPending).toBe(2)
  })

  it('counts completed', () => {
    const tasks = [
      taskWith({ id: '1', status: 'completed' }),
      taskWith({ id: '2', status: 'assigned' }),
    ]
    const stats = computeTaskStats(tasks)
    expect(stats.completedCount).toBe(1)
    expect(stats.total).toBe(2)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run src/features/workspace/lib/task-utils.test.ts
```

Expected: FAIL with "Cannot find module './task-utils'"

- [ ] **Step 3: Implement task-utils**

```ts
// src/features/workspace/lib/task-utils.ts
import type { Task } from '../types'

export function getGreeting(now = new Date()): string {
  const h = now.getHours()
  if (h < 12) return 'Good morning'
  if (h < 19) return 'Good afternoon'
  return 'Good evening'
}

export type DueDateResult = {
  label: string
  color: 'red' | 'amber' | 'normal'
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

export function getDueDateLabel(dueDate: Date, now = new Date()): DueDateResult {
  const today = new Date(now)
  today.setHours(0, 0, 0, 0)
  const due = new Date(dueDate)
  due.setHours(0, 0, 0, 0)

  const diffMs = due.getTime() - today.getTime()
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays < 0) {
    const abs = Math.abs(diffDays)
    return {
      label: abs === 1 ? 'Overdue by 1 day' : `Overdue by ${abs} days`,
      color: 'red',
    }
  }
  if (diffDays === 0) return { label: 'Due today', color: 'amber' }
  if (diffDays === 1) return { label: 'Due tomorrow', color: 'normal' }
  return { label: `Due in ${diffDays} days`, color: 'normal' }
}

export type TaskStats = {
  overdueCount: number
  dueTodayCount: number
  dueThisWeekCount: number
  totalPending: number
  completedCount: number
  total: number
}

export function computeTaskStats(tasks: Task[]): TaskStats {
  const now = new Date()
  const todayStart = new Date(now)
  todayStart.setHours(0, 0, 0, 0)
  const weekEnd = new Date(todayStart)
  weekEnd.setDate(weekEnd.getDate() + 7)

  let overdueCount = 0
  let dueTodayCount = 0
  let dueThisWeekCount = 0
  let totalPending = 0
  let completedCount = 0

  for (const task of tasks) {
    if (task.status === 'completed') {
      completedCount++
      continue
    }
    totalPending++
    if (task.priority === 'OVERDUE') overdueCount++
    const due = new Date(task.dueDate)
    due.setHours(0, 0, 0, 0)
    if (isSameDay(due, todayStart)) dueTodayCount++
    if (due >= todayStart && due < weekEnd) dueThisWeekCount++
  }

  return {
    overdueCount,
    dueTodayCount,
    dueThisWeekCount,
    totalPending,
    completedCount,
    total: tasks.length,
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run src/features/workspace/lib/task-utils.test.ts
```

Expected: All tests PASS.

- [ ] **Step 5: Write failing tests for app-utils**

```ts
// src/features/workspace/lib/app-utils.test.ts
import { describe, expect, it } from 'vitest'
import { getAppTileColor } from './app-utils'

describe('getAppTileColor', () => {
  it('returns an object with bg and text keys', () => {
    const result = getAppTileColor('APP_HR')
    expect(result).toHaveProperty('bg')
    expect(result).toHaveProperty('text')
  })

  it('returns deterministic result for the same code', () => {
    expect(getAppTileColor('APP_FINANCE')).toEqual(getAppTileColor('APP_FINANCE'))
  })

  it('returns different colors for different codes (statistically)', () => {
    const codes = ['APP_HR', 'APP_FIN', 'APP_DOC', 'APP_PRO', 'APP_CON']
    const results = codes.map(getAppTileColor)
    const bgs = results.map(r => r.bg)
    const unique = new Set(bgs)
    expect(unique.size).toBeGreaterThan(1)
  })
})
```

- [ ] **Step 6: Run tests to verify they fail**

```bash
npx vitest run src/features/workspace/lib/app-utils.test.ts
```

Expected: FAIL with "Cannot find module './app-utils'"

- [ ] **Step 7: Implement app-utils**

```ts
// src/features/workspace/lib/app-utils.ts

type AppTileColor = { bg: string; text: string }

const TILE_COLORS: AppTileColor[] = [
  { bg: 'bg-indigo-100', text: 'text-indigo-700' },
  { bg: 'bg-blue-100', text: 'text-blue-700' },
  { bg: 'bg-purple-100', text: 'text-purple-700' },
  { bg: 'bg-emerald-100', text: 'text-emerald-700' },
  { bg: 'bg-amber-100', text: 'text-amber-700' },
  { bg: 'bg-rose-100', text: 'text-rose-700' },
  { bg: 'bg-cyan-100', text: 'text-cyan-700' },
  { bg: 'bg-orange-100', text: 'text-orange-700' },
]

export function getAppTileColor(code: string): AppTileColor {
  let hash = 0
  for (let i = 0; i < code.length; i++) {
    hash = (hash * 31 + code.charCodeAt(i)) & 0xffff
  }
  return TILE_COLORS[hash % TILE_COLORS.length]
}
```

- [ ] **Step 8: Run tests to verify they pass**

```bash
npx vitest run src/features/workspace/lib/app-utils.test.ts
```

Expected: All tests PASS.

- [ ] **Step 9: Commit**

```bash
git add src/features/workspace/lib/
git commit -m "feat(workspace): add task and app utility functions with tests"
```

---

## Task 3: AppTileCard Component

**Files:**
- Create: `src/features/workspace/components/home-apps/app-tile-card.tsx`

**Interfaces:**
- Consumes: `ApplicationDTO` from `@igrp/platform-access-management-client-ts`, `getAppTileColor` from `../../lib/app-utils`
- Produces: `<AppTileCard app isFavorite onToggleFavorite lastOpenedLabel? />`

- [ ] **Step 1: Create app-tile-card**

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
}

export function AppTileCard({ app, isFavorite, onToggleFavorite, lastOpenedLabel }: Props) {
  const color = getAppTileColor(app.code)
  const initial = (app.name ?? app.code).charAt(0).toUpperCase()

  return (
    <div className="relative rounded-xl border border-gray-200 bg-white p-4 hover:shadow-md transition-shadow flex flex-col gap-3 min-w-0">
      <button
        type="button"
        aria-label={isFavorite ? "Remove from favourites" : "Add to favourites"}
        className="absolute top-3 right-3 text-gray-300 hover:text-amber-400 transition-colors"
        onClick={() => onToggleFavorite(app, isFavorite)}
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

        <div className="flex flex-col gap-0.5 min-w-0">
          <span className="font-semibold text-sm text-gray-900 truncate">{app.name}</span>
          {lastOpenedLabel && (
            <span className="text-xs text-gray-400">{lastOpenedLabel}</span>
          )}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: No errors in `app-tile-card.tsx`.

- [ ] **Step 3: Commit**

```bash
git add src/features/workspace/components/home-apps/app-tile-card.tsx
git commit -m "feat(workspace): add AppTileCard component"
```

---

## Task 4: RecentlyAccessed Component

**Files:**
- Create: `src/features/workspace/components/home-apps/recently-accessed.tsx`

**Interfaces:**
- Consumes: `useGetCurrentUserRecentApplications` from `@/features/users/use-users`, `useCurrentUserFavoriteApplications`, `useAddCurrentUserFavoriteApplication`, `useRemoveCurrentUserFavoriteApplication`, `AppTileCard`
- Produces: `<RecentlyAccessed />`

- [ ] **Step 1: Create recently-accessed**

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
        <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
          Recently Accessed
        </span>
        <button type="button" className="text-xs text-indigo-600 hover:underline">
          View all catalog →
        </button>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-200">
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

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/features/workspace/components/home-apps/recently-accessed.tsx
git commit -m "feat(workspace): add RecentlyAccessed component"
```

---

## Task 5: AppCatalog Component

**Files:**
- Create: `src/features/workspace/components/home-apps/app-catalog.tsx`

**Interfaces:**
- Consumes: `useCurrentUserApplications`, `useCurrentUserFavoriteApplications`, `useAddCurrentUserFavoriteApplication`, `useRemoveCurrentUserFavoriteApplication` from `@/features/users/use-users`, `AppTileCard`
- Produces: `<AppCatalog />`

- [ ] **Step 1: Create app-catalog**

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

  const favCodes = useMemo(() => new Set(favorites.map((f) => f.code)), [favorites])

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
          className="flex-1 min-w-[200px] rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-300"
        />

        <button
          type="button"
          onClick={() => setShowFavoritesOnly((v) => !v)}
          className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
            showFavoritesOnly
              ? "border-amber-400 bg-amber-50 text-amber-700"
              : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
          }`}
        >
          <Star size={14} className={showFavoritesOnly ? "fill-amber-400 text-amber-400" : ""} />
          Favorites
        </button>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortBy)}
          className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-300"
        >
          <option value="default">Sort: Recommended</option>
          <option value="name">Sort: Name A–Z</option>
        </select>

        <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
          <button
            type="button"
            onClick={() => setViewMode("grid")}
            className={`p-1.5 transition-colors ${
              viewMode === "grid" ? "bg-indigo-50 text-indigo-600" : "bg-white text-gray-500 hover:bg-gray-50"
            }`}
            aria-label="Grid view"
          >
            <LayoutGrid size={16} />
          </button>
          <button
            type="button"
            onClick={() => setViewMode("list")}
            className={`p-1.5 transition-colors ${
              viewMode === "list" ? "bg-indigo-50 text-indigo-600" : "bg-white text-gray-500 hover:bg-gray-50"
            }`}
            aria-label="List view"
          >
            <List size={16} />
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 py-12 text-center text-sm text-gray-400">
          No applications match your search.
        </div>
      ) : (
        <div
          className={
            viewMode === "grid"
              ? "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3"
              : "flex flex-col gap-2"
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
git commit -m "feat(workspace): add AppCatalog with search, favorites filter, and grid/list toggle"
```

---

## Task 6: WelcomeBanner Component

**Files:**
- Create: `src/features/workspace/components/home-apps/welcome-banner.tsx`

**Interfaces:**
- Consumes: `useCurrentUser`, `useCurrentUserActiveRole` from `@/features/users/use-users`, `getGreeting`, `TaskStats` from `../../lib/task-utils`, `Task` from `../../types`
- Produces: `<WelcomeBanner tasks={Task[]} />`

- [ ] **Step 1: Create welcome-banner**

```tsx
// src/features/workspace/components/home-apps/welcome-banner.tsx
"use client"

import { CalendarDays, Settings2 } from "lucide-react"
import { useEffect, useState } from "react"
import { useCurrentUser, useCurrentUserActiveRole } from "@/features/users/use-users"
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
    <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
      <div className="relative shrink-0">
        <div className="size-12 rounded-full bg-indigo-200 flex items-center justify-center text-indigo-700 font-bold text-lg select-none">
          {(user?.name ?? "U").charAt(0).toUpperCase()}
        </div>
        <span className="absolute bottom-0 right-0 size-3 rounded-full bg-green-400 ring-2 ring-white" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <h1 className="font-bold text-xl text-gray-900">
            {greeting ?? "Welcome"}, {firstName(user?.name)}
          </h1>
          <span className="rounded-full border border-indigo-200 bg-white px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-indigo-700">
            {roleName}
          </span>
        </div>
        <p className="text-sm text-gray-500">
          Welcome back. You have{" "}
          <strong className="text-gray-700">{stats.totalPending} pending tasks</strong>,
          including{" "}
          <strong className="text-amber-600">{stats.dueTodayCount} due today</strong>.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2 shrink-0">
        <span className="flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1 text-xs text-gray-600">
          <CalendarDays size={13} />
          {formatDate(new Date())}
        </span>
        <button
          type="button"
          className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 transition-colors"
        >
          <Settings2 size={13} />
          Customize home
        </button>
      </div>
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
git add src/features/workspace/components/home-apps/welcome-banner.tsx
git commit -m "feat(workspace): add WelcomeBanner with real user data and task counts"
```

---

## Task 7: HomeAppsTab Component

**Files:**
- Create: `src/features/workspace/components/home-apps/home-apps-tab.tsx`

**Interfaces:**
- Consumes: `WelcomeBanner`, `RecentlyAccessed`, `AppCatalog`
- Produces: `<HomeAppsTab tasks={Task[]} />`

- [ ] **Step 1: Create home-apps-tab**

```tsx
// src/features/workspace/components/home-apps/home-apps-tab.tsx
import type { Task } from "../../types"
import { AppCatalog } from "./app-catalog"
import { RecentlyAccessed } from "./recently-accessed"
import { WelcomeBanner } from "./welcome-banner"

type Props = { tasks: Task[] }

export function HomeAppsTab({ tasks }: Props) {
  return (
    <div className="flex flex-col gap-6">
      <WelcomeBanner tasks={tasks} />
      <RecentlyAccessed />
      <AppCatalog />
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
git add src/features/workspace/components/home-apps/home-apps-tab.tsx
git commit -m "feat(workspace): add HomeAppsTab container"
```

---

## Task 8: TaskRow Component

**Files:**
- Create: `src/features/workspace/components/tasks/task-row.tsx`

**Interfaces:**
- Consumes: `Task` from `../../types`, `getDueDateLabel` from `../../lib/task-utils`
- Produces: `<TaskRow task={Task} />`

- [ ] **Step 1: Create task-row**

```tsx
// src/features/workspace/components/tasks/task-row.tsx
import { Paperclip } from "lucide-react"
import { getDueDateLabel } from "../../lib/task-utils"
import type { Task } from "../../types"

const PRIORITY_STYLES: Record<Task["priority"], string> = {
  HIGH: "bg-amber-100 text-amber-700",
  MEDIUM: "bg-blue-100 text-blue-700",
  NORMAL: "bg-gray-100 text-gray-600",
  OVERDUE: "bg-red-100 text-red-700",
}

const DUE_COLOR: Record<"red" | "amber" | "normal", string> = {
  red: "text-red-500 font-semibold",
  amber: "text-amber-500 font-semibold",
  normal: "text-gray-700",
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
    <div className="rounded-xl border border-gray-200 bg-white p-4 hover:shadow-sm transition-shadow">
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-bold uppercase ${PRIORITY_STYLES[task.priority]}`}
            >
              {task.priority}
            </span>
            <span className="font-mono text-xs text-gray-400">{task.ticketCode}</span>
            <span className="text-xs text-indigo-600 font-medium">{task.category}</span>
          </div>

          <p className="font-semibold text-sm text-gray-900 mb-1.5">{task.title}</p>

          <div className="flex flex-wrap items-center gap-2 text-xs text-gray-400">
            <span>Requester: {task.requester}</span>
            <span>•</span>
            <span>{relativeTime(task.submittedAt)}</span>
            {task.attachmentCount > 0 && (
              <>
                <span>•</span>
                <span className="flex items-center gap-0.5">
                  <Paperclip size={11} />
                  {task.attachmentCount} attachment{task.attachmentCount !== 1 ? "s" : ""}
                </span>
              </>
            )}
          </div>
        </div>

        <div className="flex flex-col items-end gap-2 shrink-0 ml-2">
          <div className="text-right">
            <p className="text-xs text-gray-400">Due date threshold</p>
            <p className={`text-sm mt-0.5 ${DUE_COLOR[due.color]}`}>{due.label}</p>
          </div>
          <button
            type="button"
            className="text-xs font-medium text-indigo-600 hover:text-indigo-800 transition-colors whitespace-nowrap"
          >
            Review →
          </button>
        </div>
      </div>
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
git add src/features/workspace/components/tasks/task-row.tsx
git commit -m "feat(workspace): add TaskRow component with priority badges and due-date coloring"
```

---

## Task 9: WorkSummarySidebar Component

**Files:**
- Create: `src/features/workspace/components/tasks/work-summary-sidebar.tsx`

**Interfaces:**
- Consumes: `Task` from `../../types`, `computeTaskStats`, `TaskStats` from `../../lib/task-utils`
- Produces: `<WorkSummarySidebar tasks={Task[]} />`

- [ ] **Step 1: Create work-summary-sidebar**

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

function StatCard({ count, label, description, accentClass, bgClass, badgeClass }: StatCardProps) {
  return (
    <div className={`rounded-lg p-3 flex items-center justify-between border-l-4 ${accentClass} ${bgClass}`}>
      <div>
        <p className="text-sm font-semibold text-gray-800">{label}</p>
        <p className="text-xs text-gray-500 mt-0.5">{description}</p>
      </div>
      <span className={`rounded-full px-2.5 py-1 text-sm font-bold ${badgeClass}`}>
        {count}
      </span>
    </div>
  )
}

export function WorkSummarySidebar({ tasks }: Props) {
  const stats = computeTaskStats(tasks)
  const pct = stats.total > 0 ? Math.round((stats.completedCount / stats.total) * 100) : 0

  return (
    <aside className="rounded-xl border border-gray-200 bg-white p-4 flex flex-col gap-4">
      <h2 className="flex items-center gap-2 font-semibold text-sm text-gray-800">
        <Bookmark size={15} className="text-indigo-600" />
        Workspace Work Summary
      </h2>

      <div className="flex flex-col gap-2">
        <StatCard
          count={stats.overdueCount}
          label={`${stats.overdueCount} Overdue actions`}
          description="Attention required instantly"
          accentClass="border-red-500"
          bgClass="bg-red-50"
          badgeClass="bg-red-100 text-red-700"
        />
        <StatCard
          count={stats.dueTodayCount}
          label={`${stats.dueTodayCount} Due today`}
          description="Complete before daily deadline"
          accentClass="border-amber-500"
          bgClass="bg-amber-50"
          badgeClass="bg-amber-100 text-amber-700"
        />
        <StatCard
          count={stats.dueThisWeekCount}
          label={`${stats.dueThisWeekCount} Due this week`}
          description="Regular backlog parameters"
          accentClass="border-blue-500"
          bgClass="bg-blue-50"
          badgeClass="bg-blue-100 text-blue-700"
        />
        <StatCard
          count={stats.totalPending}
          label={`${stats.totalPending} Total pending tasks`}
          description="Central process log depth"
          accentClass="border-gray-300"
          bgClass="bg-gray-50"
          badgeClass="bg-gray-100 text-gray-700"
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-gray-500">Task Dispatch Resolution Rate</span>
          <span className="text-xs font-semibold text-gray-700">
            {stats.completedCount} of {stats.total} tasks completed
          </span>
        </div>
        <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
          <div
            className="h-2 rounded-full bg-indigo-600 transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="text-xs text-gray-400 mt-1.5">{pct}% Weekly completion quota compliance</p>
      </div>
    </aside>
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
git add src/features/workspace/components/tasks/work-summary-sidebar.tsx
git commit -m "feat(workspace): add WorkSummarySidebar with computed stats and progress bar"
```

---

## Task 10: TaskList Component

**Files:**
- Create: `src/features/workspace/components/tasks/task-list.tsx`

**Interfaces:**
- Consumes: `Task`, `TaskStatus` from `../../types`, `TaskRow`
- Produces: `<TaskList tasks={Task[]} roleScope={string} />`

- [ ] **Step 1: Create task-list**

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
    <div className="rounded-xl border border-gray-200 bg-white flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-4 pt-4 pb-0">
        <h2 className="font-semibold text-sm text-gray-800">
          Process Workflow Center <span className="text-gray-400 font-normal">(My Work)</span>
        </h2>
        <span className="font-mono text-xs text-gray-400">Role Scope: {roleScope}</span>
      </div>

      <div className="flex gap-0 border-b border-gray-200 px-4 mt-3 overflow-x-auto">
        {TABS.map(({ label, status }) => (
          <button
            key={status}
            type="button"
            onClick={() => setActiveTab(status)}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium whitespace-nowrap transition-colors border-b-2 -mb-px ${
              activeTab === status
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {label}
            <span
              className={`rounded-full px-1.5 py-0.5 text-xs font-bold ${
                activeTab === status
                  ? "bg-indigo-100 text-indigo-700"
                  : "bg-gray-100 text-gray-500"
              }`}
            >
              {counts[status]}
            </span>
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 p-4 border-b border-gray-100">
        <input
          type="search"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filter task titles, workflow names, codes..."
          className="flex-1 min-w-[200px] rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-300"
        />
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 scrollbar-thin scrollbar-thumb-gray-200 max-h-[600px]">
        {visible.length === 0 ? (
          <div className="py-12 text-center text-sm text-gray-400">
            {filter ? "No tasks match your filter." : "No tasks in this category."}
          </div>
        ) : (
          visible.map((task) => <TaskRow key={task.id} task={task} />)
        )}
      </div>
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
git add src/features/workspace/components/tasks/task-list.tsx
git commit -m "feat(workspace): add TaskList with sub-tabs and filter"
```

---

## Task 11: TasksTab Component

**Files:**
- Create: `src/features/workspace/components/tasks/tasks-tab.tsx`

**Interfaces:**
- Consumes: `Task` from `../../types`, `TaskList`, `WorkSummarySidebar`, `useCurrentUserActiveRole` from `@/features/users/use-users`
- Produces: `<TasksTab tasks={Task[]} />`

- [ ] **Step 1: Create tasks-tab**

```tsx
// src/features/workspace/components/tasks/tasks-tab.tsx
"use client"

import { useCurrentUserActiveRole } from "@/features/users/use-users"
import type { Task } from "../../types"
import { TaskList } from "./task-list"
import { WorkSummarySidebar } from "./work-summary-sidebar"

type Props = { tasks: Task[] }

export function TasksTab({ tasks }: Props) {
  const { data: activeRole } = useCurrentUserActiveRole()
  const roleScope = activeRole?.code ?? "staff"

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-start">
      <TaskList tasks={tasks} roleScope={roleScope} />
      <WorkSummarySidebar tasks={tasks} />
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
git add src/features/workspace/components/tasks/tasks-tab.tsx
git commit -m "feat(workspace): add TasksTab two-column layout"
```

---

## Task 12: EnterpriseWorkspace Root Component

**Files:**
- Create: `src/features/workspace/components/enterprise-workspace.tsx`

**Interfaces:**
- Consumes: `HomeAppsTab`, `TasksTab`, `DemoState`, `Task` from `../types`, `defaultTasks`, `emptyTasks`, `overdueHeavyTasks` from `../data/mock-tasks`, `computeTaskStats` from `../lib/task-utils`
- Produces: `<EnterpriseWorkspace />`

- [ ] **Step 1: Create enterprise-workspace**

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

  const tasks = DEMO_STATES.find((s) => s.value === demoState)?.tasks ?? defaultTasks
  const stats = computeTaskStats(tasks)
  const pendingCount = stats.totalPending

  return (
    <div className="relative min-h-0 flex flex-col">
      {/* Tab bar */}
      <div className="border-b border-gray-200 bg-white sticky top-0 z-10">
        <div className="flex gap-0 px-4 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab("home")}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap ${
              activeTab === "home"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
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
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            <CheckSquare size={15} />
            My Tasks Workspace
            {pendingCount > 0 && (
              <span className="rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold px-1.5 py-0.5 leading-none">
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
          <div className="bg-white rounded-xl border border-gray-200 shadow-lg p-2 w-48 flex flex-col gap-1">
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
                    ? "bg-indigo-50 text-indigo-700 font-medium"
                    : "text-gray-700 hover:bg-gray-50"
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
          className="flex items-center gap-2 rounded-full bg-gray-900 text-white px-4 py-2 shadow-lg text-sm font-medium hover:bg-gray-800 transition-colors"
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

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/features/workspace/components/enterprise-workspace.tsx
git commit -m "feat(workspace): add EnterpriseWorkspace root with tab bar and demo states menu"
```

---

## Task 13: Wire Home Page + Public Exports

**Files:**
- Create: `src/features/workspace/index.ts`
- Modify: `src/app/(igrp)/(home)/page.tsx`

**Interfaces:**
- Consumes: `EnterpriseWorkspace`, `prefetchCurrentUserDashboard`, `getQueryClient`, `dehydrate`, `HydrationBoundary`
- Produces: Updated home page that renders the workspace

- [ ] **Step 1: Create index barrel**

```ts
// src/features/workspace/index.ts
export { EnterpriseWorkspace } from "./components/enterprise-workspace"
```

- [ ] **Step 2: Update home page**

Replace the entire contents of `src/app/(igrp)/(home)/page.tsx`:

```tsx
// src/app/(igrp)/(home)/page.tsx
import { dehydrate, HydrationBoundary } from "@tanstack/react-query"
import { prefetchCurrentUserDashboard } from "@/features/users/prefetch"
import { getQueryClient } from "@/providers/query-client.server"
import { EnterpriseWorkspace } from "@/features/workspace"

export default async function HomeIGRP() {
  const queryClient = getQueryClient()
  await prefetchCurrentUserDashboard(queryClient)
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <div className="h-(--home-scroll-h) lg:h-(--home-scroll-h-lg) overflow-hidden flex flex-col">
        <EnterpriseWorkspace />
      </div>
    </HydrationBoundary>
  )
}
```

- [ ] **Step 3: Verify TypeScript compiles with no errors**

```bash
npx tsc --noEmit
```

Expected: No errors across the whole project.

- [ ] **Step 4: Run full test suite**

```bash
npx vitest run
```

Expected: All tests pass (including the new workspace utility tests).

- [ ] **Step 5: Commit**

```bash
git add src/features/workspace/index.ts src/app/(igrp)/(home)/page.tsx
git commit -m "feat(workspace): wire EnterpriseWorkspace into home page, retire ApplicationsListHome"
```

---

## Final Verification

- [ ] Start the dev server: `npm run dev`
- [ ] Open `http://localhost:3000` — workspace should render with both tabs
- [ ] Switch between "Home & Apps" and "My Tasks Workspace" tabs
- [ ] Test the Demo States Menu (Default / Empty / Heavy overdue) — task counts and stats should update
- [ ] Toggle a favorite star on an app card — should persist via the real API
- [ ] Toggle grid/list view in the app catalog
- [ ] Filter apps by search term
- [ ] Filter tasks by title/code text
- [ ] Click task sub-tabs (Assigned / Candidate / Created / Completed)
- [ ] Verify responsive layout on narrow viewport (tasks sidebar stacks below)
