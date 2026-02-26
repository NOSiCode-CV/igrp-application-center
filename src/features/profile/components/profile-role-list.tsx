"use client";
import React, { useState } from "react";
import {
  IGRPBadgePrimitive,
  IGRPButtonPrimitive,
  IGRPIcon,
  useIGRPToast,
} from "@igrp/igrp-framework-react-design-system";
import { AppCenterLoading } from "@/components/loading";
import {
  useCurrentUserActiveRole,
  useGetCurrentUserRoles,
  useSetCurrentUserActiveRole,
} from "@/features/users/use-users";

export default function ProfileRoleList() {
  const { igrpToast } = useIGRPToast();
  const { data: userRoles, isLoading } = useGetCurrentUserRoles();

  const { data: activeRole } = useCurrentUserActiveRole();
  const { mutateAsync: setActiveRole, isPending: isSettingActive } =
    useSetCurrentUserActiveRole();

  const handleActivateRole = async (role: any) => {
    const payload = {
      roleCode: role.code,
      departmentCode: role.departmentCode,
    };
    try {
      const res = await setActiveRole(payload);

      if (!res.success) {
        throw new Error(res.error);
      }

      igrpToast({
        type: "success",
        title: "Perfil ativado com sucesso.",
      });
    } catch (error) {
      igrpToast({
        type: "error",
        title: "Erro ao ativar perfil.",
        description:
          error instanceof Error ? error.message : "Erro desconhecido.",
      });
    }
  };

  const isRoleActive = (roleCode?: string) => {
    return activeRole?.roleCode === roleCode;
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
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm">{role.name}</p>
                        {isRoleActive(role.code) && (
                          <IGRPBadgePrimitive
                            variant={"secondary"}
                            className="bg-green-800 text-white text-xs"
                          >
                            Ativado
                          </IGRPBadgePrimitive>
                        )}
                      </div>
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
                        {role.permissions.slice(0, 3).map((permission: any) => (
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
                  variant={isRoleActive(role.code) ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => handleActivateRole(role)}
                  disabled={isRoleActive(role.code) || isSettingActive}
                  className="shrink-0 cursor-pointer"
                >
                  {isRoleActive(role.code) ? "Ativo" : "Ativar"}
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
        </div>
      )}
    </div>
  );
}
