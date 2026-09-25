"use client";

import { useState } from "react";

import { Button, useIGRPToast } from "@igrp/igrp-framework-react-design-system";
import type {
  RoleDTO,
  ServiceAccountDTO,
} from "@igrp/platform-access-management-client-ts";

import type { AccessChange } from "@/actions/service-accounts";
import { InlineError } from "@/components/inline-error";

import { groupRolesByDepartment } from "../lib/service-account-utils";
import {
  useAccountBusy,
  useSetServiceAccountAccess,
} from "../use-service-accounts";
import { RolePickerDialog } from "./role-picker-dialog";

// Stable across renders — a fresh `[]` literal every render would re-seed
// `ScopedPickerDialog`'s selection effect and wipe unsaved ticks while open.
const NO_IDS: readonly number[] = [];

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
  const access = useSetServiceAccountAccess(account.id);
  const busy = useAccountBusy(account.id);
  const [picking, setPicking] = useState(false);
  const [confirming, setConfirming] = useState<number | null>(null);
  const roleIds = account.roleIds ?? NO_IDS;

  async function save(
    roles: NonNullable<AccessChange["roles"]>,
    success: string,
  ) {
    const result = await access.mutateAsync({
      id: account.id,
      change: { roles },
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
        <Button
          size="sm"
          variant="outline"
          disabled={busy}
          onClick={() => setPicking(true)}
        >
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
                        disabled={busy}
                      >
                        Cancelar
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        disabled={busy}
                        onClick={async () => {
                          if (
                            await save({ remove: [role.id] }, "Perfil removido")
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
                      disabled={busy}
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
          isSaving={busy}
          onConfirm={async ({ scope, selected }) => {
            const change = {
              scope: scope.map((r) => r.id),
              selected: selected.map((r) => r.id),
            };
            if (await save(change, "Perfis atualizados")) setPicking(false);
          }}
        />
      ) : null}
    </section>
  );
}
