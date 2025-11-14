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
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";

import {
  CreateApplicationSchema,
  type CreateApplicationArgs,
  appTypeCrud,
  normalizeApplication,
} from "@/features/applications/app-schemas";
import { useCreateApplication } from "@/features/applications/use-applications";
import { useUsers } from "@/features/users/use-users";
import { ROUTES, STATUS_OPTIONS } from "@/lib/constants";
import { APPLICATIONS_TYPES_FILTERED } from "@/features/applications/app-utils";
import { ScrollArea } from "@igrp/igrp-framework-react-design-system/dist/components/primitives/scroll-area";

export function ApplicationCreateForm({ onSuccess }: { onSuccess: () => void }) {
  const router = useRouter();
  const { igrpToast } = useIGRPToast();
  const { data: users } = useUsers();
  const { mutateAsync: createApplication } = useCreateApplication();

  const form = useForm<CreateApplicationArgs>({
    resolver: zodResolver(CreateApplicationSchema),
    defaultValues: {
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
      const payload = normalizeApplication(values, false);
      await createApplication(payload);

      igrpToast({
        type: "success",
        title: "Aplicação criada",
        description: "A aplicação foi criada com sucesso!",
      });

      onSuccess();
      router.push(`${ROUTES.APPLICATIONS}/${values.code}`);
    } catch (error) {
      igrpToast({
        type: "error",
        title: "Erro ao criar",
        description: error instanceof Error ? error.message : "Erro desconhecido",
      });
    }
  };

  return (
    <IGRPFormPrimitive {...form}>
      <form onSubmit={form.handleSubmit(onSubmit, (errors) => {
        console.error("Form validation errors:", errors);
      })} className="space-y-4">
        <ScrollArea className="h-[calc(90vh-120px)] w-full pr-4 space-y-4">
          <div className="space-y-4">
        <IGRPFormFieldPrimitive
          control={form.control}
          name="name"
          render={({ field }) => (
            <IGRPFormItemPrimitive>
              <IGRPFormLabelPrimitive className='after:content-["*"] after:text-destructive'>Nome</IGRPFormLabelPrimitive>
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
              <IGRPFormLabelPrimitive className='after:content-["*"] after:text-destructive'>Código</IGRPFormLabelPrimitive>
              <IGRPFormControlPrimitive>
                <IGRPInputPrimitive
                  {...field}
                  className="uppercase"
                  required
                  onChange={(e) => {
                    const v = e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, "");
                    field.onChange(v);
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
                  <IGRPSelectTriggerPrimitive >
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
              <IGRPSelectPrimitive onValueChange={field.onChange} value={field.value}>
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

        {type === appTypeCrud.enum.INTERNAL && (
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


        {type === appTypeCrud.enum.EXTERNAL && (
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
              <IGRPSelectPrimitive
                onValueChange={field.onChange}
                value={field.value}
                defaultValue="true"
              >
                <IGRPFormControlPrimitive>
                  <IGRPSelectTriggerPrimitive className="w-full truncate">
                    <IGRPSelectValuePrimitive placeholder="Selecionar estado" />
                  </IGRPSelectTriggerPrimitive>
                </IGRPFormControlPrimitive>
                <IGRPSelectContentPrimitive>
                  {STATUS_OPTIONS.map((status) => (
                    <IGRPSelectItemPrimitive
                      key={status.value}
                      value={status.value}
                      defaultValue={"true"}
                    >
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