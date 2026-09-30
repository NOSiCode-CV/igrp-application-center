"use client";

import { useRouter } from "next/navigation";
import { useMemo } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  IGRPButton,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  useIGRPToast,
} from "@igrp/igrp-framework-react-design-system";
import type { ApplicationDTO } from "@igrp/platform-access-management-client-ts";
import { type Resolver, useForm } from "react-hook-form";

import { LimitedTextareaField } from "@/components/limited-textarea-field";
import {
  type ApplicationFormValues,
  appTypeCrud,
  type CreateApplicationFormValues,
  CreateApplicationSchema,
  normalizeCreateApplication,
  normalizeUpdateApplication,
  type UpdateApplicationFormValues,
  UpdateApplicationSchema,
} from "@/features/applications/app-schemas";
import {
  useCreateApplication,
  useUpdateApplication,
} from "@/features/applications/use-applications";
import { ROUTES, STATUS_OPTIONS } from "@/lib/constants";

const APPLICATION_TYPE_OPTIONS = [
  { value: appTypeCrud.enum.INTERNAL, label: "Interno" },
  { value: appTypeCrud.enum.EXTERNAL, label: "Externo" },
] as const;

interface ApplicationFormProps {
  application?: ApplicationDTO;
  onSuccess: () => void;
}

export function ApplicationForm({
  application,
  onSuccess,
}: ApplicationFormProps) {
  const router = useRouter();
  const { igrpToast } = useIGRPToast();
  const { mutateAsync: createApplication } = useCreateApplication();
  const { mutateAsync: updateApplication } = useUpdateApplication();

  const isEdit = !!application;

  const defaultValues = useMemo<ApplicationFormValues>(
    () =>
      application
        ? {
            name: application.name,
            code: application.code,
            owner: application.owner ?? "",
            type: application.type as "INTERNAL" | "EXTERNAL",
            slug: application.slug || "",
            url: application.url || "",
            description: application.description || "",
            status: application.status,
            picture: application.picture || "",
          }
        : {
            name: "",
            code: "",
            owner: "",
            type: appTypeCrud.enum.INTERNAL,
            slug: "",
            url: "",
            description: "",
            status: "ACTIVE",
            picture: "",
          },
    [application],
  );

  const form = useForm<ApplicationFormValues>({
    resolver: zodResolver(
      isEdit ? UpdateApplicationSchema : CreateApplicationSchema,
    ) as Resolver<ApplicationFormValues>,
    defaultValues,
    mode: "onBlur",
    reValidateMode: "onChange",
  });

  const type = form.watch("type");
  const status = form.watch("status");

  // STATUS_OPTIONS is the shared Ativo/Inativo pair. An application already in
  // TEMPORARY would otherwise render an empty trigger with no way back.
  const statusOptions = useMemo(
    () =>
      status === "TEMPORARY"
        ? [...STATUS_OPTIONS, { value: "TEMPORARY", label: "Temporário" }]
        : STATUS_OPTIONS,
    [status],
  );

  const onSubmit = async (values: ApplicationFormValues) => {
    try {
      if (isEdit) {
        const payload = normalizeUpdateApplication(
          values as UpdateApplicationFormValues,
        );
        const created = await updateApplication({
          code: application.code,
          data: payload,
        });

        if (!created.success) {
          throw new Error(created.error);
        }

        igrpToast({
          type: "success",
          title: "Aplicação atualizada",
          description: "A aplicação foi atualizada com sucesso!",
        });
      } else {
        const payload = normalizeCreateApplication(
          values as CreateApplicationFormValues,
        );
        await createApplication(payload);

        igrpToast({
          type: "success",
          title: "Aplicação criada",
          description: "A aplicação foi criada com sucesso!",
        });

        onSuccess();
        router.push(`${ROUTES.APPLICATIONS}/${values.code}`);
        return;
      }

      onSuccess();
    } catch (error) {
      igrpToast({
        type: "error",
        title: isEdit ? "Erro ao atualizar" : "Erro ao criar",
        description:
          error instanceof Error ? error.message : "Erro desconhecido",
      });
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col gap-4"
      >
        <div className="flex flex-col gap-4 max-h-[75vh] overflow-y-auto px-1 pb-2">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Nome
                  <span aria-hidden="true" className="text-destructive">
                    *
                  </span>
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="Nome da aplicação…"
                    autoComplete="off"
                    maxLength={255}
                    aria-required="true"
                    className="placeholder:truncate border-primary/30 focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:border-primary/30"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Código
                    <span aria-hidden="true" className="text-destructive">
                      *
                    </span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="EX: APP_CENTER"
                      autoComplete="off"
                      spellCheck={false}
                      maxLength={255}
                      aria-required="true"
                      className={`uppercase placeholder:truncate placeholder:normal-case border-primary/30 focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:border-primary/30 ${
                        isEdit ? "bg-muted" : ""
                      }`}
                      disabled={isEdit}
                      onChange={(e) => {
                        if (!isEdit) {
                          const v = e.target.value
                            .toUpperCase()
                            .replace(/[^A-Z0-9_-]/g, "");
                          field.onChange(v);
                        }
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value);
                      if (value === "INTERNAL") {
                        form.setValue("url", "");
                      } else {
                        form.setValue("slug", "");
                      }
                    }}
                    value={field.value}
                  >
                    <FormControl className="w-full">
                      <SelectTrigger className="border-primary/30 focus:ring-2 focus:ring-primary/30">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {APPLICATION_TYPE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {type === "INTERNAL" && (
            <FormField
              control={form.control}
              name="slug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Slug{" "}
                    <span aria-hidden="true" className="text-destructive">
                      *
                    </span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value || ""}
                      maxLength={255}
                      aria-required="true"
                      placeholder="/apps/exemplo"
                      className="placeholder:truncate border-primary/30 focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:border-primary/30"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {type === "EXTERNAL" && (
            <FormField
              control={form.control}
              name="url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    URL{" "}
                    <span aria-hidden="true" className="text-destructive">
                      *
                    </span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="url"
                      inputMode="url"
                      autoComplete="off"
                      aria-required="true"
                      value={field.value || ""}
                      placeholder="https://exemplo.com"
                      className="placeholder:truncate border-primary/30 focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:border-primary/30"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <LimitedTextareaField
            id="description"
            label="Descrição"
            maxLength={255}
            rows={3}
            placeholder="Breve descrição da aplicação…"
            className="resize-none"
          />

          {isEdit && (
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Estado</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-full border-primary/30 focus:ring-2 focus:ring-primary/30">
                        <SelectValue placeholder="Selecionar estado" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {statusOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>

        <div className="flex justify-end gap-2">
          <IGRPButton
            type="button"
            showIcon
            iconName="X"
            variant="outline"
            onClick={onSuccess}
          >
            Cancelar
          </IGRPButton>
          <IGRPButton
            type="submit"
            showIcon
            iconName="Save"
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting
              ? "A guardar..."
              : isEdit
                ? "Atualizar Aplicação"
                : "Criar Aplicação"}
          </IGRPButton>
        </div>
      </form>
    </Form>
  );
}
