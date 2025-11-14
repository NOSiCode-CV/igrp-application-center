'use client'
import React from 'react'
import { useUserRoles } from '../use-users';
import { IGRPButtonPrimitive, IGRPIcon } from '@igrp/igrp-framework-react-design-system';

export default function UserRoleList({user, handleName, handleRevokeRole}: {
  user: any
  handleName: any
  handleRevokeRole: any
}) {
    const { data: userRoles } = useUserRoles(user.id);
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
                >
                  Revogar
                </IGRPButtonPrimitive>
              </div>
            ))}
          </div>
        </div>
      )}
      </div>
  )
}
