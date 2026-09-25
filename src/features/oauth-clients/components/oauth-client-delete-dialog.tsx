"use client";

import { useIGRPToast } from "@igrp/igrp-framework-react-design-system";
import type { OAuthClientDTO } from "@igrp/platform-access-management-client-ts";

import { IGRPDialogDelete } from "@/components/dialog-delete";

import { useDeleteOAuthClient } from "../use-oauth-clients";

export function OAuthClientDeleteDialog({
  client,
  open,
  onOpenChange,
  onDeleted,
}: {
  client: OAuthClientDTO;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted?: () => void;
}) {
  const { igrpToast } = useIGRPToast();
  const mutation = useDeleteOAuthClient();

  async function confirmDelete() {
    const result = await mutation.mutateAsync(client.id);
    if (!result.success) {
      // 409: a service account was linked after this page loaded. The hook
      // refreshes the list, so the page's own delete block takes over.
      const linked = result.status === 409;
      igrpToast({
        type: "error",
        title: "Não foi possível eliminar",
        description: linked
          ? "Este cliente tem uma conta de serviço associada. Elimine primeiro a conta de serviço."
          : result.error,
      });
      if (linked) onOpenChange(false);
      return;
    }
    igrpToast({
      type: "success",
      title: "Cliente eliminado",
      description: client.clientId,
    });
    onOpenChange(false);
    onDeleted?.();
  }

  return (
    <IGRPDialogDelete
      open={open}
      onOpenChange={onOpenChange}
      toDelete={{ name: client.clientId }}
      confirmDelete={confirmDelete}
      isDeleting={mutation.isPending}
      description="O registo é removido e as credenciais deixam de funcionar de imediato. Não é possível recuperá-lo."
      label="Client ID"
      textHeader="Eliminar cliente OAuth"
    />
  );
}
