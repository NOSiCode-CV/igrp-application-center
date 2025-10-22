"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  cn,
  IGRPBadgePrimitive,
  IGRPButton,
  IGRPButtonPrimitive,
  IGRPCardContentPrimitive,
  IGRPCardFooterPrimitive,
  IGRPCardPrimitive,
  IGRPCommandGroupPrimitive,
  IGRPCommandInputPrimitive,
  IGRPCommandItemPrimitive,
  IGRPCommandListPrimitive,
  IGRPCommandPrimitive,
  IGRPFormControlPrimitive,
  IGRPFormFieldPrimitive,
  IGRPFormItemPrimitive,
  IGRPFormLabelPrimitive,
  IGRPFormMessagePrimitive,
  IGRPFormPrimitive,
  IGRPIcon,
  IGRPInputPrimitive,
  IGRPPopoverContentPrimitive,
  IGRPPopoverPrimitive,
  IGRPPopoverTriggerPrimitive,
  IGRPSelectContentPrimitive,
  IGRPSelectItemPrimitive,
  IGRPSelectPrimitive,
  IGRPSelectTriggerPrimitive,
  IGRPSelectValuePrimitive,
  IGRPTextAreaPrimitive,
  useIGRPToast,
} from "@igrp/igrp-framework-react-design-system";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { type Control, type FieldPath, useForm } from "react-hook-form";

// import { FileUploadField } from "@/components/file-upload-field";
import { AppCenterLoading } from "@/components/loading";
import {
  type ApplicationArgs,
  appTypeCrud,
  FormSchema,
  type FormVals,
  normalizeApplication,
} from "@/features/applications/app-schemas";
import {
  useCreateApplication,
  useUpdateApplication,
} from "@/features/applications/use-applications";
import { useDepartments } from "@/features/departments/use-departments";
// import { useUploadPublicFiles } from "@/features/files/use-files";
import { useUsers } from "@/features/users/use-users";
import { ROUTES, STATUS_OPTIONS } from "@/lib/constants";
import { statusSchema } from "@/schemas/global";
import { APPLICATIONS_TYPES_FILTERED } from "../app-utils";
import {
  DepartmentOption,
  DEPT_OPTIONS,
} from "@/features/departments/dept-lib";

// TDOD: implement picture

