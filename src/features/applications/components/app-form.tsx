"use client";

import { useRouter } from "next/navigation";
import { useMemo } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  IGRPButton,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  useIGRPToast,
} from "@igrp/igrp-framework-react-design-system";
import type { ApplicationDTO } from "@igrp/platform-access-management-client-ts";
import { useTranslations } from "next-intl";
import { type Resolver, useForm } from "react-hook-form";

import { LimitedTextareaField } from "@/components/limited-textarea-field";
import {
  type ApplicationFormValues,
  appTypeCrud,
  type CreateApplicationFormValues,
  makeApplicationSchemas,
  normalizeCreateApplication,
  normalizeUpdateApplication,
  type UpdateApplicationFormValues,
} from "@/features/applications/app-schemas";
import {
  useCreateApplication,
  useUpdateApplication,
} from "@/features/applications/use-applications";
import { useStatusOptions } from "@/i18n/status";
import { ROUTES } from "@/lib/constants";

/** Type value → `applications.form.types.*` key. */
const APPLICATION_TYPE_OPTIONS = [
  { value: appTypeCrud.enum.INTERNAL, key: "internal" },
  { value: appTypeCrud.enum.EXTERNAL, key: "external" },
] as const;

interface ApplicationFormProps {
  application?: ApplicationDTO;
  onSuccess: () => void;
}

export function ApplicationForm({
  application,
  onSuccess,
}: ApplicationFormProps) {
  const router = useRouter();
  const t = useTranslations("applications.form");
  const tv = useTranslations("applications.validation");
  const tc = useTranslations("common");
  const baseStatusOptions = useStatusOptions();
  const schemas = useMemo(() => makeApplicationSchemas(tv), [tv]);
  const { igrpToast } = useIGRPToast();
  const { mutateAsync: createApplication } = useCreateApplication();
  const { mutateAsync: updateApplication } = useUpdateApplication();

  const isEdit = !!application;

  const defaultValues = useMemo<ApplicationFormValues>(
    () =>
      application
        ? {
            name: application.name,
            code: application.code,
            owner: application.owner ?? "",
            type: application.type as "INTERNAL" | "EXTERNAL",
            slug: application.slug || "",
            url: application.url || "",
            description: application.description || "",
            status: application.status,
            picture: application.picture || "",
          }
        : {
            name: "",
            code: "",
            owner: "",
            type: appTypeCrud.enum.INTERNAL,
            slug: "",
            url: "",
            description: "",
            status: "ACTIVE",
            picture: "",
          },
    [application],
  );

  const form = useForm<ApplicationFormValues>({
    resolver: zodResolver(
      isEdit
        ? schemas.UpdateApplicationSchema
        : schemas.CreateApplicationSchema,
    ) as Resolver<ApplicationFormValues>,
    defaultValues,
    mode: "onBlur",
    reValidateMode: "onChange",
  });

  const type = form.watch("type");
  const status = form.watch("status");

  // The shared Ativo/Inativo pair. An application already in TEMPORARY would
  // otherwise render an empty trigger with no way back.
  const statusOptions = useMemo(
    () =>
      status === "TEMPORARY"
        ? [
            ...baseStatusOptions,
            { value: "TEMPORARY", label: tc("status.temporary") },
          ]
        : baseStatusOptions,
    [status, baseStatusOptions, tc],
  );

  const onSubmit = async (values: ApplicationFormValues) => {
    try {
      if (isEdit) {
        const payload = normalizeUpdateApplication(
          values as UpdateApplicationFormValues,
        );
        const created = await updateApplication({
          code: application.code,
          data: payload,
        });

        if (!created.success) {
          throw new Error(created.error);
        }

        igrpToast({
          type: "success",
          title: t("toasts.updatedTitle"),
          description: t("toasts.updated"),
        });
      } else {
        const payload = normalizeCreateApplication(
          values as CreateApplicationFormValues,
        );
        await createApplication(payload);

        igrpToast({
          type: "success",
          title: t("toasts.createdTitle"),
          description: t("toasts.created"),
        });

        onSuccess();
        router.push(`${ROUTES.APPLICATIONS}/${values.code}`);
        return;
      }

      onSuccess();
    } catch (error) {
      igrpToast({
        type: "error",
        title: isEdit ? t("toasts.updateError") : t("toasts.createError"),
        description:
          error instanceof Error ? error.message : tc("unknownError"),
      });
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col gap-4"
      >
        <div className="flex flex-col gap-4 max-h-[75vh] overflow-y-auto px-1 pb-2">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {t("name")}
                  <span aria-hidden="true" className="text-destructive">
                    *
                  </span>
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder={t("namePlaceholder")}
                    autoComplete="off"
                    maxLength={255}
                    aria-required="true"
                    className="placeholder:truncate border-primary/30 focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:border-primary/30"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t("code")}
                    <span aria-hidden="true" className="text-destructive">
                      *
                    </span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder={t("codePlaceholder")}
                      autoComplete="off"
                      spellCheck={false}
                      maxLength={255}
                      aria-required="true"
                      className={`uppercase placeholder:truncate placeholder:normal-case border-primary/30 focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:border-primary/30 ${
                        isEdit ? "bg-muted" : ""
                      }`}
                      disabled={isEdit}
                      onChange={(e) => {
                        if (!isEdit) {
                          const v = e.target.value
                            .toUpperCase()
                            .replace(/[^A-Z0-9_-]/g, "");
                          field.onChange(v);
                        }
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("type")}</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value);
                      if (value === "INTERNAL") {
                        form.setValue("url", "");
                      } else {
                        form.setValue("slug", "");
                      }
                    }}
                    value={field.value}
                  >
                    <FormControl className="w-full">
                      <SelectTrigger className="border-primary/30 focus:ring-2 focus:ring-primary/30">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {APPLICATION_TYPE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {t(`types.${option.key}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {type === "INTERNAL" && (
            <FormField
              control={form.control}
              name="slug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t("slug")}{" "}
                    <span aria-hidden="true" className="text-destructive">
                      *
                    </span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value || ""}
                      maxLength={255}
                      aria-required="true"
                      placeholder={t("slugPlaceholder")}
                      className="placeholder:truncate border-primary/30 focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:border-primary/30"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {type === "EXTERNAL" && (
            <FormField
              control={form.control}
              name="url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t("url")}{" "}
                    <span aria-hidden="true" className="text-destructive">
                      *
                    </span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="url"
                      inputMode="url"
                      autoComplete="off"
                      aria-required="true"
                      value={field.value || ""}
                      placeholder={t("urlPlaceholder")}
                      className="placeholder:truncate border-primary/30 focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:border-primary/30"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <LimitedTextareaField
            id="description"
            label={t("description")}
            maxLength={255}
            rows={3}
            placeholder={t("descriptionPlaceholder")}
            className="resize-none"
          />

          {isEdit && (
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("status")}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-full border-primary/30 focus:ring-2 focus:ring-primary/30">
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
          )}
        </div>

        <div className="flex justify-end gap-2">
          <IGRPButton
            type="button"
            showIcon
            iconName="X"
            variant="outline"
            onClick={onSuccess}
          >
            {tc("actions.cancel")}
          </IGRPButton>
          <IGRPButton
            type="submit"
            showIcon
            iconName="Save"
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting
              ? t("saving")
              : isEdit
                ? t("update")
                : t("create")}
          </IGRPButton>
        </div>
      </form>
    </Form>
  );
}
