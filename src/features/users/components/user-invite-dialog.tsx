"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  IGRPButtonPrimitive,
  IGRPCommandEmptyPrimitive,
  IGRPCommandGroupPrimitive,
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
  useIGRPToast,
} from "@igrp/igrp-framework-react-design-system";
import type {
  CreateUserRequest,
  Status,
} from "@igrp/platform-access-management-client-ts";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useDepartments } from "@/features/departments/use-departments";
import { useRoles } from "@/features/roles/use-roles";
import { cn } from "@/lib/utils";
import { statusSchema } from "@/schemas/global";
import { useAddUserRole, useInviteUser } from "../use-users";

interface UserInviteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const formSchema = z.object({
  email: z.string().min(1, "Email obrigatório").email("Email inválido"),
  departmentCode: z.string().optional(),
  roleNames: z.array(z.string()),
});

type FormSchema = z.infer<typeof formSchema>;

export function UserInviteDialog({
  open,
  onOpenChange,
}: UserInviteDialogProps) {
  const [openDepts, setOpenDepts] = useState(false);
  const [openRoles, setOpenRoles] = useState(false);
  const { igrpToast } = useIGRPToast();

  const { mutateAsync: userInvite, isPending: isInviting } = useInviteUser();
  const { mutateAsync: addUserRole } = useAddUserRole();

  const form = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
    mode: "onChange",
    defaultValues: {
      email: "",
      departmentCode: undefined,
      roleNames: [] as string[],
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        email: "",
        departmentCode: undefined,
        roleNames: [] as string[],
      });
    }
  }, [open, form]);

  const selectedDeptCode = form.watch("departmentCode");

  const {
    data: depts,
    isLoading: deptLoading,
    error: deptError,
  } = useDepartments();
  const {
    data: roles,
    isLoading: rolesLoading,
    error: rolesError,
  } = useRoles({ departmentCode: selectedDeptCode });

  const isValid = form.formState.isValid;
  const isSubmitting = form.formState.isSubmitting;
  const btnDisabled = !isValid || isSubmitting || isInviting;

  const parentValue = form.watch("departmentCode");

  const parentSelected = useMemo(
    () => depts?.find((o) => o.code === parentValue) ?? null,
    [parentValue, depts]
  );

  const onSubmit = async (values: FormSchema) => {
    const { email, roleNames = [] } = values;

    const userPayload: CreateUserRequest = {
      name: email.split("@")[0],
      email: email.trim(),
      status: statusSchema.enum.ACTIVE as Status,
    };

    const promise = userInvite({ user: userPayload }).then(async (created) => {
      const finalId = (created as any)?.id;
      if (finalId && roleNames.length > 0) {
        await addUserRole({ id: finalId, roleNames });
      }
      return finalId;
    });

    igrpToast({
      promise,
      loading: "A enviar convite...",
      success: "Convite enviado com sucesso!",
      error: (err) => `Falha ao convidar: ${String(err)}`,
    });

    try {
      await promise;
      form.reset({
        email: "",
        departmentCode: undefined,
        roleNames: [] as string[],
      });
      onOpenChange(false);
    } catch (error) {
      console.warn(error);
    }
  };

  return (
    <IGRPDialogPrimitive open={open} onOpenChange={onOpenChange}>
      <IGRPDialogContentPrimitive className="sm:max-w-2xl">
        <IGRPDialogHeaderPrimitive>
          <IGRPDialogTitlePrimitive>
            Convidar Utilizador
          </IGRPDialogTitlePrimitive>
          <IGRPDialogDescriptionPrimitive>
            Envie um convite para um novo utilizador.
          </IGRPDialogDescriptionPrimitive>
        </IGRPDialogHeaderPrimitive>

        <IGRPFormPrimitive {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col gap-6"
          >
            <fieldset className="border border-accent p-4 rounded-md space-y-4">
              <legend className="text-base font-semibold px-2 mb-1">
                Informações Gerais
              </legend>

              <IGRPFormFieldPrimitive
                control={form.control}
                name="email"
                render={({ field }) => (
                  <IGRPFormItemPrimitive>
                    <IGRPFormLabelPrimitive>Email *</IGRPFormLabelPrimitive>
                    <IGRPFormControlPrimitive>
                      <IGRPInputPrimitive
                        placeholder="user@example.com"
                        {...field}
                        value={field.value ?? ""}
                      />
                    </IGRPFormControlPrimitive>
                    <IGRPFormMessagePrimitive />
                  </IGRPFormItemPrimitive>
                )}
              />
            </fieldset>

            <fieldset className="border border-accent p-4 rounded-md space-y-4">
              <legend className="text-base font-semibold px-2 mb-1">
                Atribuir Perfis
              </legend>

              <p className="text-xs text-muted-foreground -mt-2">
                Selecione departamento e perfis para o utilizador (opcional).
              </p>

              <IGRPFormFieldPrimitive
                control={form.control}
                name="departmentCode"
                render={({ field }) => {
                  const placeholder = "Selecionar departamento";
                  const isDeptDisabled =
                    deptLoading || !!deptError || (depts?.length ?? 0) === 0;

                  return (
                    <IGRPFormItemPrimitive>
                      <IGRPFormLabelPrimitive>
                        Departamento
                      </IGRPFormLabelPrimitive>

                      <IGRPPopoverPrimitive
                        open={openDepts}
                        onOpenChange={setOpenDepts}
                      >
                        <IGRPPopoverTriggerPrimitive asChild>
                          <IGRPButtonPrimitive
                            type="button"
                            variant="outline"
                            disabled={isDeptDisabled}
                            className={cn(
                              "w-full justify-between",
                              !field.value && "text-muted-foreground"
                            )}
                            aria-expanded={openDepts}
                          >
                            <span className="truncate">
                              {parentSelected ? parentSelected.name : placeholder}
                            </span>
                            <IGRPIcon
                              iconName={openDepts ? "ChevronUp" : "ChevronDown"}
                            />
                          </IGRPButtonPrimitive>
                        </IGRPPopoverTriggerPrimitive>

                        <IGRPPopoverContentPrimitive
                          className="p-0 w-[--radix-popover-trigger-width]"
                          align="start"
                        >
                          <IGRPCommandPrimitive>
                            <IGRPCommandInputPrimitive placeholder="Procurar..." />
                            <IGRPCommandListPrimitive className="max-h-64">
                              <IGRPCommandEmptyPrimitive>
                                Departamento não encontrado.
                              </IGRPCommandEmptyPrimitive>

                              <IGRPCommandItemPrimitive
                                key="__none__"
                                onSelect={() => {
                                  field.onChange("");
                                  setOpenDepts(false);
                                }}
                                className="flex items-center gap-2"
                              >
                                {!field.value ? (
                                  <IGRPIcon iconName="Check" className="size-4" />
                                ) : (
                                  <span className="w-4" />
                                )}
                                <span>Nenhum</span>
                              </IGRPCommandItemPrimitive>

                              {depts?.map((opt) => (
                                <IGRPCommandItemPrimitive
                                  key={opt.code}
                                  onSelect={() => {
                                    form.setValue("departmentCode", opt.code, {
                                      shouldValidate: true,
                                    });
                                    form.setValue("roleNames", [] as string[], {
                                      shouldValidate: true,
                                    });
                                    setOpenDepts(false);
                                  }}
                                  className="flex items-center gap-2"
                                >
                                  {field.value === opt.code ? (
                                    <IGRPIcon iconName="Check" className="size-4" />
                                  ) : (
                                    <span className="w-4" />
                                  )}
                                  <span>{opt.name}</span>
                                </IGRPCommandItemPrimitive>
                              ))}
                            </IGRPCommandListPrimitive>
                          </IGRPCommandPrimitive>
                        </IGRPPopoverContentPrimitive>
                      </IGRPPopoverPrimitive>

                      <IGRPFormMessagePrimitive>
                        {deptError ? deptError.message : null}
                      </IGRPFormMessagePrimitive>
                    </IGRPFormItemPrimitive>
                  );
                }}
              />

              <IGRPFormFieldPrimitive
                control={form.control}
                name="roleNames"
                render={({ field }) => {
                  const isDisabled =
                    !selectedDeptCode || (roles?.length ?? 0) === 0;
                  const selectedCodes = new Set(field.value ?? []);

                  const toggle = (code: string) => {
                    const next = new Set(selectedCodes);
                    if (next.has(code)) next.delete(code);
                    else next.add(code);
                    form.setValue("roleNames", Array.from(next), {
                      shouldValidate: true,
                      shouldDirty: true,
                    });
                  };

                  const selectedRoleNames =
                    roles?.filter((role) => selectedCodes.has(role.code)) ?? [];

                  const label =
                    selectedCodes.size === 0
                      ? isDisabled
                        ? "Selecione um departamento"
                        : "Selecionar perfis"
                      : selectedCodes.size === 1
                      ? selectedRoleNames[0]?.name ?? "1 perfil"
                      : `${selectedCodes.size} perfis selecionados`;

                  return (
                    <IGRPFormItemPrimitive>
                      <IGRPFormLabelPrimitive>Perfis</IGRPFormLabelPrimitive>
                      <IGRPPopoverPrimitive
                        open={openRoles}
                        onOpenChange={setOpenRoles}
                      >
                        <IGRPPopoverTriggerPrimitive asChild>
                          <IGRPFormControlPrimitive>
                            <IGRPButtonPrimitive
                              type="button"
                              variant="outline"
                              disabled={isDisabled}
                              className={cn(
                                "w-full justify-between",
                                selectedCodes.size === 0 && "text-muted-foreground"
                              )}
                            >
                              <span className="truncate">{label}</span>
                              <IGRPIcon iconName="ChevronsUpDown" />
                            </IGRPButtonPrimitive>
                          </IGRPFormControlPrimitive>
                        </IGRPPopoverTriggerPrimitive>

                        <IGRPPopoverContentPrimitive
                          className="w-[--radix-popover-trigger-width] p-0"
                          align="start"
                        >
                          <IGRPCommandPrimitive>
                            <IGRPCommandInputPrimitive placeholder="Procurar..." />
                            <IGRPCommandListPrimitive>
                              <IGRPCommandEmptyPrimitive>
                                Nenhum perfil encontrado.
                              </IGRPCommandEmptyPrimitive>
                              <IGRPCommandGroupPrimitive>
                                {roles?.map((role) => {
                                  const checked = selectedCodes.has(role.code);
                                  return (
                                    <IGRPCommandItemPrimitive
                                      key={role.code}
                                      value={role.name}
                                      onSelect={() => toggle(role.code)}
                                    >
                                      <IGRPIcon
                                        iconName="Check"
                                        className={cn(
                                          "mr-2",
                                          checked ? "opacity-100" : "opacity-0"
                                        )}
                                      />
                                      {role.name}
                                    </IGRPCommandItemPrimitive>
                                  );
                                })}
                              </IGRPCommandGroupPrimitive>
                            </IGRPCommandListPrimitive>
                          </IGRPCommandPrimitive>
                        </IGRPPopoverContentPrimitive>
                      </IGRPPopoverPrimitive>

                      <IGRPFormMessagePrimitive>
                        {rolesError ? rolesError.message : null}
                      </IGRPFormMessagePrimitive>

                      {selectedRoleNames.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {selectedRoleNames.map((role) => (
                            <span
                              key={role.code}
                              className="inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-1 text-xs"
                            >
                              {role.name}
                              <button
                                type="button"
                                className="opacity-60 hover:opacity-100"
                                onClick={() => toggle(role.code)}
                                aria-label={`Remover ${role.name}`}
                              >
                                ×
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </IGRPFormItemPrimitive>
                  );
                }}
              />
            </fieldset>

            <IGRPDialogFooterPrimitive>
              <IGRPButtonPrimitive
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isInviting}
                type="button"
              >
                Cancelar
              </IGRPButtonPrimitive>
              <IGRPButtonPrimitive type="submit" disabled={btnDisabled}>
                {isInviting ? "A enviar..." : "Enviar Convite"}
              </IGRPButtonPrimitive>
            </IGRPDialogFooterPrimitive>
          </form>
        </IGRPFormPrimitive>
      </IGRPDialogContentPrimitive>
    </IGRPDialogPrimitive>
  );
}