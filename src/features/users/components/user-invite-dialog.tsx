"use client";

import { useEffect, useMemo, useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  Button,
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  IGRPIcon,
  Input,
  Popover,
  PopoverContent,
  PopoverTrigger,
  useIGRPToast,
} from "@igrp/igrp-framework-react-design-system";
import type { InviteUserDTO } from "@igrp/platform-access-management-client-ts";
import { useForm } from "react-hook-form";
import { z } from "zod";

import {
  useDepartments,
  useRoles,
} from "@/features/departments/use-departments";
import { cn } from "@/lib/utils";

import { useInviteUser } from "../use-users";

interface UserInviteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const formSchema = z.object({
  email: z.email("Email inválido").min(1, "Email obrigatório"),
  departmentCode: z.string().optional(),
  roleCodes: z.array(z.string()),
});

type FormSchema = z.infer<typeof formSchema>;

export function UserInviteDialog({
  open,
  onOpenChange,
}: UserInviteDialogProps) {
  const [openDepts, setOpenDepts] = useState(false);
  const [openRoles, setOpenRoles] = useState(false);
  const { igrpToast } = useIGRPToast();

  const { mutate: userInvite, isPending: isInviting } = useInviteUser();

  const form = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
    mode: "onChange",
    defaultValues: {
      email: "",
      departmentCode: undefined,
      roleCodes: [] as string[],
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        email: "",
        departmentCode: undefined,
        roleCodes: [] as string[],
      });
    }
  }, [open, form]);

  const departmentCode = form.watch("departmentCode");

  const {
    data: depts,
    isLoading: deptLoading,
    error: deptError,
  } = useDepartments();
  const { data: roles, error: rolesError } = useRoles(departmentCode || "");

  const isValid = form.formState.isValid;
  const btnDisabled = !isValid || isInviting;

  const parentSelected = useMemo(
    () => depts?.find((o) => o.code === departmentCode) ?? null,
    [departmentCode, depts],
  );

  const onSubmit = (values: FormSchema) => {
    const { email, roleCodes = [] } = values;

    const userPayload: InviteUserDTO = {
      email: email.trim(),
      departmentCode: departmentCode || "",
      roles: roleCodes,
    };

    userInvite(
      { user: userPayload },
      {
        onSuccess: (result) => {
          if (!result.success) {
            igrpToast({
              type: "error",
              title: "Falha ao convidar",
              description: result.error,
            });
            return;
          }
          igrpToast({
            type: "success",
            description: "Convite enviado com sucesso!",
          });
          form.reset({
            email: "",
            departmentCode: undefined,
            roleCodes: [] as string[],
          });
          onOpenChange(false);
        },
        onError: (error) => {
          const message =
            error instanceof Error
              ? error.message
              : `Falha ao convidar: ${String(error)}`;
          igrpToast({
            type: "error",
            title: "Falha ao convidar",
            description: message,
          });
        },
      },
    );
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="md:min-w-2xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Convidar Utilizador</DialogTitle>
          <DialogDescription>
            Envie um convite por e-mail para um novo utilizador.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col gap-6"
          >
            <fieldset className="border border-accent p-4 rounded-md flex flex-col gap-4">
              <legend className="text-base font-semibold px-2 mb-1">
                Informação do Utilizador
              </legend>

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>E-mail</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ex: joao@email.com"
                        type="email"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </fieldset>

            <fieldset className="border border-accent p-4 rounded-md flex flex-col gap-4">
              <legend className="text-base font-semibold px-2 mb-1">
                Atribuir Perfis
              </legend>

              <p className="text-xs text-muted-foreground -mt-2">
                Selecione departamento e perfis para o utilizador (opcional).
              </p>

              <FormField
                control={form.control}
                name="departmentCode"
                render={({ field }) => {
                  const placeholder = "Selecionar departamento";
                  const isDeptDisabled =
                    deptLoading || !!deptError || (depts?.length ?? 0) === 0;

                  return (
                    <FormItem>
                      <FormLabel>Departamento</FormLabel>

                      <Popover open={openDepts} onOpenChange={setOpenDepts}>
                        <PopoverTrigger asChild>
                          <Button
                            type="button"
                            variant="outline"
                            disabled={isDeptDisabled}
                            className={cn(
                              "w-full justify-between",
                              !field.value && "text-muted-foreground",
                            )}
                            aria-expanded={openDepts}
                          >
                            <span className="truncate">
                              {parentSelected
                                ? parentSelected.name
                                : placeholder}
                            </span>
                            <IGRPIcon
                              iconName={openDepts ? "ChevronUp" : "ChevronDown"}
                            />
                          </Button>
                        </PopoverTrigger>

                        <PopoverContent
                          className="p-0 w-[--radix-popover-trigger-width]"
                          align="start"
                        >
                          <Command>
                            <CommandInput placeholder="Procurar..." />
                            <CommandList className="max-h-64">
                              <CommandEmpty>
                                Departamento não encontrado.
                              </CommandEmpty>

                              <CommandItem
                                key="__none__"
                                onSelect={() => {
                                  field.onChange("");
                                  setOpenDepts(false);
                                }}
                                className="flex items-center gap-2"
                              >
                                {!field.value ? (
                                  <IGRPIcon
                                    iconName="Check"
                                    className="size-4"
                                  />
                                ) : (
                                  <span className="w-4" />
                                )}
                                <span>Nenhum</span>
                              </CommandItem>

                              {depts?.map((opt) => (
                                <CommandItem
                                  key={opt.code}
                                  onSelect={() => {
                                    form.setValue("departmentCode", opt.code, {
                                      shouldValidate: true,
                                    });
                                    form.setValue("roleCodes", [] as string[], {
                                      shouldValidate: true,
                                    });
                                    setOpenDepts(false);
                                  }}
                                  className="flex items-center gap-2"
                                >
                                  {field.value === opt.code ? (
                                    <IGRPIcon
                                      iconName="Check"
                                      className="size-4"
                                    />
                                  ) : (
                                    <span className="w-4" />
                                  )}
                                  <span>{opt.name}</span>
                                </CommandItem>
                              ))}
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>

                      <FormMessage>
                        {deptError ? deptError.message : null}
                      </FormMessage>
                    </FormItem>
                  );
                }}
              />

              <FormField
                control={form.control}
                name="roleCodes"
                render={({ field }) => {
                  const isDisabled =
                    !departmentCode || (roles?.length ?? 0) === 0;
                  const selectedCodes = new Set(field.value ?? []);

                  const toggle = (code: string) => {
                    const next = new Set(selectedCodes);
                    if (next.has(code)) next.delete(code);
                    else next.add(code);
                    form.setValue("roleCodes", Array.from(next), {
                      shouldValidate: true,
                      shouldDirty: true,
                    });
                  };

                  const selectedroleCodes =
                    roles?.filter((role) => selectedCodes.has(role.code)) ?? [];

                  const label =
                    selectedCodes.size === 0
                      ? isDisabled
                        ? "Selecione um departamento"
                        : "Selecionar perfis"
                      : selectedCodes.size === 1
                        ? (selectedroleCodes[0]?.name ?? "1 perfil")
                        : `${selectedCodes.size} perfis selecionados`;

                  return (
                    <FormItem>
                      <FormLabel>Perfis</FormLabel>
                      <Popover open={openRoles} onOpenChange={setOpenRoles}>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              type="button"
                              variant="outline"
                              disabled={isDisabled}
                              className={cn(
                                "w-full justify-between",
                                selectedCodes.size === 0 &&
                                  "text-muted-foreground",
                              )}
                            >
                              <span className="truncate">{label}</span>
                              <IGRPIcon iconName="ChevronsUpDown" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>

                        <PopoverContent
                          className="w-[--radix-popover-trigger-width] p-0"
                          align="start"
                        >
                          <Command>
                            <CommandInput placeholder="Procurar..." />
                            <CommandList>
                              <CommandEmpty>
                                Nenhum perfil encontrado.
                              </CommandEmpty>
                              <CommandGroup>
                                {roles?.map((role) => {
                                  const checked = selectedCodes.has(role.code);
                                  return (
                                    <CommandItem
                                      key={role.code}
                                      value={role.name}
                                      onSelect={() => toggle(role.code)}
                                    >
                                      <IGRPIcon
                                        iconName="Check"
                                        className={cn(
                                          "mr-2",
                                          checked ? "opacity-100" : "opacity-0",
                                        )}
                                      />
                                      {role.name}
                                    </CommandItem>
                                  );
                                })}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>

                      <FormMessage>
                        {rolesError ? rolesError.message : null}
                      </FormMessage>

                      {selectedroleCodes.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {selectedroleCodes.map((role) => (
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
                    </FormItem>
                  );
                }}
              />
            </fieldset>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isInviting}
                type="button"
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={btnDisabled}>
                {isInviting ? "A enviar..." : "Enviar Convite"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
