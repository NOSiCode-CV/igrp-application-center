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
import { ScrollArea } from "@igrp/igrp-framework-react-design-system/dist/components/primitives/scroll-area";
import { IGRPApplicationArgs } from "@igrp/framework-next-types";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";

import {
  CreateApplicationSchema,
  type CreateApplicationArgs,
  appTypeCrud,
  normalizeApplication,
} from "@/features/applications/app-schemas";
import { 
  useCreateApplication, 
  useUpdateApplication 
} from "@/features/applications/use-applications";
import { useUsers } from "@/features/users/use-users";
import { ROUTES, STATUS_OPTIONS } from "@/lib/constants";
import { APPLICATIONS_TYPES_FILTERED } from "@/features/applications/app-utils";

interface ApplicationFormProps {
  application?: IGRPApplicationArgs;
  onSuccess: () => void;
}

export function ApplicationForm({ application, onSuccess }: ApplicationFormProps) {
  const router = useRouter();
  const { igrpToast } = useIGRPToast();
  const { data: users } = useUsers();
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
        await updateApplication({
          code: application.code,
          data: payload,
        });

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
        description: error instanceof Error ? error.message : "Erro desconhecido",
      });
    }
  };

  return (
    <IGRPFormPrimitive {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <ScrollArea className="h-[calc(80vh-120px)] w-full pr-4">
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
                    <IGRPInputPrimitive {...field} required />
                  </IGRPFormControlPrimitive>
                  <IGRPFormMessagePrimitive />
                </IGRPFormItemPrimitive>
              )}
            />

            <IGRPFormFieldPrimitive
              control={form.control}
              name="code"
              render={({ field }) => (
                <IGRPFormItemPrimitive>
                  <IGRPFormLabelPrimitive className='after:content-["*"] after:text-destructive'>
                    Código
                  </IGRPFormLabelPrimitive>
                  <IGRPFormControlPrimitive>
                    <IGRPInputPrimitive
                      {...field}
                      className={isEdit ? "bg-muted uppercase" : "uppercase"}
                      required
                      disabled={isEdit}
                      onChange={(e) => {
                        if (!isEdit) {
                          const v = e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, "");
                          field.onChange(v);
                        }
                      }}
                    />
                  </IGRPFormControlPrimitive>
                  <IGRPFormMessagePrimitive />
                </IGRPFormItemPrimitive>
              )}
            />

            <IGRPFormFieldPrimitive
              control={form.control}
              name="owner"
              render={({ field }) => (
                <IGRPFormItemPrimitive>
                  <IGRPFormLabelPrimitive>Proprietário</IGRPFormLabelPrimitive>
                  <IGRPSelectPrimitive onValueChange={field.onChange} value={field.value}>
                    <IGRPFormControlPrimitive className="w-full">
                      <IGRPSelectTriggerPrimitive>
                        <IGRPSelectValuePrimitive placeholder="Selecione" />
                      </IGRPSelectTriggerPrimitive>
                    </IGRPFormControlPrimitive>
                    <IGRPSelectContentPrimitive>
                      {users?.map((user) => (
                        <IGRPSelectItemPrimitive key={user.name} value={user.name}>
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
                        form.setValue("url", "");
                      } else {
                        form.setValue("slug", "");
                      }
                    }}
                    value={field.value}
                  >
                    <IGRPFormControlPrimitive className="w-full">
                      <IGRPSelectTriggerPrimitive>
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
              name="description"
              render={({ field }) => (
                <IGRPFormItemPrimitive>
                  <IGRPFormLabelPrimitive>Descrição</IGRPFormLabelPrimitive>
                  <IGRPFormControlPrimitive>
                    <IGRPTextAreaPrimitive {...field} value={field.value || ""} rows={3} />
                  </IGRPFormControlPrimitive>
                  <IGRPFormMessagePrimitive />
                </IGRPFormItemPrimitive>
              )}
            />

            <IGRPFormFieldPrimitive
              control={form.control}
              name="status"
              render={({ field }) => (
                <IGRPFormItemPrimitive>
                  <IGRPFormLabelPrimitive>Estado</IGRPFormLabelPrimitive>
                  <IGRPSelectPrimitive onValueChange={field.onChange} value={field.value}>
                    <IGRPFormControlPrimitive>
                      <IGRPSelectTriggerPrimitive className="w-full">
                        <IGRPSelectValuePrimitive placeholder="Selecionar estado" />
                      </IGRPSelectTriggerPrimitive>
                    </IGRPFormControlPrimitive>
                    <IGRPSelectContentPrimitive>
                      {STATUS_OPTIONS.map((status) => (
                        <IGRPSelectItemPrimitive key={status.value} value={status.value}>
                          {status.label}
                        </IGRPSelectItemPrimitive>
                      ))}
                    </IGRPSelectContentPrimitive>
                  </IGRPSelectPrimitive>
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