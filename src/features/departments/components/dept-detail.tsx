"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useMemo } from "react";

import {
  Badge,
  Button,
  IGRPIcon,
  type IGRPTabItem,
  IGRPTabs,
} from "@igrp/igrp-framework-react-design-system";
import type { DepartmentDTO } from "@igrp/platform-access-management-client-ts";
import { useTranslations } from "next-intl";

import { CopyToClipboard } from "@/components/copy-to-clipboard";
import { PermissionList } from "@/features/permissions/components/permission-list";
import { RolesListTree } from "@/features/roles/components/role-tree-list";
import { useStatusLabel } from "@/i18n/status";
import { getStatusColor } from "@/lib/utilities";

import { MenuPermissions } from "./dept-menu";

interface Props {
  department: DepartmentDTO;
  onEdit(dept: DepartmentDTO): void;
  onManageApps(): void;
}

export function DepartmentDetail({ department, onEdit, onManageApps }: Props) {
  const t = useTranslations("departments.detail");
  const tActions = useTranslations("departments.actions");
  const statusLabel = useStatusLabel();
  const router = useRouter();
  const searchParams = useSearchParams();

  const tabs = useMemo<IGRPTabItem[]>(
    () => [
      {
        label: t("tabRoles"),
        value: "roles",
        content: <RolesListTree departmentCode={department.code} />,
      },
      {
        label: t("tabPermissions"),
        value: "permissions",
        content: <PermissionList departmentCode={department.code} />,
      },
      {
        label: t("tabMenus"),
        value: "menus",
        content: <MenuPermissions departmentCode={department.code} />,
      },
    ],
    [department.code, t],
  );

  const requestedTab = searchParams.get("tab");
  const activeTab =
    requestedTab && tabs.some((t) => t.value === requestedTab)
      ? requestedTab
      : tabs[0].value;

  const handleTabChange = (next: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", next);
    router.replace(`?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="w-full">
      <div className="flex flex-col lg:flex-row items-start justify-between mb-6 gap-4">
        <div className="w-full lg:w-auto">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl font-bold text-balance">
              {department.name}
            </h1>
            <Badge className={getStatusColor(department.status ?? "ACTIVE")}>
              {department.status ? statusLabel(department.status) : "—"}
            </Badge>
          </div>
          <div className="flex items-center">
            <span
              translate="no"
              className="font-mono text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded"
            >
              #{department.code}
            </span>
            <CopyToClipboard value={department.code} />
          </div>
          <p className="text-muted-foreground text-sm">
            {department.description || t("noDescription")}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row w-full lg:w-auto gap-2">
          <Button
            onClick={() => onEdit(department)}
            variant="outline"
            className="cursor-pointer w-full sm:w-auto"
          >
            <IGRPIcon
              iconName="Pencil"
              aria-hidden
              className="size-4"
              strokeWidth={2}
            />
            {tActions("edit")}
          </Button>
          <Button
            variant="outline"
            onClick={onManageApps}
            className="gap-2 cursor-pointer w-full sm:w-auto"
          >
            <IGRPIcon
              iconName="AppWindow"
              aria-hidden
              className="size-4"
              strokeWidth={2}
            />
            {t("manageApps")}
          </Button>
        </div>
      </div>

      <IGRPTabs
        value={activeTab}
        onValueChange={handleTabChange}
        items={tabs}
        className="min-w-0"
        tabContentClassName="px-0"
      />
    </div>
  );
}
