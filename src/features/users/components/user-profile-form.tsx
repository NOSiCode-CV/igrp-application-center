"use client";

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
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import type * as z from "zod";
import { updateUser } from "@/actions/user";
import { BackButton } from "@/components/back-button";
import { AppCenterLoading } from "@/components/loading";
import { AppCenterNotFound } from "@/components/not-found";
import { ROUTES } from "@/lib/constants";
import { useCurrentUser } from "../use-users";
import { type UpdateUserArgs, UpdateUserSchema } from "../user-schema";
import { ProfileImageUpload } from "./user-profile-image-upload";
import { ProfileSignature } from "./user-profile-signature";

export function ProfileUserForm() {
  const router = useRouter();
  const { igrpToast } = useIGRPToast();

  const { data: user, isLoading, error } = useCurrentUser();

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
    return <AppCenterLoading descrption="Carregando profile..." />;
  }

  if (!user) {
    return (
      <AppCenterNotFound
        iconName="User"
        title="Nenhum utilizador encontrada."
      />
    );
  }

  async function onSubmit(values: z.infer<typeof UpdateUserSchema>) {
    const formData = new FormData();
    formData.append("fullname", values.name || "");
    formData.append("email", values.email || "");

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
      title: "Usuario Atualizado",
      description: "O Usuario foi atualizado com sucesso!",
      duration: 2000,
    });

    router.push(ROUTES.USER_PROFILE);
    router.refresh();
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <BackButton />
          <h3 className="text-2xl font-bold tracking-tight">
            Edit User Profile
          </h3>
        </div>
      </div>

      <Card>
        <CardHeader className="mb-3">
          <CardTitle>Detailed information about this user.</CardTitle>
          <CardDescription>
            Manage your personal information and account settings.
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
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="johndoe"
                          {...field}
                          value={field.value ?? ""}
                        />
                      </FormControl>
                      <FormDescription>The user full name.</FormDescription>
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
                      <FormLabel>Profile Image</FormLabel>
                      <FormControl>
                        <ProfileImageUpload
                          value={field.value}
                          onChange={field.onChange}
                        />
                      </FormControl>
                      <FormDescription>
                        Upload a profile picture for this user.
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
                      <FormLabel>Signature</FormLabel>
                      <FormControl>
                        <ProfileSignature
                          value={field.value}
                          onChange={field.onChange}
                        />
                      </FormControl>
                      <FormDescription>
                        The user&apos;s digital signature.
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
                      className="w-4 h-4 animate-spin mr-2"
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
