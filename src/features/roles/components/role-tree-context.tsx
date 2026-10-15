"use client";

import { createContext, use } from "react";

import type { RoleWithChildren } from "./role-tree-list";

export interface RoleTreeContextValue {
  expandedRoles: Set<string>;
  toggleExpand(roleCode: string): void;
  handleEdit(role: RoleWithChildren): void;
  handleNewSubRole(role: RoleWithChildren): void;
  handlePermissions(role: RoleWithChildren): void;
  handleDelete(roleCode: string): void;
}

export const RoleTreeContext = createContext<RoleTreeContextValue | null>(null);

export function useRoleTree(): RoleTreeContextValue {
  const ctx = use(RoleTreeContext);
  if (!ctx)
    throw new Error("useRoleTree must be used within <RoleTreeContext>");
  return ctx;
}
