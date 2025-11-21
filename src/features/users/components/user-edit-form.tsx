"use client";

import {
  IGRPButtonPrimitive,
  IGRPFormPrimitive,
  IGRPFormFieldPrimitive,
  IGRPFormItemPrimitive,
  IGRPFormLabelPrimitive,
  IGRPFormControlPrimitive,
  IGRPFormMessagePrimitive,
  IGRPInputPrimitive,
  useIGRPToast,
  IGRPSelectPrimitive,
  IGRPSelectTriggerPrimitive,
  IGRPSelectValuePrimitive,
  IGRPSelectContentPrimitive,
  IGRPSelectItemPrimitive,
  IGRPButton,
} from "@igrp/igrp-framework-react-design-system";
import { useForm } from "react-hook-form";
import { useUpdateUser } from "@/features/users/use-users";
import { STATUS_OPTIONS } from "@/lib/constants";
import { IGRPUserDTO } from "@igrp/platform-access-management-client-ts";

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
      await updateUser.mutateAsync({
        id: user.id,
        user: {
          name: data.name,
          username: user.username,
          email: user.email,
          status: data.status as any,
        } as any,
      });

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
    <IGRPFormPrimitive {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <IGRPFormFieldPrimitive
          control={form.control}
          name="name"
          render={({ field }) => (
            <IGRPFormItemPrimitive>
              <IGRPFormLabelPrimitive>Nome Completo</IGRPFormLabelPrimitive>
              <IGRPFormControlPrimitive>
                <IGRPInputPrimitive {...field} />
              </IGRPFormControlPrimitive>
              <IGRPFormMessagePrimitive />
            </IGRPFormItemPrimitive>
          )}
        />

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
    </IGRPFormPrimitive>
  );
}
