"use client";

import { useId, useState } from "react";

import {
  Checkbox,
  Label,
  useIGRPToast,
} from "@igrp/igrp-framework-react-design-system";
import type { ServiceAccountDTO } from "@igrp/platform-access-management-client-ts";

import { IGRPDialogDelete } from "@/components/dialog-delete";

import { useDeleteServiceAccount } from "../use-service-accounts";

export function ServiceAccountDeleteDialog({
  account,
  open,
  onOpenChange,
  onDeleted,
}: {
  account: ServiceAccountDTO;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted?: () => void;
}) {
  const id = useId();
  const { igrpToast } = useIGRPToast();
  const mutation = useDeleteServiceAccount(account.id);
  // Checked by default: an orphaned client is a live, untracked credential (spec §5.6).
  const [alsoDeleteClient, setAlsoDeleteClient] = useState(true);

  async function confirmDelete() {
    const result = await mutation.mutateAsync({
      id: account.id,
      alsoDeleteClient,
    });
    if (result.success) {
      igrpToast({
        type: "success",
        title: alsoDeleteClient
          ? "Conta e cliente eliminados"
          : "Conta eliminada",
        description: alsoDeleteClient
          ? `${account.name} · ${account.clientId}`
          : account.name,
      });
      onOpenChange(false);
      onDeleted?.();
      return;
    }
    if (result.failedStep === "client") {
      igrpToast({
        type: "error",
        title: "A conta foi eliminada, o cliente não",
        description: `Elimine o cliente OAuth ${account.clientId} na página Clientes OAuth. ${result.error}`,
      });
      onOpenChange(false);
      onDeleted?.();
      return;
    }
    igrpToast({
      type: "error",
      title: "Não foi possível eliminar",
      description: result.error,
    });
  }

  return (
    <IGRPDialogDelete
      open={open}
      onOpenChange={onOpenChange}
      toDelete={{ name: account.name }}
      confirmDelete={confirmDelete}
      isDeleting={mutation.isPending}
      description="A conta deixa de existir, com os perfis e permissões que tinha. Não é possível recuperá-la."
      label="Nome da conta"
      textHeader="Eliminar conta de serviço"
      labelBtnDelete={
        alsoDeleteClient ? "Eliminar conta e cliente" : "Eliminar conta"
      }
    >
      <Label
        htmlFor={`${id}-also`}
        className="flex cursor-pointer items-start gap-3 rounded-lg border border-border p-3 font-normal"
      >
        <Checkbox
          id={`${id}-also`}
          checked={alsoDeleteClient}
          onCheckedChange={(c) => setAlsoDeleteClient(c === true)}
        />
        <span className="flex flex-col gap-0.5">
          <span>
            Eliminar também o cliente OAuth{" "}
            <span className="font-mono">{account.clientId}</span>
          </span>
          <span className="text-sm text-muted-foreground">
            Sem a conta, o cliente continua a conseguir autenticar.
          </span>
        </span>
      </Label>
    </IGRPDialogDelete>
  );
}
