"use client";
import React, { useState } from "react";
import { useRemoveUserRole, useUserRoles } from "../use-users";
import {
  IGRPBadgePrimitive,
  IGRPButtonPrimitive,
  IGRPIcon,
  useIGRPToast,
} from "@igrp/igrp-framework-react-design-system";
import { IGRPUserDTO } from "@igrp/platform-access-management-client-ts";
import { UserRolesDialog } from "./user-role-dialog";
import { AppCenterLoading } from "@/components/loading";

export default function UserRoleList({ user }: { user: IGRPUserDTO }) {
  const { igrpToast } = useIGRPToast();
  const { data: userRoles, isLoading } = useUserRoles(user.id);
  const {
    mutateAsync: removeUserRole,
    isPending,
    variables,
  } = useRemoveUserRole();

  const [assignDialogOpen, setAssignDialogOpen] = useState(false);

  const handleRevokeRole = async (
    departmentCode: string,
    roleCodes: string[],
  ) => {
    if (!roleCodes) return;

    try {
      await removeUserRole({ id: user.id, departmentCode, roleCodes });
      igrpToast({
        type: "success",
        title: "Perfil removido com sucesso.",
      });
    } catch (error) {
      igrpToast({
        type: "error",
        title: "Não foi possivel remover o perfil.",
        description:
          error instanceof Error
            ? error.message
            : "Ocorreu um erro desconhecido.",
      });
    }
  };

  const isRemovingRole = (roleCode: string) => {
    return isPending && variables?.roleCodes.includes(roleCode);
  };
  if (isLoading) {
    return <AppCenterLoading descrption="Carregando perfis..." />;
  }

  return (
    <div>
      {userRoles && userRoles.length > 0 ? (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Perfis Atribuídos</h2>
            <IGRPButtonPrimitive
              variant="outline"
              size="sm"
              onClick={() => setAssignDialogOpen(true)}
            >
              <IGRPIcon iconName="Plus" />
              Adicionar
            </IGRPButtonPrimitive>
          </div>

          <div className="space-y-3">
            {userRoles.map((role) => (
              <div
                key={role.id}
                className="flex items-start justify-between p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors"
              >
                <div className="flex items-start gap-3 flex-1">
                  <div className="rounded-full bg-primary/10 p-2">
                    <IGRPIcon
                      iconName="Shield"
                      className="text-primary size-4"
                    />
                  </div>

                  <div className="flex-1 space-y-2">
                    <div>
                      <p className="font-medium text-sm">{role.name}</p>
                      {role.code && (
                        <p className="text-xs text-muted-foreground">
                          {role.code}
                        </p>
                      )}
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
                          {role.permissions.length === 1
                            ? "permissão"
                            : "permissões"}
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
                          <IGRPBadgePrimitive
                            variant="secondary"
                            className="text-xs"
                          >
                            +{role.permissions.length - 3} mais
                          </IGRPBadgePrimitive>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <IGRPButtonPrimitive
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    handleRevokeRole(role.departmentCode, [role.code])
                  }
                  disabled={isRemovingRole(role.code || "")}
                  className="shrink-0"
                >
                  {isRemovingRole(role.code || "") ? "..." : "Revogar"}
                </IGRPButtonPrimitive>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 p-6 text-center border border-dashed rounded-lg">
          <IGRPIcon
            iconName="ShieldOff"
            className="size-8 text-muted-foreground"
          />
          <div>
            <p className="font-medium text-sm">Sem perfis atribuídos</p>
            <p className="text-xs text-muted-foreground">
              Este utilizador não tem perfis.
            </p>
          </div>
          <IGRPButtonPrimitive
            size="sm"
            onClick={() => setAssignDialogOpen(true)}
          >
            <IGRPIcon iconName="Plus" />
            Associar Perfis
          </IGRPButtonPrimitive>
        </div>
      )}

      {assignDialogOpen && (
        <UserRolesDialog
          open={assignDialogOpen}
          onOpenChange={setAssignDialogOpen}
          id={user.id}
        />
      )}
    </div>
  );
}
