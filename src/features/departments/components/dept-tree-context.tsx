"use client";

import { createContext, use } from "react";

import type { DepartmentWithChildren } from "../dept-tree-utils";

export interface DeptTreeContextValue {
  selectedCode: string | null;
  expanded: Set<string>;
  /** While a search filter is active, matching branches render expanded. */
  searchActive: boolean;
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
