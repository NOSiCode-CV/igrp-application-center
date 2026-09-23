"use client";

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
import type {
  IGRPUserDTO,
  Status,
} from "@igrp/platform-access-management-client-ts";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";

import { useUpdateUser } from "@/features/users/use-users";

import { useUserStatusOptions } from "../lib/i18n";

type UserEditFormProps = {
  user: IGRPUserDTO;
  onSuccess: () => void;
};

type FormData = {
  name: string;
  username: string;
  status: string;
  email: string;
};

export function UserEditForm({ user, onSuccess }: UserEditFormProps) {
  const { igrpToast } = useIGRPToast();
  const t = useTranslations("users.editForm");
  const tc = useTranslations("common.actions");
  const statusOptions = useUserStatusOptions();
  const updateUser = useUpdateUser();

  const form = useForm<FormData>({
    defaultValues: {
      name: user.name,
      username: user.username,
      email: user.email,
      status: user.status,
    },
  });

  const onSubmit = async (data: FormData) => {
    try {
      const result = await updateUser.mutateAsync({
        id: user.id,
        user: {
          ...user,
          name: data.name,
          username: user.username,
          email: user.email,
          status: data.status as Status,
        },
      });

      if (!result.success) {
        throw new Error(result.error);
      }

      igrpToast({
        type: "success",
        title: t("toasts.updated"),
      });

      onSuccess();
    } catch (error) {
      igrpToast({
        type: "error",
        title: t("toasts.updateFailed"),
        description:
          error instanceof Error ? error.message : t("toasts.unknownError"),
      });
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col gap-4"
      >
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("fullName")}</FormLabel>
              <FormControl>
                <Input {...field} />
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
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger className="w-full truncate">
                    <SelectValue placeholder={t("statusPlaceholder")} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {statusOptions.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-3">
          <IGRPButton
            type="button"
            variant="outline"
            onClick={onSuccess}
            showIcon
            iconName="X"
          >
            {tc("cancel")}
          </IGRPButton>
          <IGRPButton
            showIcon
            iconName="Save"
            type="submit"
            disabled={updateUser.isPending}
          >
            {updateUser.isPending ? t("saving") : t("save")}
          </IGRPButton>
        </div>
      </form>
    </Form>
  );
}
