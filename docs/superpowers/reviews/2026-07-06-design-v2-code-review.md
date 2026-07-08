# Code Review: `design/v2` → `dev`

**Date:** 2026-07-06
**Scope:** 30 commits ahead of `dev`, ~7,766 insertions across 100+ files (Enterprise Workspace feature + `lib/utils` split + `auth`/`middleware` refactor).

## Summary

A large, mostly well-built new "Enterprise Workspace" home page (apps catalog + tasks panel) ships alongside a `lib/utils.ts` → `lib/utilities.ts`/`app-utilities.ts` split and an `auth.ts`/`middleware.ts` refactor. The UI work is solid (good date-edge-case handling, no XSS surface, decent test coverage on utils), but three things need to be fixed before merge: a security regression in session-refresh-error handling, three test files broken by incomplete import migration, and a workspace tab that renders fabricated task data as if it were real.

## Critical Issues

| # | File | Line | Issue | Severity |
|---|------|------|-------|----------|

| 1 | `src/lib/auth.ts` | 157–176 | `serverSession()` used to `return null` when the session carried a refresh-failure `error` flag, with an explicit comment explaining why (avoid seeding a stale/expired token into the access client, which turns clean logout redirects into raw 401 error pages). That `return null` was deleted — now the error is only `console.warn`'d in non-production, and execution unconditionally falls through to seed `igrpSetAccessClientConfig` with the stale token and return the session as valid, **in production too**. This reintroduces the exact failure mode the old comment described. | 🔴 Critical (Security/Correctness) |
| 2 | `src/features/workspace/components/enterprise-workspace.tsx` | 17 | `const tasks = defaultTasks;` wires hand-authored mock data straight into the production render — no API call, no loading state, no flag. Every logged-in user sees the same fabricated tickets/requester names and fake pending/overdue counts in the tab badge and Welcome Banner. `mock-tasks.ts` also exports unused `emptyTasks`/`overdueHeavyTasks` and `types.ts` has an unused `DemoState` type, suggesting a demo-switcher was built but never finished — this got wired to the real page instead. | 🔴 Critical (Correctness/Product risk) |

## High-Priority Issues

| # | File | Line | Issue | Severity |
|---|------|------|-------|----------|

| 3 | `src/__tests__/lib/auth-utils.test.ts` | 3–8 | Imports `isAuthBypass`, `isAuthDisabled`, `isPreviewMode`, `sanitizeCallbackUrl` from `@/lib/utils`, but that file now only exports `cn` — these moved to `@/lib/utilities`. Test suite will fail to import. | 🟠 High |
| 4 | `src/__tests__/lib/dal.test.ts` | 11 | `vi.mock("@/lib/utils", ...)` mocks the wrong module — `dal.ts` now imports `isAuthBypass` from `@/lib/utilities`, so this mock is inert and the real implementation runs unmocked, silently invalidating the bypass-mode test cases. | 🟠 High |
| 5 | `src/__tests__/middleware/path-predicates.test.ts` | 17 | `import { isAuthUiPath, isPublicPath } from "@/middleware"` — both lost their `export` keyword in `middleware.ts` (now module-private). Import will fail. | 🟠 High |

## Suggestions

| # | File | Line | Suggestion | Category |
|---|------|------|------------|----------|

| 7 | `src/features/applications/components/app-list-home.tsx` | whole file (923 lines) | `ApplicationsListHome` is no longer imported anywhere (the new home page uses `EnterpriseWorkspace`). Dead code, including commented-out remnants — delete rather than let it rot. | Maintainability |
| 8 | `src/features/workspace/lib/task-utils.ts` | 75–77 | `computeTaskStats` derives "overdue" from the static `priority === "OVERDUE"` field rather than comparing `dueDate` to now (acknowledged in the code's own comment). Fine for mock data; will silently go stale once real tasks are wired in. | Correctness |
| 9 | `src/features/workspace/components/enterprise-workspace.tsx` / `task-list.tsx` | 26–56 / 53–77 | Tab buttons are plain `<button>`s without `role="tab"`/`role="tablist"`/`aria-selected` and no arrow-key navigation — inconsistent with the existing `GridNavigator` keyboard-nav pattern elsewhere in the app. | Accessibility |
| 10 | `src/features/workspace/components/home-apps/app-catalog.tsx` | 82, 202 | `gridKey` changes on every keystroke in search, forcing a full remount (`key={gridKey}`) of the entire grid just to replay a fade-in animation — unmounts/remounts every `AppTileCard` per character typed. | Performance |
| 11 | `src/features/workspace/components/home-apps/recently-accessed.tsx` | 24 | `favCodes` `Set` rebuilt every render, unlike the `useMemo`'d equivalent in `app-catalog.tsx`. Low impact given small list size, but inconsistent. | Performance (nit) |
| 12 | `src/features/workspace/components/tasks/task-list.tsx` | 21–26 | `counts` and `visible` run 5 unmemoized array passes per render (including per keystroke). Invisible at mock-data scale (9 items); will matter once real task data lands. | Performance (latent) |

## What Looks Good

- `getDueDateLabel` (`task-utils.ts`) correctly normalizes both dates to midnight before diffing — avoids the classic partial-day timezone bug — and has solid test coverage.
- `getLastOpenedLabel` (`app-utils.ts`) has thorough, well-tested edge-case handling for missing/unparseable dates.
- `AppCatalog`'s `useMemo` usage for `favCodes`/`filtered` is correct and properly dependency-tracked.
- No `dangerouslySetInnerHTML` anywhere in the new code — no XSS surface found.
- SSR/hydration-safe greeting pattern (`useEffect` + `useState(null)`) in `WelcomeBanner`.
- `dal.ts`'s open-redirect guard (`sanitizeCallbackUrl` blocking `/login`, `/logout`, off-origin targets) is correctly preserved through the refactor.
- The `utils.ts` → `utilities.ts`/`app-utilities.ts` split is otherwise consistently applied — only the 3 test files above were missed.

## Verdict

**Request Changes.** Two critical issues block merge: the `auth.ts` session-error regression is a real security/correctness bug that reintroduces a previously-fixed failure mode, and the Tasks tab is presenting fabricated data as real to every user. Combined with 3 tests that will fail CI outright, none of this should ship as-is — but the underlying workspace UI and utility refactor are otherwise well-built and close to done.
