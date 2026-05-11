"use client";

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
  ScrollArea,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
  useIGRPToast,
} from "@igrp/igrp-framework-react-design-system";
import type { ApplicationDTO } from "@igrp/platform-access-management-client-ts";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import {
  appTypeCrud,
  type CreateApplicationArgs,
  CreateApplicationSchema,
  normalizeApplication,
} from "@/features/applications/app-schemas";
import { APPLICATIONS_TYPES_FILTERED } from "@/features/applications/app-utils";
import {
  useCreateApplication,
  useUpdateApplication,
} from "@/features/applications/use-applications";
import { ROUTES, STATUS_OPTIONS } from "@/lib/constants";

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

  const form = useForm<CreateApplicationArgs>({
    resolver: zodResolver(CreateApplicationSchema),
    defaultValues: isEdit
      ? {
          name: application.name,
          code: application.code,
          owner: application.owner,
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
  });

  const type = form.watch("type");

  const onSubmit = async (values: CreateApplicationArgs) => {
    try {
      if (isEdit) {
        const payload = normalizeApplication(values, true);
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
        const payload = normalizeApplication(values, false);
        await createApplication(payload);

        igrpToast({
          type: "success",
          title: "Aplicação criada",
          description: "A aplicação foi criada com sucesso!",
        });

        router.push(`${ROUTES.APPLICATIONS}/${values.code}`);
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
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <ScrollArea className="max-h-[calc(100vh-10rem)] h-[calc(100vh-10rem) w-full scroll-auto">
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className='after:content-["*"] after:text-destructive'>
                    Nome
                  </FormLabel>
                  <FormControl>
                    <Input {...field} required />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className='after:content-["*"] after:text-destructive'>
                    Código
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      className={isEdit ? "bg-muted uppercase" : "uppercase"}
                      required
                      disabled={isEdit}
                      onChange={(e) => {
                        if (!isEdit) {
                          const v = e.target.value
                            .toUpperCase()
                            .replace(/[^A-Z0-9_]/g, "");
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
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {APPLICATIONS_TYPES_FILTERED.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {type === "INTERNAL" && (
              <FormField
                control={form.control}
                name="slug"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Slug</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ""} />
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
                    <FormLabel>URL</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea {...field} value={field.value || ""} rows={3} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Estado</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selecionar estado" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {STATUS_OPTIONS.map((status) => (
                        <SelectItem key={status.value} value={status.value}>
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </ScrollArea>

        <div className="flex justify-end gap-2 pt-4 border-t">
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
              ? "Guardando..."
              : isEdit
                ? "Atualizar Aplicação"
                : "Criar Aplicação"}
          </IGRPButton>
        </div>
      </form>
    </Form>
  );
}
