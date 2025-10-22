"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  IGRPButton,
  IGRPButtonPrimitive,
  IGRPCommandEmptyPrimitive,
  IGRPCommandInputPrimitive,
  IGRPCommandItemPrimitive,
  IGRPCommandListPrimitive,
  IGRPCommandPrimitive,
  IGRPDialogContentPrimitive,
  IGRPDialogDescriptionPrimitive,
  IGRPDialogFooterPrimitive,
  IGRPDialogHeaderPrimitive,
  IGRPDialogPrimitive,
  IGRPDialogTitlePrimitive,
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
import { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { STATUS_OPTIONS } from "@/lib/constants";
import { statusSchema } from "@/schemas/global";
import {
  type DepartmentArgs,
  departmentSchema,
  normalizeDeptartment,
} from "../dept-schemas";
import {
  useCreateDepartment,
  useUpdateDepartment,
  useDepartments,
} from "../use-departments";
import { DEPT_OPTIONS } from "../dept-lib";

interface DepartmentCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  department: DepartmentArgs | null;
}

export function DepartmentFormDialog({
  open,
  onOpenChange,
  department,
}: DepartmentCreateDialogProps) {
  const { igrpToast } = useIGRPToast();

  const [parentOpen, setParentOpen] = useState(false);

  const { mutateAsync: createDepartment, isPending: isCreating } =
    useCreateDepartment();
  const { mutateAsync: updateDepartment, isPending: isUpdating } =
    useUpdateDepartment();

  const defaultValues = {
    name: "",
    code: "",
    description: "",
    status: statusSchema.enum.ACTIVE,
    parent_code: "",
  };

  const {
    data: departments,
    isLoading: departmentLoading,
    error: departmentError,
  } = useDepartments();

  const form = useForm<DepartmentArgs>({
    resolver: zodResolver(departmentSchema),
    defaultValues: defaultValues,
  });

  useEffect(() => {
    if (!open) return;

    if (department) {
      form.reset({
        name: department.name ?? "",
        code: department.code ?? "",
        description: department.description ?? "",
        status: department.status ?? statusSchema.enum.ACTIVE,
        parent_code: department.parent_code ?? "",
      });
    } else {
      form.reset(defaultValues);
    }
  }, [open, department, form]);

  const watchedName = form.watch("name");

  useEffect(() => {
    const codeDirty = !!form.formState.dirtyFields?.code;
    if (codeDirty) return;

    const raw = (watchedName ?? "").trim();
    if (!raw) return;

    if (!department) {
      const code = `DEPT_${raw.replace(/\s+/g, "_").toUpperCase()}`.slice(
        0,
        30,
      );
      form.setValue("code", code, { shouldValidate: true, shouldDirty: false });
    }
  }, [watchedName, form, department]);

  const isLoading = isCreating || isUpdating || departmentLoading;

  const errorText =
    departmentError && "Ocorreu um erro ao carregar os departamentos.";

  const departmentOptions = useMemo(
    () =>
      DEPT_OPTIONS(
        (departments ?? []).filter((d) => d.code !== department?.code),
      ),
    [departments, department],
  );

  const parentValue = form.watch("parent_code");

  const parentSelected = useMemo(
    () => departmentOptions.find((o) => o.value === parentValue) ?? null,
    [parentValue, departmentOptions],
  );

  const onSubmit = async (values: DepartmentArgs) => {
    const payload = normalizeDeptartment(values);

    try {
      if (department) {
        await updateDepartment({ code: department.code, data: payload });
      } else {
        await createDepartment(payload);
      }

      igrpToast({
        type: "success",
        title: "Departamento",
        description: `O departamento foi ${department ? "atualizado" : "criado"} com sucesso.`,
      });

      form.reset();
      onOpenChange(false);
    } catch (error) {
      igrpToast({
        type: "error",
        title: `Não foi possível ${department ? "atualizar" : "criar"} departamento.`,
        description:
          error instanceof Error
            ? error.message
            : "Ocorreu um erro desconhecido.",
      });
    }
  };

  const titleTxt = department
    ? "Editar Departamento"
    : "Criar Novo Departamento";
  const descriptionTxt = department
    ? "Atualizar Departamento"
    : "Criar um novo departamento";

  return (
    <IGRPDialogPrimitive open={open} onOpenChange={onOpenChange}>
      <IGRPDialogContentPrimitive>
        <IGRPDialogHeaderPrimitive>
          <IGRPDialogTitlePrimitive>{titleTxt}</IGRPDialogTitlePrimitive>
          <IGRPDialogDescriptionPrimitive>
            {descriptionTxt}
          </IGRPDialogDescriptionPrimitive>
        </IGRPDialogHeaderPrimitive>

        <IGRPFormPrimitive {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col gap-4"
          >
            <IGRPFormFieldPrimitive
              control={form.control}
              name="name"
              render={({ field }) => (
                <IGRPFormItemPrimitive>
                  <IGRPFormLabelPrimitive className='after:content-["*"] after:text-destructive'>
                    Nome
                  </IGRPFormLabelPrimitive>
                  <IGRPFormControlPrimitive>
                    <IGRPInputPrimitive
                      placeholder="Nome do Departamento"
                      value={field.value ?? ""}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      name={field.name}
                      ref={field.ref}
                      required
                      disabled={isLoading}
                      className="placeholder:truncate border-primary/30 focus-visible:ring-[2px] focus-visible:ring-primary/30 focus-visible:border-primary/30"
                    />
                  </IGRPFormControlPrimitive>
                  <IGRPFormMessagePrimitive />
                </IGRPFormItemPrimitive>
              )}
            />

            {!department && (
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
                        placeholder="DEPT_CODE"
                        required
                        disabled={isLoading}
                        {...field}
                        onFocus={() => form.trigger("code")}
                        className="placeholder:truncate border-primary/30 focus-visible:ring-[2px] focus-visible:ring-primary/30 focus-visible:border-primary/30"
                      />
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
                  <IGRPFormLabelPrimitive className='after:content-["*"] after:text-destructive'>
                    Descrição
                  </IGRPFormLabelPrimitive>
                  <IGRPFormControlPrimitive>
                    <IGRPTextAreaPrimitive
                      placeholder="Breve descrição do departamento"
                      required
                      rows={2}
                      disabled={isLoading}
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

            <IGRPFormFieldPrimitive
              control={form.control}
              name="parent_code"
              render={({ field }) => {
                const placeholder = "Selecionar departamento…";

                return (
                  <IGRPFormItemPrimitive>
                    <IGRPFormLabelPrimitive>
                      Departamentos
                    </IGRPFormLabelPrimitive>

                    <IGRPPopoverPrimitive
                      open={parentOpen}
                      onOpenChange={(next) => {
                        if (isLoading) return;
                        setParentOpen(next);
                      }}
                    >
                      <IGRPPopoverTriggerPrimitive asChild>
                        <IGRPButtonPrimitive
                          type="button"
                          variant="outline"
                          className="w-full justify-between"
                          aria-expanded={parentOpen}
                          disabled={isLoading}
                        >
                          <span className="truncate">
                            {parentSelected
                              ? parentSelected.label
                              : placeholder}
                          </span>
                          <IGRPIcon
                            iconName={parentOpen ? "ChevronUp" : "ChevronDown"}
                          />
                        </IGRPButtonPrimitive>
                      </IGRPPopoverTriggerPrimitive>

                      <IGRPPopoverContentPrimitive
                        className="p-0 w-[--radix-popover-trigger-width] min-w-64"
                        align="start"
                      >
                        <IGRPCommandPrimitive>
                          <IGRPCommandInputPrimitive placeholder="Procurar departamento..." />
                          <IGRPCommandListPrimitive className="max-h-64">
                            <IGRPCommandEmptyPrimitive className="py-4 text-center text-sm text-foreground">
                              Departamento não encontrado.
                            </IGRPCommandEmptyPrimitive>

                            <IGRPCommandItemPrimitive
                              key="__none__"
                              onSelect={() => {
                                field.onChange("");
                                setParentOpen(false);
                              }}
                              aria-selected={!field.value}
                              className="flex items-center gap-2"
                            >
                              {!field.value ? (
                                <IGRPIcon
                                  iconName="Check"
                                  className="size-4 shrink-0"
                                />
                              ) : (
                                <span className="w-4" />
                              )}
                              <span className="truncate">Nenhum</span>
                            </IGRPCommandItemPrimitive>

                            {departmentOptions.map((opt) => (
                              <IGRPCommandItemPrimitive
                                key={opt.value}
                                onSelect={() => {
                                  field.onChange(opt.value);
                                  setParentOpen(false);
                                }}
                                aria-selected={field.value === opt.value}
                                className="flex items-center gap-2"
                              >
                                {field.value === opt.value ? (
                                  <IGRPIcon
                                    iconName="Check"
                                    className="size-4 shrink-0"
                                  />
                                ) : (
                                  <span className="w-4" />
                                )}
                                <span className="truncate">{opt.label}</span>
                              </IGRPCommandItemPrimitive>
                            ))}
                          </IGRPCommandListPrimitive>

                          <div className="flex items-center justify-between px-2 py-3 border-t">
                            <IGRPButtonPrimitive
                              type="button"
                              className="text-xs"
                              onClick={() => field.onChange("")}
                              disabled={!field.value}
                            >
                              Limpar
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

            {department && (
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

            <IGRPDialogFooterPrimitive className="pt-6">
              <IGRPButton
                variant="outline"
                onClick={() => {
                  form.reset(defaultValues);
                  onOpenChange(false);
                }}
                type="button"
                disabled={isLoading}
                showIcon
                iconPlacement="start"
                iconName="Undo2"
              >
                Cancelar
              </IGRPButton>
              <IGRPButtonPrimitive
                type="button"
                disabled={isLoading}
                onClick={form.handleSubmit(onSubmit)}
              >
                {isLoading ? "Guardando..." : "Guardar"}
                <IGRPIcon iconName="Check" className="size-4" />
              </IGRPButtonPrimitive>
            </IGRPDialogFooterPrimitive>
          </form>
        </IGRPFormPrimitive>
      </IGRPDialogContentPrimitive>
    </IGRPDialogPrimitive>
  );
}
