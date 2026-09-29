"use client";

import { useEffect, useMemo, useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  Button,
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
  cn,
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
  IGRPCombobox,
  IGRPIcon,
  Input,
  Popover,
  PopoverContent,
  PopoverTrigger,
  useIGRPToast,
} from "@igrp/igrp-framework-react-design-system";
import type { InviteUserDTO as SdkInviteUserDTO } from "@igrp/platform-access-management-client-ts";
import { useLocale, useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { z } from "zod";

import {
  MultiSelectField,
  type MultiSelectOption,
} from "@/components/multi-select-field";
import {
  useDepartments,
  useRoles,
} from "@/features/departments/use-departments";
import { LOCALE_NATIVE_NAMES, LOCALES } from "@/i18n/config";

import { useInviteUser } from "../use-users";
import type { UsersValidationTranslator } from "../user-schemas";

// TODO(i18n): drop this extension once @igrp/platform-access-management-client-ts
// with `InviteUserDTO.locale` is released.
type InviteUserDTO = SdkInviteUserDTO & { locale?: string };

const LOCALE_OPTIONS = LOCALES.map((value) => ({
  value,
  label: LOCALE_NATIVE_NAMES[value],
}));

interface UserInviteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const makeFormSchema = (t: UsersValidationTranslator) =>
  z.object({
    email: z.email(t("emailInvalid")).min(1, t("emailRequired")),
    departmentCode: z.string().optional(),
    roleCodes: z.array(z.string()),
    locale: z.enum(LOCALES),
  });

type FormSchema = z.infer<ReturnType<typeof makeFormSchema>>;

export function UserInviteDialog({
  open,
  onOpenChange,
}: UserInviteDialogProps) {
  const [openDepts, setOpenDepts] = useState(false);
  const { igrpToast } = useIGRPToast();
  const t = useTranslations("users.invite.form");
  const tv = useTranslations("users.validation");
  const tc = useTranslations("common.actions");
  const formSchema = useMemo(() => makeFormSchema(tv), [tv]);
  // FR-28: the invitee language defaults to the inviter's current locale.
  const currentLocale = useLocale();

  const { mutate: userInvite, isPending: isInviting } = useInviteUser();

  const form = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
    mode: "onChange",
    defaultValues: {
      email: "",
      departmentCode: undefined,
      roleCodes: [] as string[],
      locale: currentLocale,
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        email: "",
        departmentCode: undefined,
        roleCodes: [] as string[],
        locale: currentLocale,
      });
    }
  }, [open, form, currentLocale]);

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
    const { email, roleCodes = [], locale } = values;

    const userPayload: InviteUserDTO = {
      email: email.trim(),
      departmentCode: departmentCode || "",
      roles: roleCodes,
      locale,
    };

    userInvite(
      { user: userPayload },
      {
        onSuccess: (result) => {
          if (!result.success) {
            igrpToast({
              type: "error",
              title: t("toasts.inviteFailed"),
              description: result.error,
            });
            return;
          }
          igrpToast({
            type: "success",
            description: t("toasts.inviteSent"),
          });
          form.reset({
            email: "",
            departmentCode: undefined,
            roleCodes: [] as string[],
            locale: currentLocale,
          });
          onOpenChange(false);
        },
        onError: (error) => {
          const message =
            error instanceof Error
              ? error.message
              : t("toasts.inviteFailedWithReason", { reason: String(error) });
          igrpToast({
            type: "error",
            title: t("toasts.inviteFailed"),
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
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col gap-6"
          >
            <fieldset className="border border-accent p-4 rounded-md flex flex-col gap-4">
              <legend className="text-base font-semibold px-2 mb-1">
                {t("userInfo")}
              </legend>

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>                   
                    <FormLabel>
                      {t("emailLabel")}  
                      <span aria-hidden="true" className="text-destructive">
                        *
                      </span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t("emailPlaceholder")}
                        type="email"
                        aria-required="true"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <IGRPCombobox
                name="locale"
                label={t("localeLabel")}
                placeholder={t("localeLabel")}
                options={LOCALE_OPTIONS}
                showSearch={false}
                required
              />
            </fieldset>

            <fieldset className="border border-accent p-4 rounded-md flex flex-col gap-4">
              <legend className="text-base font-semibold px-2 mb-1">
                {t("assignRoles")}
              </legend>

              <p className="text-xs text-muted-foreground -mt-2">
                {t("assignRolesHint")}
              </p>

              <FormField
                control={form.control}
                name="departmentCode"
                render={({ field }) => {
                  const placeholder = t("departmentPlaceholder");
                  const isDeptDisabled =
                    deptLoading || !!deptError || (depts?.length ?? 0) === 0;

                  return (
                    <FormItem>
                      <FormLabel>{t("departmentLabel")}</FormLabel>

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
                            <CommandInput placeholder={t("search")} />
                            <CommandList className="max-h-64">
                              <CommandEmpty>
                                {t("departmentEmpty")}
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
                                <span>{t("none")}</span>
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
                  const roleOptions: MultiSelectOption[] =
                    roles?.map((role) => ({
                      value: role.code,
                      label: role.name ?? role.code,
                    })) ?? [];

                  return (
                    <FormItem>
                      <FormLabel>Perfis</FormLabel>
                      {isDisabled && (
                        <p className="text-xs text-muted-foreground">
                          {departmentCode
                            ? "Este departamento ainda não tem perfis."
                            : "Escolha primeiro um departamento para ver os perfis disponíveis."}
                        </p>
                      )}
                      <MultiSelectField
                        options={roleOptions}
                        value={field.value ?? []}
                        onChange={field.onChange}
                        disabled={isDisabled}
                        placeholder="Selecionar perfis"
                        searchPlaceholder="Procurar..."
                        emptyLabel={t("rolesEmpty")}
                      />

                      <FormMessage>
                        {rolesError ? rolesError.message : null}
                      </FormMessage>
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
                {tc("cancel")}
              </Button>
              <Button type="submit" disabled={btnDisabled}>
                {isInviting ? t("submitting") : t("submit")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