export function ApplicationForm({
  application,
}: {
  application?: ApplicationArgs;
}) {
  const router = useRouter();
  const { igrpToast } = useIGRPToast();

  const { data: users, isLoading: userLoading, error: userError } = useUsers();
  const {
    data: departments,
    isLoading: departmentLoading,
    error: departmentError,
  } = useDepartments();

  const { mutateAsync: addApplication } = useCreateApplication();
  const { mutateAsync: updateApplication } = useUpdateApplication();

  // const { mutateAsync: uploadPrivateFile } = useUploadPublicFiles();

  const isEdit = !!application;

  const form = useForm<FormVals>({
    resolver: zodResolver(FormSchema),
    defaultValues: isEdit
      ? ({
          name: application?.name ?? "",
          owner: application?.owner ?? "",
          code: application?.code ?? "",
          slug: application?.slug ?? "",
          url: application?.url ?? undefined,
          description: application?.description ?? "",
          type: application?.type ?? appTypeCrud.enum.INTERNAL,
          status: application.status,
          picture: application?.picture ?? "",
          departments: application?.departments ?? [],
          image: null,
        } as Partial<FormVals>)
      : ({
          name: "",
          owner: "",
          code: "",
          type: appTypeCrud.enum.INTERNAL,
          slug: "",
          url: "",
          description: "",
          picture: "",
          status: statusSchema.enum.ACTIVE,
          departments: [],
          image: null,
        } as FormVals),
    mode: "onBlur",
    reValidateMode: "onChange",
  });

  const type = form.watch("type");

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    form.setValue("name", name);

    if (!application || form.getValues("slug") === "") {
      const slug = name
        .toLowerCase()
        .replace(/[^\w\s-]/g, "")
        .replace(/\s+/g, "-");
      form.setValue("slug", slug);
    }
  };

  const isLoading = userLoading || !departments || departmentLoading;

  if (isLoading)
    return <AppCenterLoading descrption="A preparar dados da aplicação..." />;
  if (userError) throw userError;
  if (departmentError) throw departmentError;

  const userOptions = users?.map((user) => {
    return {
      value: user.username,
      label: user.name,
    };
  });

  const departmentOptions = DEPT_OPTIONS(departments);

  const disabledFields = !!application;

  const disabledBtn =
    form.formState.isSubmitting ||
    isLoading ||
    userLoading ||
    !!userError ||
    departmentLoading ||
    !!departmentError;

  const submitLblBtn = form.formState.isSubmitting ? "Guardando..." : "Guardar";

  const onSubmit = async (values: FormVals) => {
    const payload = { ...values };

    // console.log({ values });

    const file = values.image?.file as File;

    if (file) {
      // const options = { folder: values.code as string };
      // const result = await uploadPrivateFile({ file, options });
      const result = null;
      payload.picture = result;
    }

    if (payload.type === appTypeCrud.enum.INTERNAL) delete payload.url;
    if (payload.type === appTypeCrud.enum.EXTERNAL) delete payload.slug;
    delete payload.image;

    // console.log({ payload });

    try {
      if (isEdit) {
        await updateApplication({
          code: application.code,
          data: normalizeApplication(payload, true),
        });
      } else {
        await addApplication(normalizeApplication(payload, false));
        form.reset();
      }

      igrpToast({
        type: "success",
        title: `${application ? " Atualização" : "Criação"} concluída`,
        description: `A aplicação foi ${application ? " atualizada" : "criada"} com sucesso!`,
      });

      router.push(`${ROUTES.APPLICATIONS}/${payload.code}`);
    } catch (error) {
      igrpToast({
        type: "error",
        title: "Não foi possível concluir a operação.",
        description:
          error instanceof Error
            ? error.message
            : "Ocorreu um erro desconhecido.",
      });
    }
  };

  return (
    <IGRPCardPrimitive className="py-6">
      <IGRPFormPrimitive {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit, (errors) => {
            console.log("INVALID FORM ERRORS", errors);
            igrpToast({
              type: "error",
              title: "Corrija os campos obrigatórios",
              description: "Existem erros de validação no formulário.",
            });
          })}
        >
          <IGRPCardContentPrimitive>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <IGRPFormFieldPrimitive
                control={form.control}
                name="name"
                render={({ field }) => (
                  <IGRPFormItemPrimitive>
                    <IGRPFormLabelPrimitive className='after:content-["*"] after:text-destructive gap-0.5'>
                      Nome
                    </IGRPFormLabelPrimitive>
                    <IGRPFormControlPrimitive>
                      <IGRPInputPrimitive
                        placeholder="Nome da Aplicação"
                        value={field.value ?? ""}
                        onBlur={field.onBlur}
                        name={field.name}
                        ref={field.ref}
                        onChange={handleNameChange}
                        required
                        className="placeholder:truncate border-primary/30 focus-visible:ring-[2px] focus-visible:ring-primary/30 focus-visible:border-primary/30"
                      />
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
                    <IGRPFormLabelPrimitive className='after:content-["*"] after:text-destructive gap-0.5'>
                      Código
                    </IGRPFormLabelPrimitive>
                    <IGRPFormControlPrimitive>
                      <IGRPInputPrimitive
                        placeholder="APP_CODE"
                        onChange={(e) => {
                          const v = e.target.value
                            .toUpperCase()
                            .replace(/[^A-Z0-9_]/g, "");
                          field.onChange(v);
                        }}
                        onBlur={field.onBlur}
                        pattern="^[A-Z0-9_]+$"
                        name={field.name}
                        ref={field.ref}
                        value={field.value ?? ""}
                        required
                        className="placeholder:truncate border-primary/30 focus-visible:ring-[2px] focus-visible:ring-primary/30 focus-visible:border-primary/30 uppercase"
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
                    <IGRPFormLabelPrimitive className='after:content-["*"] after:text-destructive gap-0.5'>
                      Proprietário
                    </IGRPFormLabelPrimitive>
                    <IGRPSelectPrimitive
                      onValueChange={field.onChange}
                      value={field.value ?? ""}
                    >
                      <IGRPFormControlPrimitive>
                        <IGRPSelectTriggerPrimitive className="w-full truncate">
                          <IGRPSelectValuePrimitive placeholder="Selecione o proprietário" />
                        </IGRPSelectTriggerPrimitive>
                      </IGRPFormControlPrimitive>
                      <IGRPSelectContentPrimitive>
                        {userOptions?.map((user) => (
                          <IGRPSelectItemPrimitive
                            key={user.value}
                            value={user.value}
                          >
                            {user.label}
                          </IGRPSelectItemPrimitive>
                        ))}
                      </IGRPSelectContentPrimitive>
                    </IGRPSelectPrimitive>

                    {userError ? (
                      <p className="text-destructive">{userError}</p>
                    ) : (
                      <IGRPFormMessagePrimitive />
                    )}
                  </IGRPFormItemPrimitive>
                )}
              />

              {/* Depatments */}
              <DepartamentField
                control={form.control}
                options={departmentOptions}
                disabled={disabledFields}
              />

              <IGRPFormFieldPrimitive
                control={form.control}
                name="type"
                render={({ field }) => (
                  <IGRPFormItemPrimitive>
                    <IGRPFormLabelPrimitive className='after:content-["*"] after:text-destructive gap-0.5'>
                      Tipo
                    </IGRPFormLabelPrimitive>
                    <IGRPSelectPrimitive
                      onValueChange={field.onChange}
                      value={field.value ?? ""}
                    >
                      <IGRPFormControlPrimitive>
                        <IGRPSelectTriggerPrimitive
                          className="w-full truncate"
                          disabled={disabledFields}
                        >
                          <IGRPSelectValuePrimitive placeholder="Selecione o tipo de aplicação" />
                        </IGRPSelectTriggerPrimitive>
                      </IGRPFormControlPrimitive>
                      <IGRPSelectContentPrimitive>
                        {APPLICATIONS_TYPES_FILTERED.map((opt) => (
                          <IGRPSelectItemPrimitive
                            key={opt.value}
                            value={opt.value}
                          >
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
                      <IGRPFormLabelPrimitive className='after:content-["*"] after:text-destructive gap-0.5'>
                        URL Relativo
                      </IGRPFormLabelPrimitive>
                      <IGRPFormControlPrimitive>
                        <IGRPInputPrimitive
                          placeholder="app-exemplo"
                          value={field.value ?? undefined}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                          name={field.name}
                          ref={field.ref}
                          disabled={
                            disabledFields && type !== appTypeCrud.enum.INTERNAL
                          }
                          className="placeholder:truncate border-primary/30 focus-visible:ring-[2px] focus-visible:ring-primary/30 focus-visible:border-primary/30"
                        />
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
                      <IGRPFormLabelPrimitive className='after:content-["*"] after:text-destructive gap-0.5'>
                        URL
                      </IGRPFormLabelPrimitive>
                      <IGRPFormControlPrimitive>
                        <IGRPInputPrimitive
                          placeholder="https://exemplo.com"
                          value={field.value ?? undefined}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                          name={field.name}
                          ref={field.ref}
                          disabled={
                            disabledFields && type !== appTypeCrud.enum.EXTERNAL
                          }
                          className="placeholder:truncate border-primary/30 focus-visible:ring-[2px] focus-visible:ring-primary/30 focus-visible:border-primary/30"
                        />
                      </IGRPFormControlPrimitive>
                      <IGRPFormMessagePrimitive />
                    </IGRPFormItemPrimitive>
                  )}
                />
              )}

              {isEdit && (
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
              )}

              {/* <IGRPFormFieldPrimitive
                control={form.control}
                name="image"
                render={({ field }) => (
                  <FileUploadField
                    value={field.value ?? null}
                    onChange={field.onChange}
                    maxSizeMB={1}
                    disabled={form.formState.isSubmitting}
                    btnLabel="Selecionar Logo"
                    placeholder="Arraste seu logo aqui"
                  />
                )}
              /> */}

              <IGRPFormFieldPrimitive
                control={form.control}
                name="description"
                render={({ field }) => (
                  <IGRPFormItemPrimitive
                    className={cn("lg:col-span-2", isEdit && "sm:col-span-2")}
                  >
                    <IGRPFormLabelPrimitive className='after:content-["*"] after:text-destructive gap-0.5'>
                      Descrição
                    </IGRPFormLabelPrimitive>
                    <IGRPFormControlPrimitive>
                      <IGRPTextAreaPrimitive
                        placeholder="Descreva a sua aplicação"
                        required={true}
                        rows={2}
                        value={field.value ?? ""}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        name={field.name}
                        ref={field.ref}
                        className="resize-none placeholder:truncate border-primary/30 focus-visible:ring-[2px] focus-visible:ring-primary/30 focus-visible:border-primary/30"
                      />
                    </IGRPFormControlPrimitive>
                    <IGRPFormMessagePrimitive />
                  </IGRPFormItemPrimitive>
                )}
              />
            </div>
          </IGRPCardContentPrimitive>

          <IGRPCardFooterPrimitive className="justify-end pt-6 gap-3 flex-col sm:flex-row">
            <IGRPButton
              variant="outline"
              onClick={() => router.push(ROUTES.APPLICATIONS)}
              type="button"
              disabled={disabledBtn}
              showIcon
              iconPlacement="start"
              iconName="Undo2"
              className="gap-1 w-full sm:max-w-36"
            >
              Cancelar
            </IGRPButton>
            <IGRPButton
              type="submit"
              disabled={disabledBtn}
              showIcon
              iconPlacement="end"
              loading={isLoading}
              iconName="Check"
              className="gap-1 w-full sm:max-w-36"
            >
              {submitLblBtn}
            </IGRPButton>
          </IGRPCardFooterPrimitive>
        </form>
      </IGRPFormPrimitive>
    </IGRPCardPrimitive>
  );
}

