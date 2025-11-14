"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  IGRPButton,
  IGRPFormControlPrimitive,
  IGRPFormFieldPrimitive,
  IGRPFormItemPrimitive,
  IGRPFormLabelPrimitive,
  IGRPFormMessagePrimitive,
  IGRPFormPrimitive,
  IGRPInputPrimitive,
  IGRPSelectContentPrimitive,
  IGRPSelectItemPrimitive,
  IGRPSelectPrimitive,
  IGRPSelectTriggerPrimitive,
  IGRPSelectValuePrimitive,
  IGRPTextAreaPrimitive,
  useIGRPToast,
} from "@igrp/igrp-framework-react-design-system";
import { useForm } from "react-hook-form";

import {
  UpdateApplicationSchema,
  type UpdateApplicationArgs,
  normalizeApplication,
} from "@/features/applications/app-schemas";
import { useUpdateApplication } from "@/features/applications/use-applications";
import { useUsers } from "@/features/users/use-users";
import { STATUS_OPTIONS } from "@/lib/constants";
import { APPLICATIONS_TYPES_FILTERED } from "@/features/applications/app-utils";
import { IGRPApplicationArgs } from "@igrp/framework-next-types";
import { ScrollArea } from "@igrp/igrp-framework-react-design-system/dist/components/primitives/scroll-area";

