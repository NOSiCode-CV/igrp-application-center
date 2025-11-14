'use client'
import React from 'react'
import { useRemoveUserRole, useUserRoles } from '../use-users';
import { IGRPButtonPrimitive, IGRPIcon, useIGRPToast } from '@igrp/igrp-framework-react-design-system';

export default function UserRoleList({ user, handleName }: {
  user: any
  handleName: any
}) {

  const { igrpToast } = useIGRPToast();
  const { data: userRoles } = useUserRoles(user.id);
  const { mutateAsync: removeUserRole, isPending, variables } = useRemoveUserRole();

  const handleRevokeRole = async (name: string) => {
    if (!name) return;

    try {
      await removeUserRole({ id: user.id, roleNames: [name] });
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
    return isPending && variables?.roleNames.includes(roleCode);
  };

  return (
    <div>
      {userRoles && userRoles.length > 0 && (
        <div>
          <h2 className="text-xl font-bold my-3">Permissões do Utilizador</h2>

          <div className="grid gap-3">
            {userRoles.map((role) => (
              <div
                key={role.id}
                className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="rounded-full bg-primary/10 p-2.5">
                    <IGRPIcon
                      iconName="Shield"
                      className="text-primary size-5"
                    />
                  </div>
                  <div className="flex flex-col">
                    <p className="font-medium capitalize">
                      {handleName(role.description || role.name || "")}
                    </p>
                    {role.code && (
                      <p className="text-xs text-muted-foreground">
                        {role.code}
                      </p>
                    )}
                  </div>
                </div>
                <IGRPButtonPrimitive
                  variant="outline"
                  size="sm"
                  onClick={() => handleRevokeRole(role.code || "")}
                  disabled={isRemovingRole(role.code || "")}
                >
                  {isRemovingRole(role.code || "") ? "Aguarde..." : "Revogar"}
                </IGRPButtonPrimitive>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}