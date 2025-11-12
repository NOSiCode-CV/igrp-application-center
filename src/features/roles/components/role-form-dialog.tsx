import { zodResolver } from "@hookform/resolvers/zod";
import {
  IGRPButton,
  IGRPButtonPrimitive,
  IGRPDialogContentPrimitive,
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
  IGRPSelectContentPrimitive,
  IGRPSelectItemPrimitive,
  IGRPSelectPrimitive,
  IGRPSelectTriggerPrimitive,
  IGRPSelectValuePrimitive,
  IGRPTextAreaPrimitive,
  useIGRPToast,
} from "@igrp/igrp-framework-react-design-system";
import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { STATUS_OPTIONS } from "@/lib/constants";
import { statusSchema } from "@/schemas/global";
import {
  type CreateRoleArgs,
  createRoleSchema,
  normalizeRole,
  type RoleArgs,
  type UpdateRoleArgs,
  updateRoleSchema,
} from "../role-schemas";
import { useCreateRole, useUpdateRole } from "../use-roles";

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
  const { mutateAsync: createRole, isPending: isCreating } = useCreateRole();
  const { mutateAsync: updateRole, isPending: isUpdating } = useUpdateRole();

  const { igrpToast } = useIGRPToast();
  const isEdit = !!role;
  const isSubRole = !!parentRoleName;

  const defaultValues = {
    name: "",
    description: null,
    departmentCode: departmentCode,
    parentCode: "",
    code: "",
    status: statusSchema.enum.ACTIVE,
  };

  const form = useForm<CreateRoleArgs>({
    resolver: zodResolver(createRoleSchema),
    defaultValues: defaultValues,
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
        ...defaultValues,
        parentCode: parentRoleName ?? "",
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

        await updateRole({ name: role.name, data: payload });

        igrpToast({
          type: "success",
          title: "Atualizar Perfil",
          description: "Perfil foi atualizado com sucesso.",
        });
      } else {
        const payload = normalizeRole(values);
        await createRole(payload);

        igrpToast({
          type: "success",
          title: "Adicionar Perfil",
          description: "Perfil foi adicionado com sucesso.",
        });
      }

      form.reset(defaultValues);
      onOpenChange(false);
    } catch (error) {
      console.error("Falha ao adicionar perfil:", error);
      igrpToast({
        type: "error",
        title: "Falha ao adicionar perfil",
        description: `Tente novamente. ${error}`,
      });
    }
  };

  const setDefaultFromName = (e: React.ChangeEvent<HTMLInputElement>) => {
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

  const titleText = isEdit
    ? "Editar Perfil"
    : isSubRole
      ? "Criar Sub Perfil"
      : "Adicionar Perfil";

  return (
    <IGRPDialogPrimitive open={open} onOpenChange={onOpenChange} modal>
      <IGRPDialogContentPrimitive>
        <IGRPDialogHeaderPrimitive>
          <IGRPDialogTitlePrimitive>{titleText}</IGRPDialogTitlePrimitive>
        </IGRPDialogHeaderPrimitive>

        <IGRPFormPrimitive {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit, (errors) => {
      console.error("Form validation errors:", errors);
    })}
            className="flex flex-col gap-4"
          >
            <IGRPFormFieldPrimitive
              control={form.control}
              name="name"
              render={({ field }) => (
                <IGRPFormItemPrimitive>
                  <IGRPFormLabelPrimitive className='after:content-["*"] after:text-destructive'>
                    Nome
                  </IGRPFormLabelPrimitive>
                  <IGRPFormControlPrimitive>
                    <IGRPInputPrimitive
                      {...field}
                      placeholder="Identificador único do perfil"
                      required
                      onChange={setDefaultFromName}
                      disabled={isLoading}
                      className="placeholder:truncate border-primary/30 focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:border-primary/30"
                    />
                  </IGRPFormControlPrimitive>
                  <IGRPFormMessagePrimitive />
                </IGRPFormItemPrimitive>
              )}
            />

            <IGRPFormFieldPrimitive
              control={form.control}
              name="code"
              render={({ field }) => (
                <IGRPFormItemPrimitive>
                  <IGRPFormLabelPrimitive className='after:content-["*"] after:text-destructive'>
                    Código
                  </IGRPFormLabelPrimitive>
                  <IGRPFormControlPrimitive>
                    <IGRPInputPrimitive
                      placeholder="CODIGO_ROLE"
                      required
                      pattern="^[A-Z0-9_]+$"
                      disabled={isLoading}
                      className="placeholder:truncate border-primary/30 focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:border-primary/30"
                      {...field}
                    />
                  </IGRPFormControlPrimitive>
                  <IGRPFormMessagePrimitive />
                </IGRPFormItemPrimitive>
              )}
            />

            <IGRPFormFieldPrimitive
              control={form.control}
              name="description"
              render={({ field }) => (
                <IGRPFormItemPrimitive>
                  <IGRPFormLabelPrimitive>Descrição</IGRPFormLabelPrimitive>
                  <IGRPFormControlPrimitive>
                    <IGRPTextAreaPrimitive
                      placeholder="Breve descrição do perfil"
                      rows={2}
                      value={field.value ?? ""}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      name={field.name}
                      ref={field.ref}
                      disabled={isLoading}
                      className="resize-none placeholder:truncate border-primary/30 focus-visible:ring-[2px] focus-visible:ring-primary/30 focus-visible:border-primary/30"
                    />
                  </IGRPFormControlPrimitive>
                  <IGRPFormMessagePrimitive />
                </IGRPFormItemPrimitive>
              )}
            />

            {isSubRole && (
              <IGRPFormFieldPrimitive
                control={form.control}
                name="parentCode"
                render={({ field }) => (
                  <IGRPFormItemPrimitive>
                    <IGRPFormLabelPrimitive>Perfil Pai</IGRPFormLabelPrimitive>
                    <IGRPFormControlPrimitive>
                      <IGRPInputPrimitive
                        {...field}
                        value={field.value ?? ""}
                        disabled
                        placeholder="Perfil pai"
                        className="bg-muted border-primary/30"
                      />
                    </IGRPFormControlPrimitive>
                    <IGRPFormMessagePrimitive />
                  </IGRPFormItemPrimitive>
                )}
              />
            )}
            
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

            <IGRPDialogFooterPrimitive className="pt-4">
              <IGRPButton
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                showIcon
                iconPlacement="start"
                iconName="X"
              >
                Cancelar
              </IGRPButton>
              <IGRPButtonPrimitive
                type="submit"
                disabled={isCreating || isUpdating}
              >
                <IGRPIcon iconName="Save" className="size-4" />
                {isEdit
                  ? isUpdating
                    ? "Atualizando..."
                    : "Atualizar"
                  : isCreating
                    ? "Guardando..."
                    : "Adicionar"}
              </IGRPButtonPrimitive>
            </IGRPDialogFooterPrimitive>
          </form>
        </IGRPFormPrimitive>
      </IGRPDialogContentPrimitive>
    </IGRPDialogPrimitive>
  );
}
