"use client";

import { useMemo, useState } from "react";

import type { PermissionDTO } from "@igrp/platform-access-management-client-ts";
import { useTranslations } from "next-intl";

import { useDepartmentPermissions } from "@/features/departments/use-departments";

import { ScopedPickerDialog } from "./scoped-picker-dialog";

export function PermissionPickerDialog({
  open,
  onOpenChange,
  selectedIds,
  onConfirm,
  isSaving,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedIds: readonly number[];
  onConfirm: (r: { scope: PermissionDTO[]; selected: PermissionDTO[] }) => void;
  isSaving: boolean;
}) {
  const t = useTranslations("serviceAccounts");
  const [departmentCode, setDepartmentCode] = useState<string>();
  const permissions = useDepartmentPermissions(departmentCode);
  const data = permissions.data;
  const items = useMemo(
    () =>
      (data ?? []).map((p) => ({
        id: p.id,
        label: p.name,
        description: p.description,
      })),
    [data],
  );
  return (
    <ScopedPickerDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t("permissionPicker.title")}
      description={t("shared.directNote")}
      departmentCode={departmentCode}
      onDepartmentChange={setDepartmentCode}
      items={items}
      isLoading={permissions.isLoading}
      isError={permissions.isError}
      selectedIds={selectedIds}
      isSaving={isSaving}
      confirmLabel={t("permissionPicker.confirm")}
      onConfirm={({ scopeIds, selectedIds: ids }) => {
        const all = data ?? [];
        onConfirm({
          scope: all.filter((p) => scopeIds.includes(p.id)),
          selected: all.filter((p) => ids.includes(p.id)),
        });
      }}
    />
  );
}
