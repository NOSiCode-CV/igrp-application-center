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
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { STATUS_OPTIONS } from "@/lib/constants";
import { statusSchema } from "@/schemas/global";
import {
  DepartmentArgs,
  departmentSchema,
  normalizeDeptartment,
} from "../dept-schemas";
import { useCreateDepartment, useUpdateDepartment } from "../use-departments";
import { DepartmentDTO } from "@igrp/platform-access-management-client-ts";

interface DepartmentCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  department: DepartmentDTO | null;
  parentDeptId?: DepartmentDTO | null;
}

export function DepartmentFormDialog({
  open,
  onOpenChange,
  department,
  parentDeptId,
}: DepartmentCreateDialogProps) {
  const { igrpToast } = useIGRPToast();
  const [shouldClose, setShouldClose] = useState(false);
  const { mutateAsync: createDepartment, isPending: isCreating } =
    useCreateDepartment();
  const { mutateAsync: updateDepartment, isPending: isUpdating } =
    useUpdateDepartment();

  const defaultValues = {
    name: "",
    code: "",
    description: "",
    status: statusSchema.enum.ACTIVE,
    parentCode: "",
  };

  const form = useForm<DepartmentArgs>({
    resolver: zodResolver(departmentSchema),
    defaultValues: defaultValues,
    mode: "onChange",
  });

  useEffect(() => {
    if (!open) return;

    if (department) {
      form.reset({
        name: department.name ?? "",
        code: department.code ?? "",
        description: department.description ?? "",
        status: department.status ?? statusSchema.enum.ACTIVE,
        parentCode: department.parentCode ?? "",
      });
    } else {
      form.reset({
        ...defaultValues,
        parentCode: parentDeptId?.code ?? "",
      });
    }
  }, [open, department, parentDeptId, form]);

  const watchedName = form.watch("name");

  useEffect(() => {
    if (!open) {
      form.reset(defaultValues);
      form.clearErrors();
    }
  }, [open, form]);

  useEffect(() => {
    const codeDirty = !!form.formState.dirtyFields?.code;
    if (codeDirty) return;

    const raw = (watchedName ?? "").trim();
    if (!raw) return;

    if (!department) {
      const ignoreWords = ["do", "da", "de", "dos", "das", "e", "o", "a"];
      const words = raw.split(/\s+/);

      const initials = words
        .filter((word) => !ignoreWords.includes(word.toLowerCase()))
        .map((word) => word.charAt(0).toUpperCase())
        .join("");

      const code = initials.slice(0, 30);
      form.setValue("code", code, { shouldValidate: true, shouldDirty: false });
    }
  }, [watchedName, form, department]);

  const isLoading = isCreating || isUpdating;

  const onSubmit = async (values: DepartmentArgs) => {
    const payload = normalizeDeptartment(values);

    try {
      if (department) {
        const result = await updateDepartment({
          code: department.code,
          data: payload,
        });
        if (!result.success) {
          throw new Error(result.error);
        }
      } else {
        const result = await createDepartment(payload);
        if (!result.success) {
          throw new Error(result.error);
        }
      }

      igrpToast({
        type: "success",
        title: "Departamento",
        description: `O departamento foi ${
          department ? "atualizado" : "criado"
        } com sucesso.`,
      });

      if (shouldClose) {
        onOpenChange(false);
        form.reset();
      } else {
        form.reset({
          ...defaultValues,
          parentCode: parentDeptId?.code ?? "",
        });
      }
    } catch (error) {
      igrpToast({
        type: "error",
        title: `Não foi possível ${
          department ? "atualizar" : "criar"
        } departamento.`,
        description:
          error instanceof Error
            ? error.message
            : "Ocorreu um erro desconhecido.",
      });
    }
  };

  const isSubDepartment = Boolean(parentDeptId?.code);

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
                      className="placeholder:truncate border-primary/30 focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:border-primary/30"
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
                  <IGRPFormLabelPrimitive className="">
                    Descrição
                  </IGRPFormLabelPrimitive>
                  <IGRPFormControlPrimitive>
                    <IGRPTextAreaPrimitive
                      placeholder="Breve descrição do departamento"
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
                name="parentCode"
                render={({ field }) => (
                  <IGRPFormItemPrimitive>
                    <IGRPFormLabelPrimitive>
                      Departamento Pai
                    </IGRPFormLabelPrimitive>
                    <IGRPFormControlPrimitive>
                      <IGRPInputPrimitive
                        {...field}
                        value={
                          parentDeptId?.name ||
                          parentDeptId?.description ||
                          parentDeptId?.code ||
                          ""
                        }
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

            <IGRPDialogFooterPrimitive className="pt-6 flex justify-between">
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
                iconName="X"
              >
                Cancelar
              </IGRPButton>

              <div className="flex gap-1">
                {!department && (
                  <IGRPButtonPrimitive
                    type="submit"
                    variant="outline"
                    disabled={isLoading}
                    onClick={() => setShouldClose(false)}
                    className="flex items-center gap-1"
                  >
                    <IGRPIcon iconName="Save" className="size-4" />
                    {isLoading ? "Guardando..." : "Guardar e Novo"}
                  </IGRPButtonPrimitive>
                )}

                <IGRPButtonPrimitive
                  type="submit"
                  disabled={isLoading}
                  onClick={() => setShouldClose(true)}
                  className="flex items-center gap-1"
                >
                  <IGRPIcon iconName="Save" className="size-4" />
                  {isLoading ? "Guardando..." : "Guardar"}
                </IGRPButtonPrimitive>
              </div>
            </IGRPDialogFooterPrimitive>
          </form>
        </IGRPFormPrimitive>
      </IGRPDialogContentPrimitive>
    </IGRPDialogPrimitive>
  );
}
