"use client";

import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Form,
  IGRPIcon,
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
  // The raw secret lives ONLY here; unmounting the dialog drops it.
  const [created, setCreated] = useState<OAuthClientDTO | null>(null);
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
    if (created && !confirmed) {
      setConfirmClose(true);
      return;
    }
    onOpenChange(false);
  }

  return (
    <>
      <Dialog open={open} onOpenChange={requestClose}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
          {created?.clientSecret ? (
            <>
              <DialogHeader>
                <DialogTitle>Cliente registado</DialogTitle>
                <DialogDescription>
                  O cliente{" "}
                  <span className="font-mono text-foreground">
                    {created.clientId}
                  </span>{" "}
                  já pode pedir tokens. Guarde as credenciais antes de fechar.
                </DialogDescription>
              </DialogHeader>
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
              <DialogFooter className="items-center gap-4 sm:justify-between">
                <p className="text-sm text-muted-foreground">
                  Se o segredo for exposto, desative o cliente e registe um
                  novo.
                </p>
                <Button
                  type="button"
                  disabled={!confirmed}
                  onClick={() => {
                    onOpenChange(false);
                    router.push(
                      `${ROUTES.OAUTH_CLIENTS}/${created.id}` as Route,
                    );
                  }}
                >
                  Concluir — ver detalhes
                </Button>
              </DialogFooter>
            </>
          ) : (
            <Form {...form}>
              <form
                id="oauth-client-create"
                onSubmit={form.handleSubmit(onSubmit)}
                noValidate
              >
                <DialogHeader>
                  <DialogTitle>Registar cliente OAuth2</DialogTitle>
                  <DialogDescription>
                    O segredo é mostrado uma única vez, no fim do registo.
                  </DialogDescription>
                </DialogHeader>
                <OAuthClientFormSections mode="create" />
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={create.isPending}>
                    {create.isPending ? "A registar…" : "Registar"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          )}
        </DialogContent>
      </Dialog>

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