export function ApplicationEditForm({
  application,
  onSuccess,
}: {
  application: IGRPApplicationArgs;
  onSuccess: () => void;
}) {
  const { igrpToast } = useIGRPToast();
  const { data: users } = useUsers();
  const { mutateAsync: updateApplication } = useUpdateApplication();

  const form = useForm<UpdateApplicationArgs>({
    resolver: zodResolver(UpdateApplicationSchema),
    defaultValues: {
      name: application.name,
      owner: application.owner,
      type: application.type as "INTERNAL" | "EXTERNAL",
      slug: application.slug || undefined,
      url: application.url || undefined,
      description: application.description || undefined,
      status: application.status,
    },
  });

  const type = form.watch("type");

  const onSubmit = async (values: UpdateApplicationArgs) => {
    try {
      const cleanedValues = {
        ...values,
        code: application.code,
        status: values.status || undefined,
        slug: values.slug || undefined,
        url: values.url || undefined,
        description: values.description || undefined,
      };

      const payload = normalizeApplication(cleanedValues, true);

      await updateApplication({
        code: application.code,
        data: payload,
      });

      igrpToast({
        type: "success",
        title: "Aplicação atualizada",
        description: "A aplicação foi atualizada com sucesso!",
      });

      onSuccess();
    } catch (error) {
      igrpToast({
        type: "error",
        title: "Erro ao atualizar",
        description:
          error instanceof Error ? error.message : "Erro desconhecido",
      });
    }
  };

  return (
    <IGRPFormPrimitive {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <ScrollArea className="h-[calc(90vh-120px)] w-full pr-4 space-y-4">
          <div className="space-y-4">
        <IGRPFormFieldPrimitive
          control={form.control}
          name="name"
          render={({ field }) => (
            <IGRPFormItemPrimitive>
              <IGRPFormLabelPrimitive className='after:content-["*"] after:text-destructive'>
                Nome
              </IGRPFormLabelPrimitive>
              <IGRPFormControlPrimitive>
                <IGRPInputPrimitive required {...field} />
              </IGRPFormControlPrimitive>
              <IGRPFormMessagePrimitive />
            </IGRPFormItemPrimitive>
          )}
        />

        <div>
          <IGRPFormLabelPrimitive className='mb-2 after:content-["*"] after:text-destructive'>
            Código
          </IGRPFormLabelPrimitive>
          <IGRPInputPrimitive
            value={application.code}
            disabled
            className="bg-muted"
          />
        </div>

        <IGRPFormFieldPrimitive
          control={form.control}
          name="owner"
          render={({ field }) => (
            <IGRPFormItemPrimitive className="w-full">
              <IGRPFormLabelPrimitive>Proprietário</IGRPFormLabelPrimitive>
              <IGRPSelectPrimitive
                onValueChange={field.onChange}
                value={field.value}
              >
                <IGRPFormControlPrimitive className="w-full">
                  <IGRPSelectTriggerPrimitive className="w-full">
                    <IGRPSelectValuePrimitive />
                  </IGRPSelectTriggerPrimitive>
                </IGRPFormControlPrimitive>
                <IGRPSelectContentPrimitive>
                  {users?.map((user) => (
                    <IGRPSelectItemPrimitive
                      key={user.name}
                      value={user.name}
                    >
                      {user.name}
                    </IGRPSelectItemPrimitive>
                  ))}
                </IGRPSelectContentPrimitive>
              </IGRPSelectPrimitive>
              <IGRPFormMessagePrimitive />
            </IGRPFormItemPrimitive>
          )}
        />

        <IGRPFormFieldPrimitive
          control={form.control}
          name="type"
          render={({ field }) => (
            <IGRPFormItemPrimitive>
              <IGRPFormLabelPrimitive>Tipo</IGRPFormLabelPrimitive>
              <IGRPSelectPrimitive
                onValueChange={(value) => {
                  field.onChange(value);
                  if (value === "INTERNAL") {
                    form.setValue("url", undefined);
                  } else {
                    form.setValue("slug", undefined);
                  }
                }}
                value={field.value}
              >
                <IGRPFormControlPrimitive className="w-full">
                  <IGRPSelectTriggerPrimitive className="w-full">
                    <IGRPSelectValuePrimitive />
                  </IGRPSelectTriggerPrimitive>
                </IGRPFormControlPrimitive>
                <IGRPSelectContentPrimitive>
                  {APPLICATIONS_TYPES_FILTERED.map((opt) => (
                    <IGRPSelectItemPrimitive key={opt.value} value={opt.value}>
                      {opt.label}
                    </IGRPSelectItemPrimitive>
                  ))}
                </IGRPSelectContentPrimitive>
              </IGRPSelectPrimitive>
              <IGRPFormMessagePrimitive />
            </IGRPFormItemPrimitive>
          )}
        />

        {type === "INTERNAL" && (
          <IGRPFormFieldPrimitive
            control={form.control}
            name="slug"
            render={({ field }) => (
              <IGRPFormItemPrimitive>
                <IGRPFormLabelPrimitive>Slug</IGRPFormLabelPrimitive>
                <IGRPFormControlPrimitive>
                  <IGRPInputPrimitive {...field} value={field.value || ""} />
                </IGRPFormControlPrimitive>
                <IGRPFormMessagePrimitive />
              </IGRPFormItemPrimitive>
            )}
          />
        )}

        {type === "EXTERNAL" && (
          <IGRPFormFieldPrimitive
            control={form.control}
            name="url"
            render={({ field }) => (
              <IGRPFormItemPrimitive>
                <IGRPFormLabelPrimitive>URL</IGRPFormLabelPrimitive>
                <IGRPFormControlPrimitive>
                  <IGRPInputPrimitive {...field} value={field.value || ""} />
                </IGRPFormControlPrimitive>
                <IGRPFormMessagePrimitive />
              </IGRPFormItemPrimitive>
            )}
          />
        )}

        <IGRPFormFieldPrimitive
          control={form.control}
          name="status"
          render={({ field }) => (
            <IGRPFormItemPrimitive>
              <IGRPFormLabelPrimitive>Estado</IGRPFormLabelPrimitive>
              <IGRPSelectPrimitive
                onValueChange={field.onChange}
                value={field.value}
              >
                <IGRPFormControlPrimitive className="w-full">
                  <IGRPSelectTriggerPrimitive>
                    <IGRPSelectValuePrimitive />
                  </IGRPSelectTriggerPrimitive>
                </IGRPFormControlPrimitive>
                <IGRPSelectContentPrimitive className="w-full">
                  {STATUS_OPTIONS.map((opt) => (
                    <IGRPSelectItemPrimitive key={opt.value} value={opt.value}>
                      {opt.label}
                    </IGRPSelectItemPrimitive>
                  ))}
                </IGRPSelectContentPrimitive>
              </IGRPSelectPrimitive>
              <IGRPFormMessagePrimitive />
            </IGRPFormItemPrimitive>
          )}
        />

        <IGRPFormFieldPrimitive
          control={form.control}
          name="description"
          render={({ field }) => (
            <IGRPFormItemPrimitive>
              <IGRPFormLabelPrimitive>Descrição</IGRPFormLabelPrimitive>
              <IGRPFormControlPrimitive>
                <IGRPTextAreaPrimitive
                  {...field}
                  value={field.value || ""}
                  rows={3}
                />
              </IGRPFormControlPrimitive>
              <IGRPFormMessagePrimitive />
            </IGRPFormItemPrimitive>
          )}
        />
        </div>
        </ScrollArea>
        

        <div className="flex justify-end gap-2 pt-4">
          <IGRPButton type="button" showIcon iconName="X" variant="outline" onClick={onSuccess}>
            Cancelar
          </IGRPButton>
          <IGRPButton type="submit" showIcon iconName="Save" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "Guardando..." : "Guardar"}
          </IGRPButton>
        </div>
      </form>
    </IGRPFormPrimitive>
  );
}
