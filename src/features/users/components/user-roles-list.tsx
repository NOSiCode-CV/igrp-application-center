"use client";

import {
  IGRPBadgePrimitive,
  IGRPButtonPrimitive,
  IGRPIcon,
} from "@igrp/igrp-framework-react-design-system";
import type { RoleDTO } from "@igrp/platform-access-management-client-ts";
import { useMemo, useState } from "react";
import { cn, getStatusColor, showStatus } from "@/lib/utils";
import { useUserRoles } from "../use-users";

interface RoleNode extends RoleDTO {
  children: RoleNode[];
}

function buildRoleHierarchy(roles: RoleDTO[]): RoleNode[] {
  const roleMap = new Map<string, RoleNode>();
  const rootRoles: RoleNode[] = [];

  roles.forEach((role) => {
    roleMap.set(role.code, { ...role, children: [] });
  });

  roles.forEach((role) => {
    const node = roleMap.get(role.code)!;
    if (role.parentCode && roleMap.has(role.parentCode)) {
      const parent = roleMap.get(role.parentCode)!;
      parent.children.push(node);
    } else {
      rootRoles.push(node);
    }
  });

  return rootRoles;
}

interface RolesListProps {
  id: number;
  level?: number;
}

export function UserRolesList({ id, level = 0 }: RolesListProps) {
  const { data, isLoading, isError } = useUserRoles(id);

  if (isLoading) return <div>…</div>;
  if (isError) return <div>—</div>;

  const roles = data ?? [];

  const hierarchy = useMemo(() => buildRoleHierarchy(roles), [roles]);

  if (roles.length === 0) {
    return (
      <div className="flex items-center gap-3 rounded-md border border-dashed p-6 text-muted-foreground">
        <IGRPIcon iconName="AlertCircle" className="h-5 w-5 shrink-0" />
        <div>
          <p className="text-sm font-medium">Sem perfís atribuídos</p>
          <p className="text-xs">
            Este utilizador ainda não tem perfís atribuídos.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 py-4 px-2 bg-muted/50">
      {hierarchy.map((role) => (
        <UserRoleItem key={role.id} role={role} level={level} />
      ))}
    </div>
  );
}

interface UserRoleItemProps {
  role: RoleNode;
  level: number;
}

function UserRoleItem({ role, level }: UserRoleItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasChildren = role.children && role.children.length > 0;

  return (
    <div className="flex flex-col gap-1">
      <div
        className={cn(
          "flex items-start gap-2 rounded-md p-3 transition-colors hover:bg-accent/50",
          level > 0 && "ml-6",
        )}
        style={{ marginLeft: level > 0 ? `${level * 1.5}rem` : undefined }}
      >
        {hasChildren ? (
          <IGRPButtonPrimitive
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-6 w-6 p-0 shrink-0"
          >
            {isExpanded ? (
              <IGRPIcon iconName="ChevronUp" />
            ) : (
              <IGRPIcon iconName="ChevronRight" />
            )}
          </IGRPButtonPrimitive>
        ) : (
          <div className="h-6 w-6 shrink-0" />
        )}

        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div
            className={cn(
              "rounded-md p-2 shrink-0",
              level === 0
                ? "bg-primary/10 text-primary"
                : "bg-muted text-muted-foreground",
            )}
          >
            <IGRPIcon iconName="Shield" className="h-4 w-4" />
          </div>

          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-semibold text-sm">{role.name}</h4>
              <IGRPBadgePrimitive
                variant="outline"
                className={cn("text-xs", getStatusColor(role.status))}
              >
                {showStatus(role.status)}
              </IGRPBadgePrimitive>
            </div>

            {role.description && (
              <p className="text-sm text-muted-foreground">
                {role.description}
              </p>
            )}

            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <IGRPIcon iconName="Building2" className="h-3 w-3" />
                <span>{role.departmentCode}</span>
              </div>
              <div className="flex items-center gap-1">
                <IGRPIcon iconName="Shield" className="h-3 w-3" />
                <span>
                  {role.permissions.length}{" "}
                  {role.permissions.length === 1 ? "permissão" : "permissões"}
                </span>
              </div>
              {role.parentCode && (
                <div className="text-xs">
                  Associados:{" "}
                  <span className="font-mono">{role.parentCode}</span>
                </div>
              )}
            </div>

            {role.permissions.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {role.permissions.slice(0, 3).map((permission) => (
                  <IGRPBadgePrimitive
                    key={permission}
                    variant="secondary"
                    className="text-xs font-mono"
                  >
                    {permission}
                  </IGRPBadgePrimitive>
                ))}
                {role.permissions.length > 3 && (
                  <IGRPBadgePrimitive variant="secondary" className="text-xs">
                    +{role.permissions.length - 3} more
                  </IGRPBadgePrimitive>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {hasChildren && isExpanded && (
        <div className="flex flex-col-gap-1">
          {role.children.map((child) => (
            <UserRoleItem key={child.id} role={child} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
}