type Props = {
  control: Control<FormVals>;
  name?: FieldPath<FormVals>;
  options: DepartmentOption[];
  disabled?: boolean;
  errorText?: string | null;
};

function DepartamentField({
  control,
  name = "departments",
  options,
  disabled = false,
  errorText = null,
}: Props) {
  const asStringArray = (v: unknown): string[] =>
    Array.isArray(v) ? (v as string[]) : [];

  const toggleInArray = (
    arr: readonly string[] | undefined,
    value: string,
  ): string[] => {
    const set = new Set(arr ?? []);
    set.has(value) ? set.delete(value) : set.add(value);
    return Array.from(set);
  };

  const removeFromArray = (
    arr: readonly string[] | undefined,
    value: string,
  ): string[] => (arr ?? []).filter((v) => v !== value);

  const getLabel = (code: string) =>
    options.find((o) => o.value === code)?.label ?? code;

  return (
    <IGRPFormFieldPrimitive
      control={control}
      name={name}
      render={({ field }) => {
        const value = asStringArray(field.value);
        const [open, setOpen] = useState(false);
        const selected = useMemo(() => new Set(value), [value]);
        const count = value.length;

        return (
          <IGRPFormItemPrimitive>
            <IGRPFormLabelPrimitive className='after:content-["*"] after:text-destructive gap-0.5'>
              Departamentos
            </IGRPFormLabelPrimitive>

            <div className="flex flex-wrap gap-2 mb-2">
              {count > 0 ? (
                value.map((code) => (
                  <IGRPBadgePrimitive
                    key={code}
                    variant="outline"
                    className="gap-1"
                  >
                    {getLabel(code)}
                    <button
                      type="button"
                      aria-label="Remover departamento"
                      className="ml-1 inline-flex items-center"
                      onClick={() =>
                        field.onChange(removeFromArray(value, code))
                      }
                      disabled={disabled}
                    >
                      <IGRPIcon iconName="X" className="h-3 w-3" />
                    </button>
                  </IGRPBadgePrimitive>
                ))
              ) : (
                <span className="text-muted-foreground text-sm">
                  Nenhum selecionado
                </span>
              )}
            </div>

            <IGRPPopoverPrimitive open={open} onOpenChange={setOpen}>
              <IGRPPopoverTriggerPrimitive asChild>
                <IGRPButtonPrimitive
                  type="button"
                  variant="outline"
                  className="w-full justify-between"
                >
                  <span>
                    {count > 0
                      ? `Selecionados (${count})`
                      : "Selecionar departamentos"}
                  </span>
                  <IGRPIcon iconName={open ? "ChevronUp" : "ChevronDown"} />
                </IGRPButtonPrimitive>
              </IGRPPopoverTriggerPrimitive>

              <IGRPPopoverContentPrimitive
                className="p-0 w-[--radix-popover-trigger-width] min-w-64"
                align="start"
              >
                <IGRPCommandPrimitive>
                  <IGRPCommandInputPrimitive placeholder="Procurar departamento..." />
                  <IGRPCommandListPrimitive className="max-h-64">
                    <IGRPCommandGroupPrimitive heading="Departamentos">
                      {options.map((opt) => {
                        const isSelected = selected.has(opt.value);
                        return (
                          <IGRPCommandItemPrimitive
                            key={opt.value}
                            onSelect={() => {
                              const next = toggleInArray(value, opt.value);
                              field.onChange(next);
                            }}
                            className="flex items-center gap-2 cursor-pointer"
                          >
                            <IGRPIcon
                              iconName={isSelected ? "Check" : "Circle"}
                              className="h-4 w-4 opacity-70"
                            />
                            <span className="truncate">{opt.label}</span>
                          </IGRPCommandItemPrimitive>
                        );
                      })}
                    </IGRPCommandGroupPrimitive>
                  </IGRPCommandListPrimitive>

                  <div className="flex items-center justify-between p-2 border-t">
                    <IGRPButtonPrimitive
                      type="button"
                      variant="ghost"
                      className="text-xs"
                      onClick={() => field.onChange([])}
                      disabled={disabled || count === 0}
                    >
                      Limpar seleção
                    </IGRPButtonPrimitive>
                    <IGRPButtonPrimitive
                      type="button"
                      size="sm"
                      onClick={() => setOpen(false)}
                    >
                      Concluir
                    </IGRPButtonPrimitive>
                  </div>
                </IGRPCommandPrimitive>
              </IGRPPopoverContentPrimitive>
            </IGRPPopoverPrimitive>

            {errorText ? (
              <p className="text-destructive text-sm">{errorText}</p>
            ) : (
              <IGRPFormMessagePrimitive />
            )}
          </IGRPFormItemPrimitive>
        );
      }}
    />
  );
}
