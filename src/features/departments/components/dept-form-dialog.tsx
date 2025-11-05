"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  IGRPButton,
  IGRPButtonPrimitive,
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
  IGRPSelectContentPrimitive,
  IGRPSelectItemPrimitive,
  IGRPSelectPrimitive,
  IGRPSelectTriggerPrimitive,
  IGRPSelectValuePrimitive,
  IGRPTextAreaPrimitive,
  useIGRPToast,
} from "@igrp/igrp-framework-react-design-system";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { STATUS_OPTIONS } from "@/lib/constants";
import { statusSchema } from "@/schemas/global";
import { DEPT_OPTIONS } from "../dept-lib";
import {
  type DepartmentArgs,
  departmentSchema,
  normalizeDeptartment,
} from "../dept-schemas";
import {
  useCreateDepartment,
  useUpdateDepartment,
} from "../use-departments";

interface DepartmentCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  department: DepartmentArgs | null;
  parentDeptId?: string | null;
}

export function DepartmentFormDialog({
  open,
  onOpenChange,
  department,
  parentDeptId,
}: DepartmentCreateDialogProps) {
  const { igrpToast } = useIGRPToast();

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
      form.reset({
        ...defaultValues,
        parent_code: parentDeptId ?? "",
      });
    }
  }, [open, department, parentDeptId, form]);

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

  const isLoading = isCreating || isUpdating;

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

  const isSubDepartment = Boolean(parentDeptId);

  const titleTxt = department
    ? "Editar Departamento"
    : isSubDepartment
    ? "Criar Sub Departamento"
    : "Criar Novo Departamento";

  const descriptionTxt = department
    ? "Atualizar Departamento"
    : isSubDepartment
    ? "Criar um novo sub departamento"
    : "Criar um novo departamento";

  return (
    <IGRPDialogPrimitive open={open} onOpenChange={onOpenChange} modal={false}>
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
                      className="placeholder:truncate border-primary/30 focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:border-primary/30"
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
                  <IGRPFormLabelPrimitive className='after:content-["*"] after:text-destructive'>
                    Código
                  </IGRPFormLabelPrimitive>
                  <IGRPFormControlPrimitive>
                    <IGRPInputPrimitive
                      placeholder="Código do Departamento"
                      required
                      disabled={isLoading || !!department}
                      {...field}
                      onFocus={() => form.trigger("code")}
                      className="placeholder:truncate border-primary/30 focus-visible:ring-[2px] focus-visible:ring-primary/30 focus-visible:border-primary/30"
                    />
                  </IGRPFormControlPrimitive>
                  <IGRPFormMessagePrimitive />
                </IGRPFormItemPrimitive>
              )}
            />

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
                      className="resize-none placeholder:truncate border-primary/30 focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:border-primary/30"
                    />
                  </IGRPFormControlPrimitive>
                  <IGRPFormMessagePrimitive />
                </IGRPFormItemPrimitive>
              )}
            />

            {isSubDepartment && (
              <IGRPFormFieldPrimitive
                control={form.control}
                name="parent_code"
                render={({ field }) => (
                  <IGRPFormItemPrimitive>
                    <IGRPFormLabelPrimitive>
                      Departamento Pai
                    </IGRPFormLabelPrimitive>
                    <IGRPFormControlPrimitive>
                      <IGRPInputPrimitive
                        {...field}
                        disabled
                        placeholder="Departamento pai"
                        className="bg-muted border-primary/30"
                      />
                    </IGRPFormControlPrimitive>
                    <IGRPFormMessagePrimitive />
                  </IGRPFormItemPrimitive>
                )}
              />
            )}

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