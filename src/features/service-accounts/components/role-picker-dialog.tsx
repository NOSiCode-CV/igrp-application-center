"use client";

import { useMemo, useState } from "react";

import type { RoleDTO } from "@igrp/platform-access-management-client-ts";

import { useRoles } from "@/features/departments/use-departments";

import { ScopedPickerDialog } from "./scoped-picker-dialog";

export function RolePickerDialog({
  open,
  onOpenChange,
  selectedIds,
  onConfirm,
  isSaving,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedIds: readonly number[];
  onConfirm: (r: { scope: RoleDTO[]; selected: RoleDTO[] }) => void;
  isSaving: boolean;
}) {
  const [departmentCode, setDepartmentCode] = useState<string>();
  const roles = useRoles(departmentCode ?? "");
  const data = roles.data;
  const items = useMemo(
    () =>
      (data ?? []).map((r) => ({
        id: r.id,
        label: r.code,
        description: r.description,
      })),
    [data],
  );
  return (
    <ScopedPickerDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Atribuir perfis"
      description="Os perfis de outros departamentos não são alterados aqui."
      departmentCode={departmentCode}
      onDepartmentChange={setDepartmentCode}
      items={items}
      isLoading={roles.isLoading}
      isError={roles.isError}
      selectedIds={selectedIds}
      isSaving={isSaving}
      confirmLabel="Guardar perfis"
      onConfirm={({ scopeIds, selectedIds: ids }) => {
        const all = data ?? [];
        onConfirm({
          scope: all.filter((r) => scopeIds.includes(r.id)),
          selected: all.filter((r) => ids.includes(r.id)),
        });
      }}
    />
  );
}
