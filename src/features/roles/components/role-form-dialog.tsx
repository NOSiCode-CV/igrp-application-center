import { useEffect, useMemo } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  Button,
  Dialog,
  DialogContent,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
  useIGRPToast,
} from "@igrp/igrp-framework-react-design-system";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";

import {
  useCreateRole,
  useUpdateRole,
} from "@/features/departments/use-departments";
import { useServerErrorMessage } from "@/i18n/server-error";
import { useStatusOptions } from "@/i18n/status";
import { statusSchema } from "@/schemas/global";

import {
  type CreateRoleArgs,
  makeRoleSchemas,
  normalizeRole,
  type RoleArgs,
  type UpdateRoleArgs,
} from "../role-schemas";

const emptyRoleValues = {
  name: "",
  description: null,
  parentCode: "",
  code: "",
  status: statusSchema.enum.ACTIVE,
} satisfies Omit<CreateRoleArgs, "departmentCode">;

interface RoleFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  departmentCode: string;
  role?: RoleArgs;
  parentRoleName?: string | null;
  roles?: RoleArgs[];
}

export function RoleFormDialog({
  open,
  onOpenChange,
  departmentCode,
  role,
  parentRoleName,
}: RoleFormDialogProps) {
  const t = useTranslations("roles.form");
  const serverError = useServerErrorMessage();
  const tv = useTranslations("roles.validation");
  const statusOptions = useStatusOptions();
  const { createRoleSchema, updateRoleSchema } = useMemo(
    () => makeRoleSchemas(tv),
    [tv],
  );
  const { mutateAsync: createRole, isPending: isCreating } = useCreateRole();
  const { mutateAsync: updateRole, isPending: isUpdating } = useUpdateRole();

  const { igrpToast } = useIGRPToast();
  const isEdit = !!role;
  const isSubRole = !!parentRoleName;

  const form = useForm<CreateRoleArgs>({
    resolver: zodResolver(createRoleSchema),
    defaultValues: {
      ...emptyRoleValues,
      departmentCode: departmentCode ?? "",
    },
  });

  useEffect(() => {
    if (!open) return;

    if (role) {
      form.reset({
        name: role.name ?? "",
        description: role.description ?? null,
        departmentCode: departmentCode ?? "",
        parentCode: role.parentCode ?? null,
        code: role.code ?? "",
        status: role.status ?? statusSchema.enum.ACTIVE,
      } as CreateRoleArgs);
    } else {
      form.reset({
        name: "",
        description: null,
        departmentCode: departmentCode ?? "",
        parentCode: parentRoleName ?? "",
        code: "",
        status: statusSchema.enum.ACTIVE,
      } as CreateRoleArgs);
    }
  }, [open, role, parentRoleName, departmentCode, form]);

  const isLoading = isCreating || isUpdating || form.formState.isSubmitting;

  const onSubmit = async (values: CreateRoleArgs) => {
    try {
      if (isEdit && role) {
        const parsed = updateRoleSchema.parse({
          ...values,
        } as UpdateRoleArgs);

        const payload = normalizeRole(parsed as RoleArgs);

        const result = await updateRole({
          departmentCode: role.departmentCode,
          roleCode: role.code,
          role: payload,
        });

        if (!result.success) {
          throw new Error(result.error);
        }

        igrpToast({
          type: "success",
          title: t("toast.updatedTitle"),
          description: t("toast.updatedDescription"),
        });
      } else {
        const payload = normalizeRole(values);
        const result = await createRole({ departmentCode, role: payload });

        if (!result.success) {
          throw new Error(result.error);
        }

        igrpToast({
          type: "success",
          title: t("toast.createdTitle"),
          description: t("toast.createdDescription"),
        });
      }

      form.reset({
        ...emptyRoleValues,
        departmentCode: departmentCode ?? "",
      });
      onOpenChange(false);
    } catch (error) {
      console.error("Falha ao adicionar perfil:", error);
      igrpToast({
        type: "error",
        title: t("toast.errorTitle"),
        description: t("toast.errorDescription", {
          error:
            error instanceof Error ? serverError(error.message) : String(error),
        }),
      });
    }
  };

  const _setDefaultFromName = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    form.setValue("name", name);

    if (!role || form.getValues("code") === "") {
      const code = name
        .toUpperCase()
        .replace(/[^\w\s-]/g, "")
        .replace(/\s+/g, "_");
      form.setValue("code", code);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? t("titleEdit") : t("titleCreate")}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col gap-4"
          >
            {isSubRole && (
              <div className="p-3 rounded-md bg-muted/50 border text-sm text-muted-foreground flex items-center gap-2">
                <IGRPIcon iconName="Info" aria-hidden className="size-4" />
                <span>
                  {t.rich("subRoleOf", {
                    parent: parentRoleName,
                    strong: (chunks) => (
                      <strong className="text-foreground">{chunks}</strong>
                    ),
                  })}
                </span>
              </div>
            )}

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("name")}</FormLabel>
                  <FormControl>
                    <Input placeholder={t("namePlaceholder")} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("code")}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t("codePlaceholder")}
                      disabled={isEdit}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("description")}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={t("descriptionPlaceholder")}
                      className="resize-none"
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("status")}</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t("statusPlaceholder")} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {statusOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                type="button"
                disabled={isLoading}
              >
                {t("cancel")}
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <IGRPIcon
                      iconName="LoaderCircle"
                      aria-hidden
                      className="mr-2 h-4 w-4 animate-spin motion-reduce:animate-none"
                    />
                    {isEdit ? t("saving") : t("creating")}
                  </>
                ) : isEdit ? (
                  t("save")
                ) : (
                  t("create")
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
