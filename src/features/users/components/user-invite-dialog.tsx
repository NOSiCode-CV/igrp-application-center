"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  IGRPButtonPrimitive,
  IGRPCardContentPrimitive,
  IGRPCardPrimitive,
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
import { useFieldArray, useForm } from "react-hook-form";
import { useDepartments } from "@/features/departments/use-departments";
import { useRoles } from "@/features/roles/use-roles";
import { cn } from "@/lib/utils";
import { statusSchema } from "@/schemas/global";
import { useAddUserRole, useInviteUser } from "../use-users";
import { type FormSchema, type FormUserArgs, formSchema } from "../user-schema";

interface UserInviteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const EMPTY_USER: FormUserArgs = { name: "", email: "" };

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
      users: [EMPTY_USER],
      departmentCode: undefined,
      roleNames: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "users",
  });

  useEffect(() => {
    if (open) {
      form.reset({
        users: [EMPTY_USER],
        departmentCode: undefined,
        roleNames: [],
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

  const handleAddRow = async () => {
    const lastIndex = fields.length - 1;
    const ok =
      lastIndex < 0
        ? true
        : await form.trigger([
            `users.${lastIndex}.name`,
            `users.${lastIndex}.email`,
          ]);
    if (ok) {
      append({ ...EMPTY_USER });
    } else {
      igrpToast({
        type: "warning",
        title:
          "Complete as informações do utilizador atual antes de adicionar outro.",
      });
    }
  };

  const parentValue = form.watch("departmentCode");

  const parentSelected = useMemo(
    () => depts?.find((o) => o.code === parentValue) ?? null,
    [parentValue, depts]
  );

  const onSubmit = async (values: FormSchema) => {
    const { users, roleNames } = values;
    const inviteAll = Promise.all(
      users.map(async (raw) => {
        const userPayload: CreateUserRequest = {
          name: raw.name.trim(),
          email: raw.email.trim(),
          status: statusSchema.enum.ACTIVE as Status,
        };

        const created = await userInvite({ user: userPayload });
        const finalId = (created as any)?.id;
        if (finalId && roleNames?.length) {
          await addUserRole({ id: finalId, roleNames });
        }
        return finalId;
      }),
    );
    igrpToast({
      promise: inviteAll,
      loading: `A convidar ${users.length} utilizador${users.length > 1 ? "es" : ""}...`,
      success: `Convite enviado para ${users.length} utilizador${users.length > 1 ? "es" : ""}!`,
      error: (err) => `Falha ao convidar: ${String(err)}`,
    });
    try {
      await inviteAll;
      form.reset({
        users: [EMPTY_USER],
        departmentCode: undefined,
        roleNames: [],
      });
      onOpenChange(false);
    } catch (error) {
      console.warn(error);
    }
  };

  return (
    <IGRPDialogPrimitive open={open} onOpenChange={onOpenChange}>
      <IGRPDialogContentPrimitive className="sm:min-w-2xl max-h-[90vh] overflow-y-auto">
        <IGRPDialogHeaderPrimitive>
          <IGRPDialogTitlePrimitive>
            Convidar Utilizador(es)
          </IGRPDialogTitlePrimitive>
          <IGRPDialogDescriptionPrimitive>
            Envie convites para múltiplos utilizadores.
          </IGRPDialogDescriptionPrimitive>
        </IGRPDialogHeaderPrimitive>

        <IGRPFormPrimitive {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col gap-6"
          >
            <div className="flex flex-col gap-4">
              <IGRPCardPrimitive className="py-3">
                <IGRPCardContentPrimitive className="flex flex-col gap-4">
                  <h3 className="text-sm font-medium">Utilizador(es)</h3>

                  {fields.map((field, index) => (
                    <div className="flex flex-col gap-2">
                      <div className="flex w-full">
                        <IGRPFormFieldPrimitive
                          control={form.control}
                          name={`users.${index}.name`}
                          render={({ field }) => (
                            <IGRPFormItemPrimitive className="flex w-full flex-col">
                              <IGRPFormLabelPrimitive>
                                Nome Completo
                              </IGRPFormLabelPrimitive>
                              <IGRPFormControlPrimitive>
                                <IGRPInputPrimitive
                                  placeholder="Nome completo"
                                  {...field}
                                  value={field.value ?? ""}
                                />
                              </IGRPFormControlPrimitive>
                              <IGRPFormMessagePrimitive />
                            </IGRPFormItemPrimitive>
                          )}
                        />
                      </div>
                      <div
                        key={field.id}
                        className="mt-3 flex justify-between gap-1"
                      >

                        <IGRPFormFieldPrimitive
                          control={form.control}
                          name={`users.${index}.email`}
                          render={({ field }) => (
                            <IGRPFormItemPrimitive className="flex-1 flex-col">
                              <IGRPFormLabelPrimitive>
                                Email
                              </IGRPFormLabelPrimitive>
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

                        <div className="flex flex-col gap-2">
                          <IGRPFormLabelPrimitive className="invisible">
                            Remover
                          </IGRPFormLabelPrimitive>
                          <IGRPButtonPrimitive
                            type="button"
                            variant="destructive"
                            size="icon"
                            onClick={() => remove(index)}
                            disabled={fields.length === 1}
                            aria-label="Remover utilizador"
                            title="Remover utilizador"
                          >
                            <IGRPIcon iconName="Trash2" strokeWidth={2} />
                          </IGRPButtonPrimitive>
                        </div>
                      </div>
                    </div>
                  ))}

                  <IGRPButtonPrimitive
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddRow}
                  >
                    <IGRPIcon
                      iconName="CirclePlus"
                      className="text-primary"
                      strokeWidth={2}
                    />
                    Adicionar utilizador
                  </IGRPButtonPrimitive>
                </IGRPCardContentPrimitive>
              </IGRPCardPrimitive>

              <IGRPCardPrimitive className="py-3">
                <IGRPCardContentPrimitive className="flex flex-col gap-4">
                  <div>
                    <h3 className="text-sm font-medium">Perfis</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Selecione o departamento e roles para todos os convidados.
                    </p>
                  </div>

                  <IGRPFormFieldPrimitive
                    control={form.control}
                    name="departmentCode"
                    render={({ field }) => {
                      const placeholder = "Selecionar departamento…";
                      const isDeptDisabled =
                        deptLoading ||
                        !!deptError ||
                        (depts?.length ?? 0) === 0;

                      return (
                        <IGRPFormItemPrimitive>
                          <IGRPFormLabelPrimitive>
                            Departamento
                          </IGRPFormLabelPrimitive>

                          <IGRPPopoverPrimitive
                            open={openDepts}
                            onOpenChange={(next) => {
                              setOpenDepts(next);
                            }}
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
                                  {parentSelected
                                    ? parentSelected.name
                                    : placeholder}
                                </span>
                                <IGRPIcon
                                  iconName={
                                    openDepts ? "ChevronUp" : "ChevronDown"
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
                                      setOpenDepts(false);
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

                                  {depts?.map((opt) => (
                                    <IGRPCommandItemPrimitive
                                      key={opt.code}
                                      onSelect={() => {
                                        form.setValue(
                                          "departmentCode",
                                          opt.code,
                                          {
                                            shouldValidate: true,
                                          }
                                        );
                                        form.setValue("roleNames", [], {
                                          shouldValidate: true,
                                        });
                                        setOpenDepts(false);
                                      }}
                                      aria-selected={field.value === opt.code}
                                      className="flex items-center gap-2"
                                    >
                                      {field.value === opt.code ? (
                                        <IGRPIcon
                                          iconName="Check"
                                          className="size-4 shrink-0"
                                        />
                                      ) : (
                                        <span className="w-4" />
                                      )}
                                      <span className="truncate">
                                        {opt.name}
                                      </span>
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
                      const selectedCodes = new Set(
                        field.value ?? ([] as string[])
                      );

                      const toggle = (code: string) => {
                        const next = new Set(selectedCodes);
                        if (next.has(code)) next.delete(code);
                        else next.add(code);
                        form.setValue("roleNames", Array.from(next), {
                          shouldValidate: true,
                          shouldDirty: true,
                        });
                      };

                      const clearAll = () => {
                        form.setValue("roleNames", [], {
                          shouldValidate: true,
                          shouldDirty: true,
                        });
                      };

                      const selectedRoleNames =
                        roles
                          ?.filter((role) => selectedCodes.has(role.code))
                          .map((role) => role.name) ?? [];

                      const label =
                        selectedCodes.size === 0
                          ? isDisabled
                            ? "Selecione um departamento"
                            : "Selecionar perfis"
                          : selectedCodes.size === 1
                          ? selectedRoleNames[0]
                          : `${selectedCodes.size} perfis selecionados`;

                      return (
                        <IGRPFormItemPrimitive className="flex flex-col">
                          <IGRPFormLabelPrimitive>
                            Perfis
                          </IGRPFormLabelPrimitive>
                          <IGRPPopoverPrimitive
                            open={openRoles}
                            onOpenChange={setOpenRoles}
                          >
                            <IGRPPopoverTriggerPrimitive asChild>
                              <IGRPFormControlPrimitive>
                                <IGRPButtonPrimitive
                                  variant="outline"
                                  role="combobox"
                                  disabled={isDisabled}
                                  className={cn(
                                    "w-full justify-between",
                                    selectedCodes.size === 0 &&
                                      "text-muted-foreground"
                                  )}
                                >
                                  <span className="truncate">{label}</span>
                                  <IGRPIcon
                                    iconName="ChevronsUpDown"
                                    className="ml-2 shrink-0 opacity-50"
                                    strokeWidth={2}
                                  />
                                </IGRPButtonPrimitive>
                              </IGRPFormControlPrimitive>
                            </IGRPPopoverTriggerPrimitive>

                            <IGRPPopoverContentPrimitive
                              className="w-[--radix-popover-trigger-width] p-0"
                              align="start"
                            >
                              <IGRPCommandPrimitive>
                                <IGRPCommandInputPrimitive placeholder="Procurar perfil..." />
                                <IGRPCommandListPrimitive>
                                  <IGRPCommandEmptyPrimitive>
                                    Nenhum perfil encontrado.
                                  </IGRPCommandEmptyPrimitive>
                                  <IGRPCommandGroupPrimitive>
                                    {roles?.map((role) => {
                                      const checked = selectedCodes.has(
                                        role.code
                                      );
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
                                              checked
                                                ? "opacity-100"
                                                : "opacity-0"
                                            )}
                                          />
                                          {role.name}
                                        </IGRPCommandItemPrimitive>
                                      );
                                    })}
                                  </IGRPCommandGroupPrimitive>

                                  <div className="flex items-center justify-between px-2 py-2 border-t">
                                    <IGRPButtonPrimitive
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={clearAll}
                                      disabled={selectedCodes.size === 0}
                                    >
                                      Limpar
                                    </IGRPButtonPrimitive>
                                  </div>
                                </IGRPCommandListPrimitive>
                              </IGRPCommandPrimitive>
                            </IGRPPopoverContentPrimitive>
                          </IGRPPopoverPrimitive>

                          <IGRPFormMessagePrimitive>
                            {rolesError ? rolesError.message : null}
                          </IGRPFormMessagePrimitive>

                          {selectedRoleNames.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-2">
                              {roles
                                ?.filter((role) => selectedCodes.has(role.code))
                                .map((role) => (
                                  <span
                                    key={role.code}
                                    className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs"
                                  >
                                    {role.name}
                                    <button
                                      type="button"
                                      className="opacity-60 hover:opacity-100"
                                      onClick={() => toggle(role.code)}
                                      aria-label={`Remover ${role.name}`}
                                      title={`Remover ${role.name}`}
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
                </IGRPCardContentPrimitive>
              </IGRPCardPrimitive>
            </div>

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
                {isInviting ? "A enviar convites..." : "Convidar"}
              </IGRPButtonPrimitive>
            </IGRPDialogFooterPrimitive>
          </form>
        </IGRPFormPrimitive>
      </IGRPDialogContentPrimitive>
    </IGRPDialogPrimitive>
  );
}
