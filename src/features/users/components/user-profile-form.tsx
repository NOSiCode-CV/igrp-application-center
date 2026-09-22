"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  IGRPIcon,
  Input,
  useIGRPToast,
} from "@igrp/igrp-framework-react-design-system";
import type { IGRPUserDTO } from "@igrp/platform-access-management-client-ts";
import { useForm } from "react-hook-form";
import type * as z from "zod";

import { updateUser } from "@/actions/user";
import { BackButton } from "@/components/back-button";
import { AppCenterLoading } from "@/components/loading";
import { AppCenterNotFound } from "@/components/not-found";
import { ROUTES } from "@/lib/constants";

import { useCurrentUser } from "../use-users";
import { type UpdateUserArgs, UpdateUserSchema } from "../user-schemas";
import { ProfileImageUpload } from "./user-profile-image-upload";
import { ProfileSignature } from "./user-profile-signature";

export function ProfileUserForm() {
  const router = useRouter();
  const { igrpToast } = useIGRPToast();

  const { data: user, isLoading } = useCurrentUser();

  const form = useForm<z.infer<typeof UpdateUserSchema>>({
    resolver: zodResolver(UpdateUserSchema),
  });

  useEffect(() => {
    if (user) {
      const defaultValues: UpdateUserArgs = {
        email: user.email ?? "",
        name: user.name ?? "",
      };

      form.reset(defaultValues);
    }
  }, [user, form]);

  if (isLoading) {
    return <AppCenterLoading description="A carregar perfil..." />;
  }

  if (!user) {
    return (
      <AppCenterNotFound iconName="User" title="Utilizador não encontrado." />
    );
  }

  async function onSubmit(values: z.infer<typeof UpdateUserSchema>) {
    const formData = new FormData();
    formData.append("name", values.name || "");
    formData.append("email", values.email || "");
    if (user) {
      formData.append("status", user.status);
    }

    if (values.picture) {
      formData.append("picture", values.picture);
    }

    if (values.signature) {
      formData.append("signature", values.signature);
    }

    // updateUser action expects IGRPUserDTO but the runtime endpoint accepts
    // FormData (multipart/form-data) for picture/signature uploads. The action
    // signature is shared with the JSON code path; this double-cast documents
    // that the type mismatch is intentional and runtime-safe.
    user && (await updateUser(user.id, formData as unknown as IGRPUserDTO));

    igrpToast({
      type: "success",
      title: "Utilizador atualizado",
      description: "Os dados do utilizador foram atualizados.",
      duration: 2000,
    });

    router.push(ROUTES.USER_PROFILE);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <BackButton />
          <h3 className="text-2xl font-bold tracking-tight">
            Editar perfil do utilizador
          </h3>
        </div>
      </div>

      <Card>
        <CardHeader className="mb-3">
          <CardTitle>Dados do utilizador</CardTitle>
          <CardDescription>
            Altere os dados pessoais e as definições da conta.
          </CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="flex flex-col gap-8">
              <div className="grid sm:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome completo</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Nome completo do utilizador"
                          {...field}
                          value={field.value ?? ""}
                        />
                      </FormControl>
                      <FormDescription>
                        Nome que identifica o utilizador na plataforma.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="picture"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fotografia</FormLabel>
                      <FormControl>
                        <ProfileImageUpload
                          value={field.value}
                          onChange={field.onChange}
                        />
                      </FormControl>
                      <FormDescription>
                        Carregue uma fotografia para este utilizador.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="signature"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Assinatura</FormLabel>
                      <FormControl>
                        <ProfileSignature
                          value={field.value}
                          onChange={field.onChange}
                        />
                      </FormControl>
                      <FormDescription>
                        Assinatura digital do utilizador.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
            <CardHeader className="flex justify-end gap-2 pt-6">
              <Button
                variant="outline"
                onClick={() => router.back()}
                disabled={isLoading}
                type="button"
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <span>
                    <IGRPIcon
                      iconName="LoaderCircle"
                      className="size-4 animate-spin mr-2"
                    />
                    A processar...
                  </span>
                ) : (
                  "Guardar Alterações"
                )}
              </Button>
            </CardHeader>
          </form>
        </Form>
      </Card>
    </div>
  );
}
