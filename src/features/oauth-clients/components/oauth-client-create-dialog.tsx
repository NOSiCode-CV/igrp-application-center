"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
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
  Form,
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
import { type Resolver, useForm } from "react-hook-form";

import { SensitiveValueDisclosure } from "@/components/sensitive-value-disclosure";
import { ROUTES } from "@/lib/constants";

import {
  emptyOAuthClientFormValues,
  type OAuthClientFormValues,
  oauthClientFormSchema,
  toCreateRequest,
} from "../oauth-client-schemas";
import { useCreateOAuthClient } from "../use-oauth-clients";
import { OAuthClientFormSections } from "./oauth-client-form-sections";

export function OAuthClientCreateDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const { igrpToast } = useIGRPToast();
  const create = useCreateOAuthClient();
  const [created, setCreated] = useState<OAuthClientDTO | null>(null);
  const { reset: resetCreate } = create;
  useEffect(() => () => resetCreate(), [resetCreate]);
  const submitting = create.isPending;
  const [confirmed, setConfirmed] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);

  const form = useForm<OAuthClientFormValues>({
    resolver: zodResolver(
      oauthClientFormSchema,
    ) as Resolver<OAuthClientFormValues>,
    defaultValues: emptyOAuthClientFormValues(),
    mode: "onBlur",
  });

  async function onSubmit(values: OAuthClientFormValues) {
    const result = await create.mutateAsync(toCreateRequest(values));
    if (result.success) {
      setCreated(result.data);
      return;
    }
    if (result.status === 409) {
      form.setError(
        "clientId",
        { message: "Já existe um cliente com este client ID." },
        { shouldFocus: true },
      );
      return;
    }
    igrpToast({
      type: "error",
      title: "Não foi possível registar o cliente",
      description: result.error,
    });
  }

  function requestClose(next: boolean) {
    if (next) return;
    if (submitting) return;
    if (created?.clientSecret && !confirmed) {
      setConfirmClose(true);
      return;
    }
    onOpenChange(false);
  }

  return (
    <>
      <IGRPModalDialog open={open} onOpenChange={requestClose}>
        <IGRPModalDialogContent
          size="xl"
          className="max-md:h-dvh max-md:max-h-dvh max-md:max-w-none max-md:rounded-none max-md:border-0"
          onEscapeKeyDown={(e) => {
            if (submitting) e.preventDefault();
          }}
          onInteractOutside={(e) => {
            if (submitting) e.preventDefault();
          }}
        >
          {created ? (
            <>
              <IGRPModalDialogHeader>
                <IGRPModalDialogTitle>Cliente registado</IGRPModalDialogTitle>
                <IGRPModalDialogDescription>
                  O cliente{" "}
                  <span className="font-mono text-foreground">
                    {created.clientId}
                  </span>{" "}
                  {created.clientSecret
                    ? "já pode pedir tokens. Guarde as credenciais antes de fechar."
                    : "foi criado, mas sem credenciais utilizáveis."}
                </IGRPModalDialogDescription>
              </IGRPModalDialogHeader>
              {created.clientSecret ? (
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
                    value={created.clientSecret}
                    onConfirmedChange={setConfirmed}
                  />
                  <IGRPModalDialogFooter className="items-center gap-4 sm:justify-between">
                    <p className="text-sm text-muted-foreground">
                      Se o segredo for exposto, desative o cliente e registe um
                      novo.
                    </p>
                    <Button
                      type="button"
                      disabled={!confirmed}
                      onClick={() => {
                        onOpenChange(false);
                        router.push(`${ROUTES.OAUTH_CLIENTS}/${created.id}`);
                      }}
                    >
                      Concluir — ver detalhes
                    </Button>
                  </IGRPModalDialogFooter>
                </>
              ) : (
                <>
                  <Alert variant="destructive">
                    <IGRPIcon iconName="TriangleAlert" aria-hidden="true" />
                    <AlertDescription>
                      O servidor não devolveu o segredo. Desative este cliente e
                      registe um novo.
                    </AlertDescription>
                  </Alert>
                  <IGRPModalDialogFooter>
                    <Button type="button" onClick={() => onOpenChange(false)}>
                      Fechar
                    </Button>
                  </IGRPModalDialogFooter>
                </>
              )}
            </>
          ) : (
            [
              <IGRPModalDialogHeader key="header" stickyHeader>
                <IGRPModalDialogTitle>
                  Registar cliente OAuth2
                </IGRPModalDialogTitle>
                <IGRPModalDialogDescription>
                  O segredo é mostrado uma única vez, no fim do registo.
                </IGRPModalDialogDescription>
              </IGRPModalDialogHeader>,
              <Form key="form" {...form}>
                <form
                  id="oauth-client-create"
                  onSubmit={form.handleSubmit(onSubmit)}
                  noValidate
                >
                  <OAuthClientFormSections mode="create" />
                </form>
              </Form>,
              <IGRPModalDialogFooter key="footer" stickyFooter>
                <Button
                  type="button"
                  variant="outline"
                  disabled={submitting}
                  onClick={() => onOpenChange(false)}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  form="oauth-client-create"
                  disabled={submitting}
                >
                  {submitting ? "A registar…" : "Registar"}
                </Button>
              </IGRPModalDialogFooter>,
            ]
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
