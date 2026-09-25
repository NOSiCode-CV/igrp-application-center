"use client";

import { useEffect, useState } from "react";

import {
  Alert,
  AlertDescription,
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Button,
  IGRPIcon,
  IGRPModalDialog,
  IGRPModalDialogContent,
  IGRPModalDialogDescription,
  IGRPModalDialogFooter,
  IGRPModalDialogHeader,
  IGRPModalDialogTitle,
  useIGRPToast,
} from "@igrp/igrp-framework-react-design-system";
import type { OAuthClientDTO } from "@igrp/platform-access-management-client-ts";

import { ConfirmDialog } from "@/components/confirmation-modal";
import { SensitiveValueDisclosure } from "@/components/sensitive-value-disclosure";

import { useRotateOAuthClientSecret } from "../use-oauth-clients";

/**
 * Confirm, then show the new secret once (spec §6.3). The secret lives only in
 * this component's state; the mutation has `gcTime: 0` and never writes it to
 * the query cache.
 */
export function OAuthClientRotateSecretDialog({
  client,
  linkedAccountName,
  open,
  onOpenChange,
}: {
  client: OAuthClientDTO;
  linkedAccountName?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { igrpToast } = useIGRPToast();
  const rotate = useRotateOAuthClientSecret();
  const { reset: resetRotate } = rotate;
  useEffect(() => () => resetRotate(), [resetRotate]);
  const [secret, setSecret] = useState<string | null>(null);
  const [missingSecret, setMissingSecret] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);

  async function confirmRotate() {
    const result = await rotate.mutateAsync(client.id);
    if (!result.success) {
      igrpToast({
        type: "error",
        title: "Não foi possível gerar um novo segredo",
        description: result.error,
      });
      return;
    }
    if (result.data.clientSecret) setSecret(result.data.clientSecret);
    else setMissingSecret(true);
  }

  function requestClose(next: boolean) {
    if (next) return;
    if (secret && !confirmed) {
      setConfirmClose(true);
      return;
    }
    onOpenChange(false);
  }

  if (!secret && !missingSecret) {
    return (
      <ConfirmDialog
        open={open}
        onOpenChange={(o) => {
          if (!rotate.isPending) onOpenChange(o);
        }}
        title="Gerar novo segredo"
        description={
          <>
            O segredo atual deixa de funcionar de imediato
            {linkedAccountName
              ? `, também para a conta de serviço «${linkedAccountName}»`
              : ""}
            . Os tokens já emitidos continuam válidos até expirarem. O client ID
            não muda: só o segredo tem de ser distribuído de novo.
          </>
        }
        onConfirm={confirmRotate}
        isLoading={rotate.isPending}
        confirmText="Gerar novo segredo"
        loadingText="A gerar…"
        iconName="KeyRound"
        variant="destructive"
      />
    );
  }

  return (
    <>
      <IGRPModalDialog open={open} onOpenChange={requestClose}>
        <IGRPModalDialogContent onInteractOutside={(e) => e.preventDefault()}>
          <IGRPModalDialogHeader>
            <IGRPModalDialogTitle>Novo segredo gerado</IGRPModalDialogTitle>
            <IGRPModalDialogDescription>
              O segredo anterior de{" "}
              <span className="font-mono text-foreground">
                {client.clientId}
              </span>{" "}
              já não funciona.{" "}
              {secret
                ? "Atualize as aplicações que usam este cliente."
                : "O servidor não devolveu o novo segredo."}
            </IGRPModalDialogDescription>
          </IGRPModalDialogHeader>
          {secret ? (
            <>
              <div
                role="note"
                className="flex gap-3 rounded-lg bg-warning-subtle p-3.5 text-warning-subtle-foreground"
              >
                <IGRPIcon
                  iconName="TriangleAlert"
                  className="mt-0.5 size-4.5 shrink-0"
                  aria-hidden="true"
                />
                <div className="flex flex-col gap-0.5">
                  <strong className="font-semibold">
                    Este segredo não volta a ser mostrado.
                  </strong>
                  <span className="text-sm">
                    Nem a si, nem a outro administrador. Guarde-o já no seu
                    gestor de segredos.
                  </span>
                </div>
              </div>
              <SensitiveValueDisclosure
                label="Client secret"
                value={secret}
                onConfirmedChange={setConfirmed}
              />
              <IGRPModalDialogFooter>
                <Button
                  type="button"
                  disabled={!confirmed}
                  onClick={() => onOpenChange(false)}
                >
                  Concluir
                </Button>
              </IGRPModalDialogFooter>
            </>
          ) : (
            <>
              <Alert variant="destructive">
                <IGRPIcon iconName="TriangleAlert" aria-hidden="true" />
                <AlertDescription>
                  Gere outro segredo. Até lá, nenhuma aplicação consegue
                  autenticar com este cliente.
                </AlertDescription>
              </Alert>
              <IGRPModalDialogFooter>
                <Button type="button" onClick={() => onOpenChange(false)}>
                  Fechar
                </Button>
              </IGRPModalDialogFooter>
            </>
          )}
        </IGRPModalDialogContent>
      </IGRPModalDialog>

      <AlertDialog open={confirmClose} onOpenChange={setConfirmClose}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Fechar sem confirmar?</AlertDialogTitle>
            <AlertDialogDescription>
              Não poderá voltar a ver este segredo. Fechar mesmo assim?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction onClick={() => onOpenChange(false)}>
              Fechar mesmo assim
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
