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

  // Derived: explicit user pick wins (if still present), otherwise default to first dept.
  const selectedCode =
    (explicitSelected &&
    departments?.some((d) => d.code === explicitSelected)
      ? explicitSelected
      : departments?.[0]?.code) ?? null;

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
    (code: string, name: string) =>
      dispatch({ type: "openDelete", code, name }),
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

  if (isLoading)
    return <AppCenterLoading description="Carregando departamentos..." />;
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
