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
            <span className="font-mono text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded">
              #{department.code}
            </span>
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
            <IGRPIcon iconName="Pencil" className="size-4" strokeWidth={2} />
            Editar
          </Button>
          <Button
            variant="outline"
            onClick={onManageApps}
            className="gap-2 cursor-pointer w-full sm:w-auto"
          >
            <IGRPIcon
              iconName="AppWindow"
              className="size-4"
              strokeWidth={2}
            />
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
