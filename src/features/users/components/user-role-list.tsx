"use client";
import { useState } from "react";

import {
  Badge,
  Button,
  IGRPIcon,
  Skeleton,
  useIGRPToast,
} from "@igrp/igrp-framework-react-design-system";
import type {
  IGRPUserDTO,
  RoleDTO,
} from "@igrp/platform-access-management-client-ts";

import { ConfirmDialog } from "@/components/confirmation-modal";

import { useAddUserRole, useRemoveUserRole, useUserRoles } from "../use-users";
import { UserRolesDialog } from "./user-role-dialog";

export default function UserRoleList({ user }: { user: IGRPUserDTO }) {
  const { igrpToast } = useIGRPToast();
  const { data: userRoles, isLoading } = useUserRoles(user.id);
  const {
    mutateAsync: removeUserRole,
    isPending,
    variables,
  } = useRemoveUserRole();
  const { mutateAsync: addUserRole } = useAddUserRole();

  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [roleToRevoke, setRoleToRevoke] = useState<RoleDTO | null>(null);

  const userLabel = user.name || user.email;

  const restoreRole = async (role: RoleDTO) => {
    try {
      const res = await addUserRole({
        id: user.id,
        departmentCode: role.departmentCode,
        request: { roles: [role.code] },
      });
      if (!res.success) {
        throw new Error(res.error);
      }
      igrpToast({
        type: "success",
        title: "Perfil reposto.",
        description: `«${role.name ?? role.code}» foi novamente atribuído a ${userLabel}.`,
      });
    } catch (error) {
      igrpToast({
        type: "error",
        title: "Não foi possível repor o perfil.",
        description:
          error instanceof Error
            ? error.message
            : "Ocorreu um erro desconhecido.",
      });
    }
  };

  const handleRevokeRole = async (role: RoleDTO) => {
    try {
      const res = await removeUserRole({
        id: user.id,
        departmentCode: role.departmentCode,
        roleCodes: [role.code],
      });
      if (!res.success) {
        throw new Error(res.error);
      }
      igrpToast({
        type: "success",
        title: "Perfil revogado.",
        description: `«${role.name ?? role.code}» foi removido de ${userLabel} no departamento ${role.departmentCode}.`,
        duration: 10000,
        action: {
          label: "Anular",
          onClick: () => {
            void restoreRole(role);
          },
        },
      });
    } catch (error) {
      igrpToast({
        type: "error",
        title: "Não foi possível remover o perfil.",
        description:
          error instanceof Error
            ? error.message
            : "Ocorreu um erro desconhecido.",
      });
    } finally {
      setRoleToRevoke(null);
    }
  };

  const isRemovingRole = (roleCode: string) => {
    return isPending && variables?.roleCodes.includes(roleCode);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3" aria-busy="true">
        <div className="flex items-center justify-between mb-1">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-8 w-28" />
        </div>
        {Array.from({ length: 3 }).map((_, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton loader
          <Skeleton key={i} className="h-28 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div>
      {userRoles && userRoles.length > 0 ? (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Perfis Atribuídos</h2>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAssignDialogOpen(true)}
            >
              <IGRPIcon iconName="Plus" />
              Adicionar
            </Button>
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
                          Perfil superior:{" "}
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

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setRoleToRevoke(role)}
                  disabled={isRemovingRole(role.code || "")}
                  className="shrink-0 cursor-pointer text-destructive hover:text-destructive"
                >
                  {isRemovingRole(role.code || "") ? "A revogar..." : "Revogar"}
                </Button>
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
          <Button size="sm" onClick={() => setAssignDialogOpen(true)}>
            <IGRPIcon iconName="Plus" />
            Associar Perfis
          </Button>
        </div>
      )}

      {assignDialogOpen && (
        <UserRolesDialog
          open={assignDialogOpen}
          onOpenChange={setAssignDialogOpen}
          id={user.id}
        />
      )}

      <ConfirmDialog
        open={roleToRevoke !== null}
        onOpenChange={(open) => {
          if (!open) setRoleToRevoke(null);
        }}
        title="Revogar perfil"
        description={
          roleToRevoke
            ? `Revogar «${roleToRevoke.name ?? roleToRevoke.code}» de ${userLabel} no departamento ${roleToRevoke.departmentCode}? O utilizador perde os acessos que este perfil concede.`
            : ""
        }
        onConfirm={() => {
          if (roleToRevoke) void handleRevokeRole(roleToRevoke);
        }}
        isLoading={isRemovingRole(roleToRevoke?.code ?? "")}
        confirmText="Revogar"
        loadingText="A revogar..."
        iconName="ShieldOff"
        variant="destructive"
      />
    </div>
  );
}
