"use client";
import { useState } from "react";

import {
  Badge,
  Button,
  cn,
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
  const [activatingCode, setActivatingCode] = useState<string | null>(null);

  const handleActivateRole = async (role: {
    code: string;
    departmentCode: string;
  }) => {
    const payload = {
      roleCode: role.code,
      departmentCode: role.departmentCode,
    };
    setActivatingCode(role.code);
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
    } finally {
      setActivatingCode(null);
    }
  };

  const isRoleActive = (roleCode?: string) => {
    return activeRole?.roleCode === roleCode;
  };

  if (isLoading) {
    return <AppCenterLoading description="Carregando perfis…" />;
  }

  return (
    <div>
      {userRoles && userRoles.length > 0 ? (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Perfis Atribuídos</h2>
          </div>

          <div className="flex flex-col gap-3">
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

                  <div className="flex-1 flex flex-col gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm">{role.name}</p>
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
                        <IGRPIcon iconName="Building2" className="size-3" />
                        <span>{role.departmentCode}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <IGRPIcon iconName="Shield" className="size-3" />
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
                        {role.permissions
                          .slice(0, 3)
                          .map((permission: string) => (
                            <Badge
                              key={permission}
                              variant="secondary"
                              className="text-xs font-mono"
                            >
                              {permission}
                            </Badge>
                          ))}
                        {role.permissions.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{role.permissions.length - 3} mais
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {!isRoleActive(role.code) && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleActivateRole(role)}
                    disabled={isSettingActive}
                    className="shrink-0 cursor-pointer gap-1.5 transition-colors hover:border-primary hover:text-primary"
                  >
                    <IGRPIcon
                      iconName={
                        activatingCode === role.code ? "LoaderCircle" : "Check"
                      }
                      className={cn(
                        "size-4",
                        activatingCode === role.code && "animate-spin",
                      )}
                    />
                    {activatingCode === role.code ? "A ativar…" : "Ativar"}
                  </Button>
                )}
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
              Ainda não tem perfis atribuídos.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
