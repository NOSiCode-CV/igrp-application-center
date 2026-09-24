"use client";

import { useState } from "react";

import { Button, useIGRPToast } from "@igrp/igrp-framework-react-design-system";
import type {
  RoleDTO,
  ServiceAccountDTO,
} from "@igrp/platform-access-management-client-ts";

import { InlineError } from "@/components/inline-error";

import {
  groupRolesByDepartment,
  mergeScopedSelection,
} from "../lib/service-account-utils";
import { useSetServiceAccountAccess } from "../use-service-accounts";
import { RolePickerDialog } from "./role-picker-dialog";

export function ServiceAccountRolesSection({
  account,
  roles,
  isLoading,
  isError,
  onRetry,
}: {
  account: ServiceAccountDTO;
  roles: readonly RoleDTO[];
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
}) {
  const { igrpToast } = useIGRPToast();
  const access = useSetServiceAccountAccess();
  const [picking, setPicking] = useState(false);
  const [confirming, setConfirming] = useState<number | null>(null);
  const roleIds = account.roleIds ?? [];

  async function save(next: number[], success: string) {
    const result = await access.mutateAsync({
      id: account.id,
      access: { roleIds: next },
    });
    if (!result.success) {
      igrpToast({
        type: "error",
        title: "Não foi possível guardar os perfis",
        description: result.error,
      });
      return false;
    }
    igrpToast({ type: "success", title: success, description: account.name });
    return true;
  }

  return (
    <section
      aria-labelledby="sa-roles"
      className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5"
    >
      <div className="flex items-center justify-between gap-3">
        <h3 id="sa-roles" className="font-semibold">
          Perfis
        </h3>
        <Button size="sm" variant="outline" onClick={() => setPicking(true)}>
          Atribuir perfil
        </Button>
      </div>
      {isError ? (
        <InlineError
          title="Não foi possível carregar os perfis."
          message="Tente novamente."
          onRetry={onRetry}
        />
      ) : isLoading ? (
        <p className="text-sm text-muted-foreground">A carregar perfis…</p>
      ) : roleIds.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Esta conta ainda não tem perfis.
        </p>
      ) : (
        groupRolesByDepartment(roles).map((group) => (
          <div key={group.departmentCode} className="flex flex-col gap-2">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {group.departmentCode}
            </h4>
            <ul className="flex flex-col divide-y divide-border rounded-lg border border-border">
              {group.roles.map((role) => (
                <li key={role.id} className="flex items-center gap-3 p-3">
                  <div className="flex flex-1 flex-col gap-0.5">
                    <span className="font-mono text-sm">{role.code}</span>
                    {role.description ? (
                      <span className="text-sm text-muted-foreground">
                        {role.description}
                      </span>
                    ) : null}
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {(role.permissions ?? []).length} permissões
                  </span>
                  {confirming === role.id ? (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setConfirming(null)}
                        disabled={access.isPending}
                      >
                        Cancelar
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        disabled={access.isPending}
                        onClick={async () => {
                          if (
                            await save(
                              roleIds.filter((r) => r !== role.id),
                              "Perfil removido",
                            )
                          )
                            setConfirming(null);
                        }}
                      >
                        Confirmar remoção
                      </Button>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      variant="ghost"
                      aria-label={`Remover perfil ${role.code}`}
                      disabled={access.isPending}
                      onClick={() => setConfirming(role.id)}
                    >
                      Remover
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))
      )}
      {picking ? (
        <RolePickerDialog
          open
          onOpenChange={setPicking}
          selectedIds={roleIds}
          isSaving={access.isPending}
          onConfirm={async ({ scope, selected }) => {
            const next = mergeScopedSelection(
              roleIds,
              scope.map((r) => r.id),
              selected.map((r) => r.id),
            );
            if (await save(next, "Perfis atualizados")) setPicking(false);
          }}
        />
      ) : null}
    </section>
  );
}
