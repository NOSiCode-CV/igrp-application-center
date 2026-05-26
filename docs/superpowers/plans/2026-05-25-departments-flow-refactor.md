# Departments Flow Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor `settings/departments` from a 410-line god-component into a composed, RSC-prefetched, context-driven feature with derived state, memoized tree, and a discriminated dialog reducer — preserving exact UX while fixing the auto-select bug, the redundant detail fetch, and the duplicated refetch in mutations.

**Architecture:**
- Page becomes a true RSC: prefetches `getDepartments` and dehydrates into a `HydrationBoundary`. No more landing spinner.
- Client orchestrator (`DepartmentListTree`) shrinks to layout shell + dialog reducer. List, detail, and dialogs become sibling components fed by a shared tree-context (selection, expansion, handlers) — eliminating prop drilling through the recursive `DepartmentTreeItem`.
- Pure tree helpers (`buildTree`, `filterTree`) move into `dept-tree-utils.ts` with unit tests, and are consumed via a memoized `useDepartmentTree` hook.
- Detail panel reads the already-loaded list via `find()` instead of issuing a second `getDepartmentByCode` round-trip.
- Mutation hooks drop `invalidate + refetch` duplication (invalidate already refetches active queries).

**Tech Stack:** Next.js 15 (App Router, RSC), React 19 (`use()`), TanStack Query 5 (`HydrationBoundary` / `dehydrate`), `@igrp/igrp-framework-react-design-system`, Vitest + RTL, Biome.

**Conventions observed in this repo:**
- Tests live under `src/__tests__/<feature>/...` (see [src/__tests__/users](src/__tests__/users)).
- Path alias `@/` → `src/`.
- Lint via `pnpm lint` (Biome write mode). Typecheck via `pnpm exec tsc --noEmit`. Tests via `pnpm test`.
- Commit style: `feat:`, `fix:`, `refactor:`, `test:`, `chore:` (see `git log`).
- Components use named exports except dialogs/recursive items which use `default`.

**Out of scope:** Server actions in [src/actions/departments](src/actions/departments), the `(roles|permissions|menus)` child features (these are consumed unchanged via tabs), and the design system itself.

---

## File Structure

**Create:**
- `src/features/departments/dept-tree-utils.ts` — pure `buildTree` / `filterTree` + `DepartmentWithChildren` type.
- `src/features/departments/use-dept-tree.ts` — memoized tree + filter hook.
- `src/features/departments/dept-dialog-state.ts` — discriminated union `DialogState` + reducer.
- `src/features/departments/components/dept-tree-context.tsx` — context object + `useDeptTree()` hook.
- `src/features/departments/components/dept-sidebar.tsx` — sidebar (search, list, new btn, mobile toggle).
- `src/features/departments/components/dept-detail.tsx` — detail header + tabs + manage-apps trigger.
- `src/features/departments/components/dept-dialogs.tsx` — form + delete + apps modals, driven by reducer.
- `src/features/departments/components/dept-empty-state.tsx` — shared empty state.
- `src/__tests__/departments/dept-tree-utils.test.ts` — unit tests for tree helpers.
- `src/__tests__/departments/dept-dialog-state.test.ts` — unit tests for reducer.

**Modify:**
- `src/app/(igrp)/(home)/settings/departments/page.tsx` — convert to async RSC with prefetch + `HydrationBoundary`; drop `force-dynamic`.
- `src/features/departments/components/dept-list-tree.tsx` — slim orchestrator (~100 lines).
- `src/features/departments/components/dept-tree-item.tsx` — consume context, slim props to `{ dept, level? }`.
- `src/features/departments/use-departments.ts` — remove redundant `refetchQueries` calls from every mutation.

**Delete:** none.

---

## Task 1: Extract pure tree utilities with tests

**Files:**
- Create: `src/features/departments/dept-tree-utils.ts`
- Create: `src/__tests__/departments/dept-tree-utils.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/__tests__/departments/dept-tree-utils.test.ts`:

```ts
import type { DepartmentDTO } from "@igrp/platform-access-management-client-ts";
import { describe, expect, it } from "vitest";
import { buildTree, filterTree } from "@/features/departments/dept-tree-utils";

const dept = (code: string, parentCode?: string, name = code): DepartmentDTO =>
  ({ code, parentCode, name, status: "ACTIVE" }) as DepartmentDTO;

describe("buildTree", () => {
  it("returns empty array for empty input", () => {
    expect(buildTree([])).toEqual([]);
  });

  it("returns empty array when given undefined", () => {
    expect(buildTree(undefined as unknown as DepartmentDTO[])).toEqual([]);
  });

  it("nests children under their parent by code", () => {
    const tree = buildTree([dept("A"), dept("A.1", "A"), dept("A.1.1", "A.1")]);
    expect(tree).toHaveLength(1);
    expect(tree[0].code).toBe("A");
    expect(tree[0].children?.[0].code).toBe("A.1");
    expect(tree[0].children?.[0].children?.[0].code).toBe("A.1.1");
  });

  it("treats nodes with missing parents as roots", () => {
    const tree = buildTree([dept("orphan", "ghost"), dept("root")]);
    expect(tree.map((n) => n.code).sort()).toEqual(["orphan", "root"]);
  });
});

describe("filterTree", () => {
  const tree = buildTree([
    dept("HR", undefined, "Human Resources"),
    dept("HR.PAY", "HR", "Payroll"),
    dept("IT", undefined, "Information Tech"),
  ]);

  it("returns input when term is empty", () => {
    expect(filterTree(tree, "")).toBe(tree);
  });

  it("matches by name case-insensitively", () => {
    const out = filterTree(tree, "payroll");
    expect(out).toHaveLength(1);
    expect(out[0].code).toBe("HR");
    expect(out[0].children?.[0].code).toBe("HR.PAY");
  });

  it("matches by code", () => {
    const out = filterTree(tree, "it");
    expect(out.map((n) => n.code)).toContain("IT");
  });

  it("keeps a parent when only a descendant matches", () => {
    const out = filterTree(tree, "payroll");
    expect(out[0].code).toBe("HR");
  });

  it("drops branches with no matches", () => {
    const out = filterTree(tree, "zzz");
    expect(out).toEqual([]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test src/__tests__/departments/dept-tree-utils.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement the module**

Create `src/features/departments/dept-tree-utils.ts`:

```ts
import type { DepartmentDTO } from "@igrp/platform-access-management-client-ts";

