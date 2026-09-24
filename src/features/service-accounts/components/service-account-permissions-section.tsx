"use client";

import { useState } from "react";

import {
  Badge,
  Button,
  IGRPIcon,
  useIGRPToast,
} from "@igrp/igrp-framework-react-design-system";
import type { ServiceAccountDTO } from "@igrp/platform-access-management-client-ts";

import {
  mergeScopedSelection,
  pairDirectPermissions,
} from "../lib/service-account-utils";
import { useSetServiceAccountAccess } from "../use-service-accounts";
import { PermissionPickerDialog } from "./permission-picker-dialog";

const UNPAIRED_REASON =
  "Não é possível remover: o servidor não indicou que permissão corresponde a cada identificador.";

export function ServiceAccountPermissionsSection({
  account,
}: {
  account: ServiceAccountDTO;
}) {
  const { igrpToast } = useIGRPToast();
  const access = useSetServiceAccountAccess();
  const [picking, setPicking] = useState(false);
  const [confirming, setConfirming] = useState<string | null>(null);
  const permissionIds = account.permissionIds ?? [];
  const { items, reliable } = pairDirectPermissions(account);

  async function save(next: number[], success: string) {
    const result = await access.mutateAsync({
      id: account.id,
      access: { permissionIds: next },
    });
    if (!result.success) {
      igrpToast({
        type: "error",
        title: "Não foi possível guardar as permissões",
        description: result.error,
      });
      return false;
    }
    igrpToast({ type: "success", title: success, description: account.name });
    return true;
  }

  return (
    <section
      aria-labelledby="sa-direct"
      className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5"
    >
      <div className="flex items-center justify-between gap-3">
        <h3 id="sa-direct" className="font-semibold">
          Permissões diretas
        </h3>
        <Button size="sm" variant="outline" onClick={() => setPicking(true)}>
          Adicionar permissão
        </Button>
      </div>
      <p
        role="note"
        className="flex gap-2 rounded-lg bg-info-subtle p-3 text-sm text-info-subtle-foreground"
      >
        <IGRPIcon
          iconName="Info"
          className="mt-0.5 size-4 shrink-0"
          aria-hidden="true"
        />
        Permissões diretas não são revogadas quando se remove um perfil. Prefira
        perfis.
      </p>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">Sem permissões diretas.</p>
      ) : (
        <ul className="flex flex-col divide-y divide-border rounded-lg border border-border">
          {items.map((p) => (
            <li key={p.name} className="flex items-center gap-3 p-3">
              <span className="flex-1 font-mono text-sm">{p.name}</span>
              <Badge variant="secondary">direta</Badge>
              {confirming === p.name && p.id !== null ? (
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
                          permissionIds.filter((id) => id !== p.id),
                          "Permissão removida",
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
                  aria-label={`Remover permissão ${p.name}`}
                  title={reliable ? undefined : UNPAIRED_REASON}
                  disabled={!reliable || access.isPending}
                  onClick={() => setConfirming(p.name)}
                >
                  Remover
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
      {!reliable ? (
        <p className="text-sm text-muted-foreground">{UNPAIRED_REASON}</p>
      ) : null}
      {picking ? (
        <PermissionPickerDialog
          open
          onOpenChange={setPicking}
          selectedIds={permissionIds}
          isSaving={access.isPending}
          onConfirm={async ({ scope, selected }) => {
            const next = mergeScopedSelection(
              permissionIds,
              scope.map((p) => p.id),
              selected.map((p) => p.id),
            );
            if (await save(next, "Permissões atualizadas")) setPicking(false);
          }}
        />
      ) : null}
    </section>
  );
}
