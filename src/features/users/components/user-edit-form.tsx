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
import { useForm } from "react-hook-form";
import { useUpdateUser } from "@/features/users/use-users";
import { STATUS_OPTIONS } from "@/lib/constants";

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
        title: "Perfil atualizado com sucesso",
      });

      onSuccess();
    } catch (error) {
      igrpToast({
        type: "error",
        title: "Erro ao atualizar perfil",
        description:
          error instanceof Error ? error.message : "Erro desconhecido",
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome Completo</FormLabel>
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
              <FormLabel>Estado</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger className="w-full truncate">
                    <SelectValue placeholder="Selecionar estado" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {STATUS_OPTIONS.map((status) => (
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
            Cancelar
          </IGRPButton>
          <IGRPButton
            showIcon
            iconName="Save"
            type="submit"
            disabled={updateUser.isPending}
          >
            {updateUser.isPending ? "Gravando..." : "Gravar"}
          </IGRPButton>
        </div>
      </form>
    </Form>
  );
}
