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
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import {
  useCreateRole,
  useUpdateRole,
} from "@/features/departments/use-departments";
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
  }, [open, role, parentRoleName, departmentCode, form, defaultValues]);

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
          title: "Atualizar Perfil",
          description: "Perfil foi atualizado com sucesso.",
        });
      } else {
        const payload = normalizeRole(values);
        const result = await createRole({ departmentCode, role: payload });

        if (!result.success) {
          throw new Error(result.error);
        }

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

  const _titleText = isEdit
    ? "Editar Perfil"
    : isSubRole
      ? "Criar Sub Perfil"
      : "Adicionar Perfil";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Editar Perfil" : "Criar Novo Perfil"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {isSubRole && (
              <div className="p-3 rounded-md bg-muted/50 border text-sm text-muted-foreground flex items-center gap-2">
                <IGRPIcon iconName="Info" className="size-4" />
                <span>
                  Este será um sub-perfil de:{" "}
                  <strong className="text-foreground">{parentRoleName}</strong>
                </span>
              </div>
            )}

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome do perfil" {...field} />
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
                  <FormLabel>Código</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ex: PERFIL_ADMIN"
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
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Breve descrição das responsabilidades deste perfil"
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
                  <FormLabel>Estado</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o estado" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {STATUS_OPTIONS.map((option) => (
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
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <IGRPIcon
                      iconName="LoaderCircle"
                      className="mr-2 h-4 w-4 animate-spin"
                    />
                    {isEdit ? "A guardar..." : "A criar..."}
                  </>
                ) : isEdit ? (
                  "Guardar Alterações"
                ) : (
                  "Criar Perfil"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