export type DepartmentWithChildren = DepartmentDTO & {
  children?: DepartmentWithChildren[];
};

export function buildTree(
  depts: DepartmentDTO[] | undefined,
): DepartmentWithChildren[] {
  if (!depts?.length) return [];

  const map = new Map<string, DepartmentWithChildren>();
  for (const d of depts) map.set(d.code, { ...d, children: [] });

  const roots: DepartmentWithChildren[] = [];
  for (const d of depts) {
    const node = map.get(d.code);
    if (!node) continue;
    const parent = d.parentCode ? map.get(d.parentCode) : undefined;
    if (parent) parent.children!.push(node);
    else roots.push(node);
  }
  return roots;
}

export function filterTree(
  depts: DepartmentWithChildren[],
  term: string,
): DepartmentWithChildren[] {
  if (!term) return depts;
  const needle = term.toLowerCase();

  const walk = (nodes: DepartmentWithChildren[]): DepartmentWithChildren[] => {
    const out: DepartmentWithChildren[] = [];
    for (const node of nodes) {
      const self =
        node.name.toLowerCase().includes(needle) ||
        node.code.toLowerCase().includes(needle);
      const kids = node.children ? walk(node.children) : [];
      if (self || kids.length > 0) out.push({ ...node, children: kids });
    }
    return out;
  };

  return walk(depts);
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm test src/__tests__/departments/dept-tree-utils.test.ts`
Expected: PASS (all cases green).

- [ ] **Step 5: Commit**

```bash
git add src/features/departments/dept-tree-utils.ts src/__tests__/departments/dept-tree-utils.test.ts
git commit -m "refactor(departments): extract pure tree utilities with tests"
```

---

## Task 2: Add memoized `useDepartmentTree` hook

**Files:**
- Create: `src/features/departments/use-dept-tree.ts`

- [ ] **Step 1: Implement the hook**

Create `src/features/departments/use-dept-tree.ts`:

```ts
import type { DepartmentDTO } from "@igrp/platform-access-management-client-ts";
import { useMemo } from "react";
import {
  buildTree,
  type DepartmentWithChildren,
  filterTree,
} from "./dept-tree-utils";

export interface DepartmentTreeResult {
  tree: DepartmentWithChildren[];
  filtered: DepartmentWithChildren[];
}

export function useDepartmentTree(
  departments: DepartmentDTO[] | undefined,
  searchTerm: string,
): DepartmentTreeResult {
  const tree = useMemo(() => buildTree(departments), [departments]);
  const filtered = useMemo(
    () => filterTree(tree, searchTerm),
    [tree, searchTerm],
  );
  return { tree, filtered };
}
```

- [ ] **Step 2: Typecheck**

Run: `pnpm exec tsc --noEmit`
Expected: no errors for the new file.

- [ ] **Step 3: Commit**

```bash
git add src/features/departments/use-dept-tree.ts
git commit -m "refactor(departments): add memoized useDepartmentTree hook"
```

---

## Task 3: Add dialog reducer with tests

**Files:**
- Create: `src/features/departments/dept-dialog-state.ts`
- Create: `src/__tests__/departments/dept-dialog-state.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/__tests__/departments/dept-dialog-state.test.ts`:

```ts
import type { DepartmentDTO } from "@igrp/platform-access-management-client-ts";
import { describe, expect, it } from "vitest";
import {
  type DialogState,
  dialogReducer,
} from "@/features/departments/dept-dialog-state";

const dept = (code: string): DepartmentDTO =>
  ({ code, name: code, status: "ACTIVE" }) as DepartmentDTO;

const closed: DialogState = { kind: "closed" };

describe("dialogReducer", () => {
  it("opens create with no parent", () => {
    expect(dialogReducer(closed, { type: "openCreate" })).toEqual({
      kind: "create",
      parent: null,
    });
  });

  it("opens create with a parent", () => {
    const parent = dept("HR");
    expect(
      dialogReducer(closed, { type: "openCreateSub", parent }),
    ).toEqual({ kind: "create", parent });
  });

  it("opens edit", () => {
    const d = dept("HR");
    expect(dialogReducer(closed, { type: "openEdit", dept: d })).toEqual({
      kind: "edit",
      dept: d,
    });
  });

  it("opens delete", () => {
    expect(
      dialogReducer(closed, { type: "openDelete", code: "HR", name: "HR" }),
    ).toEqual({ kind: "delete", code: "HR", name: "HR" });
  });

  it("opens manage apps", () => {
    expect(dialogReducer(closed, { type: "openManageApps" })).toEqual({
      kind: "manageApps",
    });
  });

  it("closes from any state", () => {
    expect(dialogReducer({ kind: "edit", dept: dept("X") }, { type: "close" }))
      .toEqual(closed);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test src/__tests__/departments/dept-dialog-state.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement the reducer**

Create `src/features/departments/dept-dialog-state.ts`:

```ts
import type { DepartmentDTO } from "@igrp/platform-access-management-client-ts";

export type DialogState =
  | { kind: "closed" }
  | { kind: "create"; parent: DepartmentDTO | null }
  | { kind: "edit"; dept: DepartmentDTO }
  | { kind: "delete"; code: string; name: string }
  | { kind: "manageApps" };

export type DialogAction =
  | { type: "openCreate" }
  | { type: "openCreateSub"; parent: DepartmentDTO }
  | { type: "openEdit"; dept: DepartmentDTO }
  | { type: "openDelete"; code: string; name: string }
  | { type: "openManageApps" }
  | { type: "close" };

export const closedDialog: DialogState = { kind: "closed" };

export function dialogReducer(
  _state: DialogState,
  action: DialogAction,
): DialogState {
  switch (action.type) {
    case "openCreate":
      return { kind: "create", parent: null };
    case "openCreateSub":
      return { kind: "create", parent: action.parent };
    case "openEdit":
      return { kind: "edit", dept: action.dept };
    case "openDelete":
      return { kind: "delete", code: action.code, name: action.name };
    case "openManageApps":
      return { kind: "manageApps" };
    case "close":
      return closedDialog;
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm test src/__tests__/departments/dept-dialog-state.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/departments/dept-dialog-state.ts src/__tests__/departments/dept-dialog-state.test.ts
git commit -m "refactor(departments): add dialog state reducer"
```

---

## Task 4: Strip redundant `refetchQueries` from `use-departments.ts`

**Why:** `invalidateQueries` already triggers refetch for active queries — the explicit `refetchQueries` doubles the request volume on every mutation.

**Files:**
- Modify: `src/features/departments/use-departments.ts`

- [ ] **Step 1: Remove every `refetchQueries` call from this file**

In `src/features/departments/use-departments.ts`, delete the following blocks (one inside each mutation `onSuccess`):

- `useCreateDepartment` (lines ~66-69)
- `useUpdateDepartment` (lines ~89-92)
- `useDeleteDepartment` (lines ~106-109)
- `useAddApplicationsToDepartment` (lines ~186-189)
- `useRemoveApplicationsFromDepartment` — keep the `invalidateQueries` block but delete the subsequent `await Promise.all([ queryClient.refetchQueries(...) ... ])` (lines ~225-234)
- `useAddMenusToDepartment` (lines ~305-308)
- `useRemoveMenusFromDepartment` (lines ~346-349)
- `useCreateRole` — remove `await queryClient.refetchQueries({ queryKey: ["roles"] });`
- `useUpdateRole` — remove `await queryClient.refetchQueries({ queryKey: ["roles"] });`
- `useDeleteRole` — remove the trailing refetch.

Pattern (apply consistently): the `onSuccess` should end after the last `invalidateQueries(...)` line.

Example diff for `useCreateDepartment`:

```ts
onSuccess: async (result) => {
  if (result.success) {
    await queryClient.invalidateQueries({
      queryKey: ["departments"],
      exact: true,
    });
-   await queryClient.refetchQueries({
-     queryKey: ["departments"],
-     exact: true,
-   });
  }
},
```

- [ ] **Step 2: Typecheck + lint**

Run: `pnpm exec tsc --noEmit && pnpm lint`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/features/departments/use-departments.ts
git commit -m "refactor(departments): drop redundant refetchQueries after invalidate"
```

---

## Task 5: Tree context module

**Files:**
- Create: `src/features/departments/components/dept-tree-context.tsx`

- [ ] **Step 1: Create the context**

Create `src/features/departments/components/dept-tree-context.tsx`:

```tsx
"use client";

import { createContext, use } from "react";
import type { DepartmentWithChildren } from "../dept-tree-utils";

export interface DeptTreeContextValue {
  selectedCode: string | null;
  expanded: Set<string>;
  select(code: string): void;
  toggle(code: string): void;
  onEdit(dept: DepartmentWithChildren): void;
  onCreateSub(parent: DepartmentWithChildren): void;
  onDelete(code: string, name: string): void;
}

export const DeptTreeContext = createContext<DeptTreeContextValue | null>(null);

export function useDeptTree(): DeptTreeContextValue {
  const ctx = use(DeptTreeContext);
  if (!ctx)
    throw new Error("useDeptTree must be used within <DeptTreeContext>");
  return ctx;
}
```

- [ ] **Step 2: Typecheck**

Run: `pnpm exec tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/features/departments/components/dept-tree-context.tsx
git commit -m "refactor(departments): add tree context"
```

---

## Task 6: Slim `DepartmentTreeItem` to use context

**Files:**
- Modify: `src/features/departments/components/dept-tree-item.tsx`

- [ ] **Step 1: Replace the file**

Replace the contents of `src/features/departments/components/dept-tree-item.tsx` with:

```tsx
import {
  Button,
  cn,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  IGRPIcon,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@igrp/igrp-framework-react-design-system";
import type React from "react";
import type { DepartmentWithChildren } from "../dept-tree-utils";
import { useDeptTree } from "./dept-tree-context";

interface Props {
  dept: DepartmentWithChildren;
  level?: number;
}

const DepartmentTreeItem = ({ dept, level = 0 }: Props) => {
  const { selectedCode, expanded, select, toggle, onEdit, onCreateSub, onDelete } =
    useDeptTree();

  const hasChildren = !!dept.children?.length;
  const isExpanded = expanded.has(dept.code);
  const isSelected = selectedCode === dept.code;
  const isActive = dept.status === "ACTIVE";

  return (
    <div>
      <div
        className={cn(
          "group flex items-center gap-2 px-3 py-2.5 my-1.5 rounded-sm text-sm transition-all",
          isSelected
            ? "bg-accent/50 text-primary font-medium"
            : "border-accent text-foreground bg-accent/20",
        )}
        style={{ paddingLeft: `${level * 1.5 + 0.75}rem` }}
      >
        <button
          type="button"
          className="w-4 h-4 flex items-center justify-center shrink-0 disabled:cursor-default"
          onClick={() => hasChildren && toggle(dept.code)}
          disabled={!hasChildren}
          aria-expanded={hasChildren ? isExpanded : undefined}
          aria-label={
            hasChildren
              ? isExpanded
                ? "Recolher departamento"
                : "Expandir departamento"
              : undefined
          }
        >
          {hasChildren ? (
            <IGRPIcon
              iconName="ChevronRight"
              className={cn(
                "w-3.5 h-3.5 transition-transform",
                isExpanded && "rotate-90",
              )}
              strokeWidth={2}
            />
          ) : (
            <div className="w-3.5" />
          )}
        </button>

        <button
          type="button"
          onClick={() => select(dept.code)}
          className="flex items-center gap-2 flex-1 min-w-0 cursor-pointer"
        >
          <div className="relative">
            <IGRPIcon
              iconName={isExpanded ? "FolderOpen" : "Folder"}
              className={cn("w-4 h-4 shrink-0", !isActive && "opacity-50")}
              strokeWidth={2}
            />
            {!isActive && (
              <div className="absolute -right-0.5 -bottom-0.5 w-2 h-2 rounded-full bg-red-500/50 border border-background" />
            )}
          </div>
          <span className="flex-1 text-left truncate font-medium">
            {dept.name}
          </span>
        </button>

        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                className="h-6 w-6 p-0"
                onClick={() => onCreateSub(dept)}
              >
                <span className="sr-only">Criar Sub-departamento</span>
                <IGRPIcon iconName="Plus" className="w-4 h-4" strokeWidth={2} />
              </Button>
            </TooltipTrigger>
            <TooltipContent className="px-2 py-1 text-xs">
              Criar Sub-departamento
            </TooltipContent>
          </Tooltip>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="h-6 w-6 p-0"
                onClick={(e: React.MouseEvent) => e.stopPropagation()}
              >
                <span className="sr-only">Abrir menu</span>
                <IGRPIcon
                  iconName="EllipsisVertical"
                  className="w-4 h-4"
                  strokeWidth={2}
                />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              onCloseAutoFocus={(e) => e.preventDefault()}
              align="end"
            >
              <DropdownMenuItem onSelect={() => onEdit(dept)}>
                <IGRPIcon iconName="Pencil" className="w-4 h-4 mr-2" strokeWidth={2} />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => onCreateSub(dept)}>
                <IGRPIcon iconName="FolderPlus" className="w-4 h-4 mr-2" strokeWidth={2} />
                Criar Sub-departamento
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onSelect={() => onDelete(dept.code, dept.name)}
              >
                <IGRPIcon iconName="Trash" className="w-4 h-4 mr-2" strokeWidth={2} />
                Eliminar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {hasChildren &&
        isExpanded &&
        dept.children?.map((child) => (
          <DepartmentTreeItem key={child.code} dept={child} level={level + 1} />
        ))}
    </div>
  );
};

export default DepartmentTreeItem;
```

Notes intentionally applied:
- Drop per-row `TooltipProvider` (will be hoisted to sidebar in Task 8).
- All three dropdown items now use `onSelect` (was inconsistent before).
- Removed redundant `isActive` branch in className (both branches returned the same classes).

- [ ] **Step 2: Typecheck**

Run: `pnpm exec tsc --noEmit`
Expected: errors will remain in `dept-list-tree.tsx` (still passing old props). That's fine — they go away in Task 11. Verify *this file* compiles in isolation by checking the error list does not include `dept-tree-item.tsx`.

- [ ] **Step 3: Commit**

```bash
git add src/features/departments/components/dept-tree-item.tsx
git commit -m "refactor(departments): consume tree context in DepartmentTreeItem"
```

---

## Task 7: Extract `DepartmentEmptyState`

**Files:**
- Create: `src/features/departments/components/dept-empty-state.tsx`

- [ ] **Step 1: Create the component**

Create `src/features/departments/components/dept-empty-state.tsx`:

```tsx
"use client";

import { IGRPIcon } from "@igrp/igrp-framework-react-design-system";
import { ButtonLink } from "@/components/button-link";

interface Props {
  variant: "sidebar-empty" | "sidebar-no-results" | "main-no-departments";
  onCreate?: () => void;
}

const copy = {
  "sidebar-empty": {
    iconSize: "size-8",
    iconStroke: 1.5,
    title: "Nenhum departamento",
    body: "Use o botão 'Novo Departamento' para criar o primeiro departamento para organizar perfis e permissões.",
  },
  "sidebar-no-results": {
    iconSize: "size-8",
    iconStroke: 1.5,
    title: "Nenhum departamento encontrado",
    body: "Tente outro termo na pesquisa ou limpe o campo.",
  },
  "main-no-departments": {
    iconSize: "size-12",
    iconStroke: 1.5,
    title: "Comece por um departamento",
    body: "Os departamentos organizam perfis, permissões e menus. Crie o primeiro para configurar o sistema.",
  },
} as const;

export function DepartmentEmptyState({ variant, onCreate }: Props) {
  const c = copy[variant];
  const isMain = variant === "main-no-departments";

  return (
    <div
      className={
        isMain
          ? "flex flex-col items-center justify-center min-h-[320px] px-6 text-center"
          : "flex flex-col items-center justify-center py-8 px-4 text-center border border-dashed rounded-lg bg-muted/30"
      }
    >
      <div className={isMain ? "p-4 rounded-full bg-muted/50 mb-5" : "p-3 rounded-full bg-muted mb-4"}>
        <IGRPIcon
          iconName="Building2"
          className={`${c.iconSize} text-muted-foreground`}
          strokeWidth={c.iconStroke}
        />
      </div>
      <h3 className={isMain ? "text-lg font-semibold mb-2" : "text-sm font-semibold mb-1"}>
        {c.title}
      </h3>
      <p
        className={
          isMain
            ? "text-muted-foreground text-sm max-w-sm mb-6"
            : "text-muted-foreground text-xs mb-4 max-w-[220px]"
        }
      >
        {c.body}
      </p>
      {onCreate && (
        <ButtonLink onClick={onCreate} icon="Plus" href="#" label="Novo Departamento" />
      )}
    </div>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `pnpm exec tsc --noEmit`
Expected: no errors for this file.

- [ ] **Step 3: Commit**

```bash
git add src/features/departments/components/dept-empty-state.tsx
git commit -m "refactor(departments): extract shared empty-state component"
```

---

## Task 8: Build `DepartmentSidebar`

**Files:**
- Create: `src/features/departments/components/dept-sidebar.tsx`

- [ ] **Step 1: Create the component**

Create `src/features/departments/components/dept-sidebar.tsx`:

```tsx
"use client";

import {
  Button,
  IGRPIcon,
  Input,
  TooltipProvider,
} from "@igrp/igrp-framework-react-design-system";
import { ButtonLink } from "@/components/button-link";
import type { DepartmentWithChildren } from "../dept-tree-utils";
import { DepartmentEmptyState } from "./dept-empty-state";
import DepartmentTreeItem from "./dept-tree-item";

interface Props {
  filtered: DepartmentWithChildren[];
  searchTerm: string;
  onSearchChange(value: string): void;
  onCreate(): void;
  isOpen: boolean;
  onOpenChange(open: boolean): void;
}

export function DepartmentSidebar({
  filtered,
  searchTerm,
  onSearchChange,
  onCreate,
  isOpen,
  onOpenChange,
}: Props) {
  return (
    <>
      <div className="block lg:hidden mb-4">
        <Button
          onClick={() => onOpenChange(!isOpen)}
          variant="outline"
          className="w-full cursor-pointer"
        >
          <IGRPIcon
            iconName={isOpen ? "X" : "Menu"}
            className="w-4 h-4"
            strokeWidth={2}
          />
          {isOpen ? "Fechar" : "Departamentos"}
        </Button>
      </div>

      <aside
        className={`${isOpen ? "block" : "hidden"} lg:block
          fixed lg:relative inset-0 lg:inset-auto
          z-50 lg:z-auto
          w-full lg:w-80
          bg-background
          overflow-y-auto
          flex pr-0 lg:pr-2 border-accent flex-col
          p-4 lg:p-0`}
      >
        <div className="flex lg:hidden justify-end mb-2">
          <Button
            onClick={() => onOpenChange(false)}
            variant="ghost"
            size="sm"
            className="cursor-pointer"
          >
            <IGRPIcon iconName="X" className="w-5 h-5" strokeWidth={2} />
          </Button>
        </div>

        <div className="flex flex-col min-w-0">
          <h2 className="text-xl font-bold tracking-tight truncate">
            Gestão de Departamentos
          </h2>
          <p className="text-muted-foreground text-sm mb-4">
            Ver e gerir todos os departamentos do sistema.
          </p>
          <ButtonLink
            onClick={onCreate}
            icon="Plus"
            href="#"
            label="Novo Departamento"
          />
        </div>

        <div className="mt-4">
          <div className="relative">
            <IGRPIcon
              iconName="Search"
              className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground"
            />
            <Input
              type="text"
              placeholder="Pesquisar departamento..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full bg-background pl-8"
            />
          </div>
        </div>

        <div className="flex-1 mt-3 overflow-y-auto min-h-[200px]">
          <TooltipProvider delayDuration={350}>
            {filtered.length === 0 ? (
              <DepartmentEmptyState
                variant={searchTerm ? "sidebar-no-results" : "sidebar-empty"}
              />
            ) : (
              filtered.map((dept) => (
                <DepartmentTreeItem key={dept.code} dept={dept} />
              ))
            )}
          </TooltipProvider>
        </div>
      </aside>

      {isOpen && (
        <button
          type="button"
          aria-label="Fechar menu de departamentos"
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => onOpenChange(false)}
        />
      )}
    </>
  );
}
```

Notes: dropped `!important` overrides — the parent layout no longer fights design-system defaults because the orchestrator (Task 11) won't provide conflicting classes. `TooltipProvider` is hoisted once around the rendered tree items.

- [ ] **Step 2: Typecheck**

Run: `pnpm exec tsc --noEmit`
Expected: no errors for this file.

- [ ] **Step 3: Commit**

```bash
git add src/features/departments/components/dept-sidebar.tsx
git commit -m "refactor(departments): extract DepartmentSidebar"
```

---

## Task 9: Build `DepartmentDetail`

**Files:**
- Create: `src/features/departments/components/dept-detail.tsx`

- [ ] **Step 1: Create the component**

Create `src/features/departments/components/dept-detail.tsx`:

```tsx
"use client";

import {
  Badge,
  Button,
  IGRPIcon,
  type IGRPTabItem,
  IGRPTabs,
} from "@igrp/igrp-framework-react-design-system";
import type { DepartmentDTO } from "@igrp/platform-access-management-client-ts";
import { useMemo } from "react";
import { CopyToClipboard } from "@/components/copy-to-clipboard";
import { PermissionList } from "@/features/permissions/components/permission-list";
import { RolesListTree } from "@/features/roles/components/role-tree-list";
import { getStatusColor } from "@/lib/utils";
import { MenuPermissions } from "./dept-menu";

interface Props {
  department: DepartmentDTO;
  onEdit(dept: DepartmentDTO): void;
  onManageApps(): void;
}

export function DepartmentDetail({ department, onEdit, onManageApps }: Props) {
  const tabs = useMemo<IGRPTabItem[]>(
    () => [
      {
        label: "Perfis (Roles)",
        value: "roles",
        content: <RolesListTree departmentCode={department.code} />,
      },
      {
        label: "Permissões",
        value: "permissions",
        content: <PermissionList departmentCode={department.code} />,
      },
      {
        label: "Menus",
        value: "menus",
        content: <MenuPermissions departmentCode={department.code} />,
      },
    ],
    [department.code],
  );

  return (
    <div className="container mx-auto px-0 md:px-6">
      <div className="flex flex-col lg:flex-row items-start justify-between mb-6 gap-4">
        <div className="w-full lg:w-auto">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl font-bold">{department.name}</h1>
            <Badge className={getStatusColor(department.status ?? "ACTIVE")}>
              {department.status}
            </Badge>
          </div>
          <div className="flex items-center">
            <span className="text-muted-foreground text-xs">#{department.code}</span>
            <CopyToClipboard value={department.code} />
          </div>
          <p className="text-muted-foreground text-sm">
            {department.description || "Sem descrição."}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row w-full lg:w-auto gap-2">
          <Button
            onClick={() => onEdit(department)}
            variant="outline"
            className="cursor-pointer w-full sm:w-auto"
          >
            <IGRPIcon iconName="Pencil" className="w-4 h-4" strokeWidth={2} />
            Editar
          </Button>
          <Button
            variant="outline"
            onClick={onManageApps}
            className="gap-2 cursor-pointer w-full sm:w-auto"
          >
            <IGRPIcon iconName="AppWindow" className="w-4 h-4" strokeWidth={2} />
            Gerenciar Apps
          </Button>
        </div>
      </div>

      <IGRPTabs
        defaultValue="roles"
        items={tabs}
        className="min-w-0"
        tabContentClassName="px-0"
      />
    </div>
  );
}
```

Notes: type narrows from old `DepartmentWithChildren` cast to plain `DepartmentDTO` (fixes the bad cast at the original line 349). `tabs` memoized so child queries don't see new array identity each parent render.

- [ ] **Step 2: Typecheck**

Run: `pnpm exec tsc --noEmit`
Expected: no errors for this file.

- [ ] **Step 3: Commit**

```bash
git add src/features/departments/components/dept-detail.tsx
git commit -m "refactor(departments): extract DepartmentDetail"
```

---

## Task 10: Build `DepartmentDialogs`

**Files:**
- Create: `src/features/departments/components/dept-dialogs.tsx`

- [ ] **Step 1: Create the component**

Create `src/features/departments/components/dept-dialogs.tsx`:

```tsx
"use client";

import type { DialogAction, DialogState } from "../dept-dialog-state";
import { DepartmentDeleteDialog } from "./dept-delete-dialog";
import { DepartmentFormDialog } from "./dept-form-dialog";
import { ManageAppsModal } from "./Modal/manage-apps-modal";

interface Props {
  state: DialogState;
  dispatch(action: DialogAction): void;
  selectedCode: string;
}

export function DepartmentDialogs({ state, dispatch, selectedCode }: Props) {
  const close = () => dispatch({ type: "close" });

  return (
    <>
      <DepartmentFormDialog
        open={state.kind === "create" || state.kind === "edit"}
        onOpenChange={(open) => !open && close()}
        department={state.kind === "edit" ? state.dept : null}
        parentDeptId={state.kind === "create" ? state.parent : null}
      />

      {state.kind === "delete" && (
        <DepartmentDeleteDialog
          open
          onOpenChange={(open) => !open && close()}
          deptToDelete={{ code: state.code, name: state.name }}
        />
      )}

      <ManageAppsModal
        departmentCode={selectedCode}
        open={state.kind === "manageApps"}
        onOpenChange={(open) => !open && close()}
      />
    </>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `pnpm exec tsc --noEmit`
Expected: no errors for this file.

- [ ] **Step 3: Commit**

```bash
git add src/features/departments/components/dept-dialogs.tsx
git commit -m "refactor(departments): extract DepartmentDialogs"
```

---

## Task 11: Rewrite `DepartmentListTree` as a slim orchestrator

**This task wires every prior task together. After it, the old prop-drilling shape is gone and Tasks 6/8/9/10 compile cleanly.**

**Files:**
- Modify: `src/features/departments/components/dept-list-tree.tsx`

- [ ] **Step 1: Replace the file**

Replace the entire contents of `src/features/departments/components/dept-list-tree.tsx` with:

```tsx
"use client";

import type { DepartmentDTO } from "@igrp/platform-access-management-client-ts";
import { useCallback, useMemo, useReducer, useState } from "react";
import { AppCenterLoading } from "@/components/loading";
import { closedDialog, dialogReducer } from "../dept-dialog-state";
import type { DepartmentWithChildren } from "../dept-tree-utils";
import { useDepartments } from "../use-departments";
import { useDepartmentTree } from "../use-dept-tree";
import { DepartmentDetail } from "./dept-detail";
import { DepartmentDialogs } from "./dept-dialogs";
import { DepartmentEmptyState } from "./dept-empty-state";
import { DepartmentSidebar } from "./dept-sidebar";
import {
  DeptTreeContext,
  type DeptTreeContextValue,
} from "./dept-tree-context";

export function DepartmentListTree() {
  const { data: departments, isLoading, error } = useDepartments();

  const [searchTerm, setSearchTerm] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [explicitSelected, setExplicitSelected] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [dialog, dispatch] = useReducer(dialogReducer, closedDialog);

  const { filtered } = useDepartmentTree(departments, searchTerm);

  // Derived: explicit user pick wins, otherwise default to first dept.
  const selectedCode = explicitSelected ?? departments?.[0]?.code ?? null;

  // No second network round-trip — use the cached list.
  const selectedDepartment = useMemo<DepartmentDTO | undefined>(
    () => departments?.find((d) => d.code === selectedCode),
    [departments, selectedCode],
  );

  const select = useCallback((code: string) => {
    setExplicitSelected(code);
    setIsSidebarOpen(false);
  }, []);

  const toggle = useCallback((code: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(code) ? next.delete(code) : next.add(code);
      return next;
    });
  }, []);

  const onEdit = useCallback(
    (dept: DepartmentDTO) => dispatch({ type: "openEdit", dept }),
    [],
  );
  const onCreateSub = useCallback(
    (parent: DepartmentWithChildren) =>
      dispatch({ type: "openCreateSub", parent }),
    [],
  );
  const onDelete = useCallback(
    (code: string, name: string) => dispatch({ type: "openDelete", code, name }),
    [],
  );

  const treeCtx = useMemo<DeptTreeContextValue>(
    () => ({
      selectedCode,
      expanded,
      select,
      toggle,
      onEdit,
      onCreateSub,
      onDelete,
    }),
    [selectedCode, expanded, select, toggle, onEdit, onCreateSub, onDelete],
  );

  if (isLoading) return <AppCenterLoading description="Carregando departamentos..." />;
  if (error) throw error;

  const showMainEmpty = !selectedDepartment && (departments?.length ?? 0) === 0;

  return (
    <DeptTreeContext value={treeCtx}>
      <div className="flex flex-col overflow-hidden">
        <div className="flex h-full">
          <DepartmentSidebar
            filtered={filtered}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            onCreate={() => dispatch({ type: "openCreate" })}
            isOpen={isSidebarOpen}
            onOpenChange={setIsSidebarOpen}
          />

          <div className="flex-1 overflow-y-auto">
            {showMainEmpty && (
              <DepartmentEmptyState
                variant="main-no-departments"
                onCreate={() => dispatch({ type: "openCreate" })}
              />
            )}
            {selectedDepartment && (
              <DepartmentDetail
                department={selectedDepartment}
                onEdit={onEdit}
                onManageApps={() => dispatch({ type: "openManageApps" })}
              />
            )}
          </div>
        </div>

        <DepartmentDialogs
          state={dialog}
          dispatch={dispatch}
          selectedCode={selectedCode ?? ""}
        />
      </div>
    </DeptTreeContext>
  );
}
```

Notes intentionally applied:
- Auto-select bug fixed via derived `selectedCode = explicitSelected ?? departments?.[0]?.code` — user selection persists across refetches.
- `useDepartmentByCode` removed; detail reads from the cached list (no second request, no spinner).
- All handlers are stable via `useCallback`; context value memoized.
- Mobile sidebar now closes when a department is picked (via `select`).
- Uses React 19 `<Context value=…>` (no `.Provider`).
- No `!important` Tailwind classes anywhere.

- [ ] **Step 2: Typecheck + lint**

Run: `pnpm exec tsc --noEmit && pnpm lint`
Expected: no errors anywhere in `src/features/departments/`.

- [ ] **Step 3: Run all tests**

Run: `pnpm test`
Expected: previously added tests still pass; pre-existing tests unchanged.

- [ ] **Step 4: Manual smoke**

Run: `pnpm dev` and visit `/settings/departments`. Verify:
- List renders, first dept auto-selected.
- Click a different dept → stays selected after any background invalidation.
- Search filters tree, parents kept for matching children.
- Mobile (DevTools ≤ lg breakpoint): hamburger opens, selecting closes sidebar.
- Edit / Create / Create sub-dept / Delete / Manage Apps dialogs all open and close.
- No console errors, no double network requests for `getDepartments` after a mutation.

- [ ] **Step 5: Commit**

```bash
git add src/features/departments/components/dept-list-tree.tsx
git commit -m "refactor(departments): slim DepartmentListTree to compositional orchestrator"
```

---

## Task 12: RSC prefetch + `HydrationBoundary`

**Files:**
- Modify: `src/app/(igrp)/(home)/settings/departments/page.tsx`

- [ ] **Step 1: Replace the page**

Replace `src/app/(igrp)/(home)/settings/departments/page.tsx` with:

```tsx
import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query";
import { getDepartments } from "@/actions/departments";
import { DepartmentListTree } from "@/features/departments/components/dept-list-tree";

export default async function DepartmentListPage() {
  const queryClient = new QueryClient();

  await queryClient.prefetchQuery({
    queryKey: ["departments"],
    queryFn: async () => {
      const result = await getDepartments();
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <DepartmentListTree />
    </HydrationBoundary>
  );
}
```

Notes:
- `force-dynamic` removed. Since the server action is invoked at request time (cookies/headers context inside it), the page is naturally dynamic; an explicit directive is no longer needed.
- The query key (`["departments"]`) matches what `useDepartments` reads, so the client hook hydrates without refetching.

- [ ] **Step 2: Typecheck + lint**

Run: `pnpm exec tsc --noEmit && pnpm lint`
Expected: no errors.

- [ ] **Step 3: Manual smoke**

Run: `pnpm dev` and reload `/settings/departments`. Verify:
- No `AppCenterLoading` flash on initial load (list renders synchronously after hydration).
- Network tab shows the `getDepartments` call resolved server-side; the client does not refetch on mount.
- If you trigger a mutation (e.g., create dept), the list still updates.

- [ ] **Step 4: Commit**

```bash
git add src/app/(igrp)/(home)/settings/departments/page.tsx
git commit -m "feat(departments): server-prefetch list and hydrate to remove landing spinner"
```

---

## Task 13: Final sweep

**Files:**
- Modify: any residual references to the old `buildTree` / `filterTree` exported from `dept-list-tree.tsx`.

- [ ] **Step 1: Find leftover importers**

Run: `pnpm exec grep -RIn "from .*dept-list-tree" src` (or via your editor's symbol search).

Expected files to inspect: any test, dialog, or sibling component that imported `buildTree`, `filterTree`, `DepartmentWithChildren`, or `DepartmentListTree`'s helpers.

For each: change the import source from `./dept-list-tree` (or `../components/dept-list-tree`) to `../dept-tree-utils` (or `./dept-tree-utils` depending on depth). The `DepartmentListTree` named export itself is unchanged.

- [ ] **Step 2: Typecheck + lint + test**

Run: `pnpm exec tsc --noEmit && pnpm lint && pnpm test`
Expected: clean.

- [ ] **Step 3: Build**

Run: `pnpm build`
Expected: build succeeds with no warnings for the modified files.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore(departments): update imports to new tree-utils module"
```

---

## Verification Checklist (run after Task 13)

- [ ] `pnpm exec tsc --noEmit` — clean
- [ ] `pnpm lint` — clean
- [ ] `pnpm test` — green, including 2 new test files
- [ ] `pnpm build` — succeeds
- [ ] Manual: load `/settings/departments` cold → no loading spinner, first dept selected.
- [ ] Manual: click a department, trigger a mutation elsewhere → selection persists.
- [ ] Manual: open DevTools network tab during initial load → exactly one server-side call for departments, no client-side duplicate, no `getDepartmentByCode` call.
- [ ] Manual: create a dept → list refreshes once (not twice).
- [ ] Manual: mobile width — open sidebar, pick a department → sidebar closes.
- [ ] Manual: all three dropdown items (Edit / Create sub / Delete) close the menu and fire correctly.
- [ ] Visual diff against `main` for the page is functionally identical.

---

## Notes for the implementer

- **Do not** add `useEffect` to sync `explicitSelected` with `departments`. The whole point of the refactor is that `selectedCode` is derived. If you find yourself reaching for an effect there, reread Task 11.
- **Do not** re-add `refetchQueries` after `invalidateQueries`. If a test seems to require it, the test is wrong — or there is an inactive observer that should be made active by mounting.
- The `IGRPTabs` component mounts all three tab panels eagerly; lazy mounting is out of scope for this plan (would require touching the design system or wrapping each tab content). Leave the eager mount as-is.
- If `DepartmentFormDialog` previously relied on `open` going `false` to reset internal state, the new wiring still flips `open` to `false` when `dialog.kind` changes away from `create`/`edit`. Verify by editing then opening "create" — fields should not carry over.
