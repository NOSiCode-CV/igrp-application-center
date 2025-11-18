"use client";

import {
  IGRPBadgePrimitive,
  IGRPIcon,
} from "@igrp/igrp-framework-react-design-system";
import type { RoleDTO } from "@igrp/platform-access-management-client-ts";
import { cn, getStatusColor, showStatus } from "@/lib/utils";
import { useUserRoles } from "../use-users";

interface RolesListProps {
  id: number;
}

export function UserRolesList({ id }: RolesListProps) {
  const { data, isLoading, isError } = useUserRoles(id);

  if (isLoading) return <div className="p-6 text-center text-muted-foreground">Carregando...</div>;
  if (isError) return <div className="p-6 text-center text-destructive">Erro ao carregar perfis</div>;

  const roles = data ?? [];

  if (roles.length === 0) {
    return (
      <div className="flex items-center gap-3 rounded-md border border-dashed p-6 text-muted-foreground">
        <IGRPIcon iconName="AlertCircle" className="h-5 w-5 shrink-0" />
        <div>
          <p className="text-sm font-medium">Sem perfis atribuídos</p>
          <p className="text-xs">Este utilizador ainda não tem perfis atribuídos.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 py-4 px-2 bg-muted/50">
      {roles.map((role) => (
        <UserRoleItem key={role.id} role={role} />
      ))}
    </div>
  );
}

interface UserRoleItemProps {
  role: RoleDTO;
}

function UserRoleItem({ role }: UserRoleItemProps) {
  return (
    <div className="flex items-start gap-3 rounded-md p-3 transition-colors hover:bg-accent/50">
      <div className="rounded-md p-2 shrink-0 bg-primary/10 text-primary">
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
          <p className="text-sm text-muted-foreground">{role.description}</p>
        )}
      </div>
    </div>
  );
}