import { zodResolver } from "@hookform/resolvers/zod";
import {
  IGRPButtonPrimitive,
  IGRPCommandEmptyPrimitive,
  IGRPCommandInputPrimitive,
  IGRPCommandItemPrimitive,
  IGRPCommandListPrimitive,
  IGRPCommandPrimitive,
  IGRPDialogContentPrimitive,
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
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { STATUS_OPTIONS } from "@/lib/constants";
import { statusSchema } from "@/schemas/global";
import {
  type CreateRoleArgs,
  createRoleSchema,
  normalizeRole,
  type RoleArgs,
  type UpdateRoleArgs,
  updateRoleSchema,
} from "../role-schemas";
import { useCreateRole, useUpdateRole } from "../use-roles";

interface RoleFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  departmentCode: string;
  role?: RoleArgs;
  openType?: "edit" | "view";
  roles?: RoleArgs[];
}

export function RoleFormDialog({
  open,
  onOpenChange,
  departmentCode,
  role,
  roles,
}: RoleFormDialogProps) {
  const [parentOpen, setParentOpen] = useState(false);

  const { mutateAsync: createRole, isPending: isCreating } = useCreateRole();
  const { mutateAsync: updateRole, isPending: isUpdating } = useUpdateRole();

  const { igrpToast } = useIGRPToast();

  const isEdit = !!role;

  const defaultValues = {
    name: "",
    description: null,
    departmentCode: departmentCode,
    parentName: "",
    status: statusSchema.enum.ACTIVE,
  };

  const form = useForm<CreateRoleArgs>({
    resolver: zodResolver(createRoleSchema),
    defaultValues: defaultValues,
  });

  useEffect(() => {
    if (!open) return;

    if (role) {
      form.reset({
        name: role.name ?? "",
        description: role.description ?? null,
        departmentCode: departmentCode ?? "",
        parentName: role.parentName ?? null,
        status: role.status ?? statusSchema.enum.ACTIVE,
      } as CreateRoleArgs);
    } else {
      form.reset(defaultValues as CreateRoleArgs);
    }
  }, [open, role, departmentCode, form]);

  const isLoading = isCreating || isUpdating || form.formState.isSubmitting;

  const parentValue = form.watch("parentName");

  const parentSelected = useMemo(
    () => roles?.find((o) => o.name === parentValue) ?? null,
    [parentValue, roles],
  );

  const onSubmit = async (values: CreateRoleArgs) => {
    try {
      if (isEdit && role) {
        const parsed = updateRoleSchema.parse({
          ...values,
        } as UpdateRoleArgs);

        const payload = normalizeRole(parsed as RoleArgs);

        await updateRole({ name: role.name, data: payload });

        igrpToast({
          type: "success",
          title: "Atualizar Perfil",
          description: "Perfil foi atualizado com sucesso.",
        });
      } else {
        const payload = normalizeRole(values);
        await createRole(payload);

        igrpToast({
          type: "success",
          title: "Adicionar Perfil",
          description: "Perfil foi adicionado com sucesso.",
        });
      }

      form.reset(defaultValues);
      onOpenChange(false);
    } catch (error) {
      console.error("Falha ao adicionar perfil:", error);
      igrpToast({
        type: "error",
        title: "Falha ao adicionar perfil",
        description: `Tente novamente. ${error}`,
      });
    }
  };

  return (
    <IGRPDialogPrimitive open={open} onOpenChange={onOpenChange} modal>
      <IGRPDialogContentPrimitive>
        <IGRPDialogHeaderPrimitive>
          <IGRPDialogTitlePrimitive>
            {isEdit ? "Editar Perfil" : "Adicionar Perfil"}
          </IGRPDialogTitlePrimitive>
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
                      placeholder="Identificador único do perfil"
                      required
                      disabled={isLoading}
                      className="placeholder:truncate border-primary/30 focus-visible:ring-[2px] focus-visible:ring-primary/30 focus-visible:border-primary/30"
                      {...field}
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
                  <IGRPFormLabelPrimitive>Descrição</IGRPFormLabelPrimitive>
                  <IGRPFormControlPrimitive>
                    <IGRPTextAreaPrimitive
                      placeholder="Breve descrição do perfil"
                      rows={2}
                      value={field.value ?? ""}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      name={field.name}
                      ref={field.ref}
                      disabled={isLoading}
                      className="resize-none placeholder:truncate border-primary/30 focus-visible:ring-[2px] focus-visible:ring-primary/30 focus-visible:border-primary/30"
                    />
                  </IGRPFormControlPrimitive>
                  <IGRPFormMessagePrimitive />
                </IGRPFormItemPrimitive>
              )}
            />

            {roles && roles.length > 0 && (
              <IGRPFormFieldPrimitive
                control={form.control}
                name="parentName"
                render={({ field }) => {
                  const placeholder = "Selecionar departamento…";

                  return (
                    <IGRPFormItemPrimitive>
                      <IGRPFormLabelPrimitive>
                        Perfil Pai
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
                                ? parentSelected.name
                                : placeholder}
                            </span>
                            <IGRPIcon
                              iconName={
                                parentOpen ? "ChevronUp" : "ChevronDown"
                              }
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

                              {roles.map((opt) => (
                                <IGRPCommandItemPrimitive
                                  key={opt.name}
                                  onSelect={() => {
                                    field.onChange(opt.name);
                                    setParentOpen(false);
                                  }}
                                  aria-selected={field.value === opt.name}
                                  className="flex items-center gap-2"
                                >
                                  {field.value === opt.name ? (
                                    <IGRPIcon
                                      iconName="Check"
                                      className="size-4 shrink-0"
                                    />
                                  ) : (
                                    <span className="w-4" />
                                  )}
                                  <span className="truncate">{opt.name}</span>
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

                      <IGRPFormMessagePrimitive />
                    </IGRPFormItemPrimitive>
                  );
                }}
              />
            )}

            {role && (
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

            <IGRPDialogFooterPrimitive className="pt-4">
              <IGRPButtonPrimitive
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </IGRPButtonPrimitive>
              <IGRPButtonPrimitive
                type="submit"
                disabled={isCreating || isUpdating}
              >
                {isEdit
                  ? isUpdating
                    ? "Atualizando..."
                    : "Atualizar"
                  : isCreating
                    ? "Guardando..."
                    : "Adicionar"}
              </IGRPButtonPrimitive>
            </IGRPDialogFooterPrimitive>
          </form>
        </IGRPFormPrimitive>
      </IGRPDialogContentPrimitive>
    </IGRPDialogPrimitive>
  );
}
