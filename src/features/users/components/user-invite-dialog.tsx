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
  IGRPSeparatorPrimitive,
  useIGRPToast,
} from "@igrp/igrp-framework-react-design-system";
import { useEffect, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { useDepartments } from "@/features/departments/use-departments";
import { useRoles } from "@/features/roles/use-roles";
import { cn } from "@/lib/utils";
import { statusSchema } from "@/schemas/global";
import { useAddUserRole, useInviteUser } from "../use-users";
import {
  type CreateUserArgs,
  type FormSchema,
  type FormUserArgs,
  formSchema,
} from "../user-schema";

interface UserInviteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const EMPTY_USER: FormUserArgs = { name: "", email: "" };

function deriveUsernameFromEmail(email: string) {
  const local = email.split("@")[0].trim();
  return local.slice(0, 50);
}

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
    // isLoading: rolesLoading,
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
        title: "Complete o utilizador atual antes de adicionar outro.",
      });
    }
  };

  const onSubmit = async (values: FormSchema) => {
    // const { users, roleNames } = values;
    // const inviteAll = Promise.all(
    //   users.map(async (raw) => {
    //     const username = deriveUsernameFromEmail(raw.email);
    //     const userPayload: CreateUserArgs = {
    //       name: raw.name.trim(),
    //       username,
    //       email: raw.email.trim(),
    //       status: statusSchema.enum.ACTIVE,
    //     };
    //     const created = await userInvite({ user: userPayload });
    //     const finalUsername = (created as any)?.username ?? username;
    //     if (finalUsername && roleNames?.length) {
    //       await addUserRole({ username: finalUsername, roleNames });
    //     }
    //     return finalUsername;
    //   }),
    // );
    // igrpToast({
    //   promise: inviteAll,
    //   loading: `A convidar ${users.length} utilizador${users.length > 1 ? "es" : ""}...`,
    //   success: `Convite enviado para ${users.length} utilizador${users.length > 1 ? "es" : ""}!`,
    //   error: (err) => `Falha ao convidar: ${String(err)}`,
    // });
    // try {
    //   await inviteAll;
    //   form.reset({
    //     users: [EMPTY_USER],
    //     departmentCode: undefined,
    //     roleNames: [],
    //   });
    //   onOpenChange(false);
    // } catch (error) {
    //   console.warn(error);
    // }
  };

  return (
    <IGRPDialogPrimitive open={open} onOpenChange={onOpenChange}>
      <IGRPDialogContentPrimitive className="sm:min-w-2xl max-h-[90vh] overflow-y-auto">
        <IGRPDialogHeaderPrimitive>
          <IGRPDialogTitlePrimitive>
            Convidar Utilizador(es)
          </IGRPDialogTitlePrimitive>
          <IGRPDialogDescriptionPrimitive>
            Envie convites para múltiplos utilizadores. Todos poderão partilhar
            o mesmo departamento e os mesmos roles atribuídos.
          </IGRPDialogDescriptionPrimitive>
        </IGRPDialogHeaderPrimitive>

        <IGRPFormPrimitive {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col gap-6"
          >
            <div className="flex flex-col gap-4">
              <IGRPCardPrimitive>
                <IGRPCardContentPrimitive className="flex flex-col gap-4">
                  <h3 className="text-sm font-medium">Utilizador(es)</h3>
                  {fields.map((field, index) => (
                    <div key={field.id} className="flex gap-2">
                      <IGRPFormFieldPrimitive
                        control={form.control}
                        name={`users.${index}.name`}
                        render={({ field }) => (
                          <IGRPFormItemPrimitive className="flex flex-col">
                            <IGRPFormLabelPrimitive>
                              Nome
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

                      <IGRPFormFieldPrimitive
                        control={form.control}
                        name={`users.${index}.email`}
                        render={({ field }) => (
                          <IGRPFormItemPrimitive className="flex flex-col">
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

                      {/* Remove */}
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
                  ))}

                  <IGRPButtonPrimitive
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddRow}
                    className="mt-2"
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

              <IGRPSeparatorPrimitive />

              <IGRPCardPrimitive>
                <IGRPCardContentPrimitive className="space-y-4">
                  <h3 className="text-sm font-medium">Permissões</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Selecione o departamento e roles para todos os convidados.
                  </p>

                  <IGRPFormFieldPrimitive
                    control={form.control}
                    name="departmentCode"
                    render={({ field }) => {
                      const isDeptDisabled =
                        deptLoading ||
                        !!deptError ||
                        (depts?.length ?? 0) === 0;
                      return (
                        <IGRPFormItemPrimitive className="flex flex-col">
                          <IGRPFormLabelPrimitive>
                            Departamento
                          </IGRPFormLabelPrimitive>
                          <IGRPPopoverPrimitive
                            open={openDepts}
                            onOpenChange={setOpenDepts}
                          >
                            <IGRPPopoverTriggerPrimitive asChild>
                              <IGRPFormControlPrimitive>
                                <IGRPButtonPrimitive
                                  variant="outline"
                                  role="combobox"
                                  disabled={isDeptDisabled}
                                  className={cn(
                                    "w-full justify-between",
                                    !field.value && "text-muted-foreground",
                                  )}
                                >
                                  {deptLoading ? (
                                    <span className="flex items-center gap-2">
                                      <IGRPIcon
                                        iconName="Loader"
                                        className="animate-spin h-4 w-4 mr-2"
                                        strokeWidth={2}
                                      />
                                      A carregar departamentos...
                                    </span>
                                  ) : field.value ? (
                                    depts?.find((d) => d.code === field.value)
                                      ?.name
                                  ) : deptError ? (
                                    "Erro ao carregar departamentos"
                                  ) : isDeptDisabled ? (
                                    "Sem departamentos"
                                  ) : (
                                    "Selecionar departamento"
                                  )}
                                  {!deptLoading && (
                                    <IGRPIcon
                                      iconName="ChevronsUpDown"
                                      className="ml-2 shrink-0 opacity-50"
                                      strokeWidth={2}
                                    />
                                  )}
                                </IGRPButtonPrimitive>
                              </IGRPFormControlPrimitive>
                            </IGRPPopoverTriggerPrimitive>
                            <IGRPPopoverContentPrimitive className="w-[--radix-popover-trigger-width] p-0">
                              <IGRPCommandPrimitive>
                                <IGRPCommandInputPrimitive placeholder="Procurar departamento..." />
                                <IGRPCommandListPrimitive>
                                  <IGRPCommandEmptyPrimitive>
                                    Nenhum departamento encontrado.
                                  </IGRPCommandEmptyPrimitive>
                                  <IGRPCommandGroupPrimitive>
                                    {depts?.map((dept) => (
                                      <IGRPCommandItemPrimitive
                                        value={dept.code}
                                        key={dept.code}
                                        onSelect={() => {
                                          form.setValue(
                                            "departmentCode",
                                            dept.code,
                                            {
                                              shouldValidate: true,
                                            },
                                          );
                                          form.setValue("roleNames", [], {
                                            shouldValidate: true,
                                          });
                                          setOpenDepts(false);
                                        }}
                                      >
                                        <IGRPIcon
                                          iconName="Check"
                                          className={cn(
                                            "mr-2",
                                            dept.code === field.value
                                              ? "opacity-100"
                                              : "opacity-0",
                                          )}
                                        />
                                        {dept.name}
                                      </IGRPCommandItemPrimitive>
                                    ))}
                                  </IGRPCommandGroupPrimitive>
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

                  {/* Roles (multi-select) */}
                  <IGRPFormFieldPrimitive
                    control={form.control}
                    name="roleNames"
                    render={({ field }) => {
                      const isDisabled =
                        !selectedDeptCode || (roles?.length ?? 0) === 0;
                      const selected = new Set(field.value ?? ([] as string[]));

                      const toggle = (name: string) => {
                        const next = new Set(selected);
                        if (next.has(name)) next.delete(name);
                        else next.add(name);
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

                      const label =
                        selected.size === 0
                          ? isDisabled
                            ? "Selecione um departamento"
                            : "Selecionar roles"
                          : selected.size === 1
                            ? Array.from(selected)[0]
                            : `${selected.size} roles selecionados`;

                      return (
                        <IGRPFormItemPrimitive className="flex flex-col">
                          <IGRPFormLabelPrimitive>
                            Perfís
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
                                    selected.size === 0 &&
                                      "text-muted-foreground",
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
                                      const checked = selected.has(role.name);
                                      return (
                                        <IGRPCommandItemPrimitive
                                          key={role.name}
                                          value={role.name}
                                          onSelect={(val) => {
                                            toggle(val);
                                          }}
                                        >
                                          <IGRPIcon
                                            iconName="Check"
                                            className={cn(
                                              "mr-2",
                                              checked
                                                ? "opacity-100"
                                                : "opacity-0",
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
                                      size="icon"
                                      onClick={() => setOpenRoles(false)}
                                      disabled={selected.size === 0}
                                    >
                                      <IGRPIcon iconName="CirclePlus" />
                                    </IGRPButtonPrimitive>
                                    <IGRPButtonPrimitive
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      onClick={clearAll}
                                    >
                                      <IGRPIcon iconName="CircleX" />
                                    </IGRPButtonPrimitive>
                                  </div>
                                </IGRPCommandListPrimitive>
                              </IGRPCommandPrimitive>
                            </IGRPPopoverContentPrimitive>
                          </IGRPPopoverPrimitive>

                          <IGRPFormMessagePrimitive>
                            {rolesError ? rolesError.message : null}
                          </IGRPFormMessagePrimitive>

                          {selected.size > 0 && (
                            <div className="mt-2 flex flex-wrap gap-2">
                              {Array.from(selected).map((r) => (
                                <span
                                  key={r}
                                  className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs"
                                >
                                  {r}
                                  <button
                                    type="button"
                                    className="opacity-60 hover:opacity-100"
                                    onClick={() => toggle(r)}
                                    aria-label={`Remover ${r}`}
                                    title={`Remover ${r}`}
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
                {isInviting ? "A enviar convites..." : "Enviar convites"}
              </IGRPButtonPrimitive>
            </IGRPDialogFooterPrimitive>
          </form>
        </IGRPFormPrimitive>
      </IGRPDialogContentPrimitive>
    </IGRPDialogPrimitive>
  );
}
