"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  Button,
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
  IGRPButton,
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
import type { DepartmentDTO } from "@igrp/platform-access-management-client-ts";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { STATUS_OPTIONS } from "@/lib/constants";
import { statusSchema } from "@/schemas/global";
import {
  type DepartmentArgs,
  departmentSchema,
  normalizeDeptartment,
} from "../dept-schemas";
import { useCreateDepartment, useUpdateDepartment } from "../use-departments";

interface DepartmentCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  department: DepartmentDTO | null;
  parentDeptId?: DepartmentDTO | null;
}

const defaultValues = {
  name: "",
  code: "",
  description: "",
  status: statusSchema.enum.ACTIVE,
  parentCode: "",
};

export function DepartmentFormDialog({
  open,
  onOpenChange,
  department,
  parentDeptId,
}: DepartmentCreateDialogProps) {
  const { igrpToast } = useIGRPToast();
  const [shouldClose, setShouldClose] = useState(false);
  const { mutateAsync: createDepartment, isPending: isCreating } =
    useCreateDepartment();
  const { mutateAsync: updateDepartment, isPending: isUpdating } =
    useUpdateDepartment();

  const form = useForm<DepartmentArgs>({
    resolver: zodResolver(departmentSchema),
    defaultValues: defaultValues,
    mode: "onChange",
  });

  useEffect(() => {
    if (!open) return;

    if (department) {
      form.reset({
        name: department.name ?? "",
        code: department.code ?? "",
        description: department.description ?? "",
        status: department.status ?? statusSchema.enum.ACTIVE,
        parentCode: department.parentCode ?? "",
      });
    } else {
      form.reset({
        ...defaultValues,
        parentCode: parentDeptId?.code ?? "",
      });
    }
  }, [open, department, parentDeptId, form]);

  const watchedName = form.watch("name");

  useEffect(() => {
    if (!open) {
      form.reset(defaultValues);
      form.clearErrors();
    }
  }, [open, form]);

  useEffect(() => {
    const codeDirty = !!form.formState.dirtyFields?.code;
    if (codeDirty) return;

    const raw = (watchedName ?? "").trim();
    if (!raw) return;

    if (!department) {
      const ignoreWords = ["do", "da", "de", "dos", "das", "e", "o", "a"];
      const words = raw.split(/\s+/);

      const initials = words
        .filter((word) => !ignoreWords.includes(word.toLowerCase()))
        .map((word) => word.charAt(0).toUpperCase())
        .join("");

      const code = initials.slice(0, 30);
      form.setValue("code", code, { shouldValidate: true, shouldDirty: false });
    }
  }, [watchedName, form, department]);

  const isLoading = isCreating || isUpdating;

  const onSubmit = async (values: DepartmentArgs) => {
    const payload = normalizeDeptartment(values);

    try {
      if (department) {
        const result = await updateDepartment({
          code: department.code,
          data: payload,
        });
        if (!result.success) {
          throw new Error(result.error);
        }
      } else {
        const result = await createDepartment(payload);
        if (!result.success) {
          throw new Error(result.error);
        }
      }

      igrpToast({
        type: "success",
        title: "Departamento",
        description: `O departamento foi ${
          department ? "atualizado" : "criado"
        } com sucesso.`,
      });

      if (shouldClose) {
        onOpenChange(false);
        form.reset();
      } else {
        form.reset({
          ...defaultValues,
          parentCode: parentDeptId?.code ?? "",
        });
      }
    } catch (error) {
      igrpToast({
        type: "error",
        title: `Não foi possível ${
          department ? "atualizar" : "criar"
        } departamento.`,
        description:
          error instanceof Error
            ? error.message
            : "Ocorreu um erro desconhecido.",
      });
    }
  };

  const isSubDepartment = Boolean(parentDeptId?.code);

  const titleTxt = department
    ? "Editar Departamento"
    : isSubDepartment
      ? "Criar Sub Departamento"
      : "Criar Novo Departamento";

  const descriptionTxt = department
    ? "Atualizar Departamento"
    : isSubDepartment
      ? "Criar um novo sub departamento"
      : "Criar um novo departamento";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{titleTxt}</DialogTitle>
          <DialogDescription>{descriptionTxt}</DialogDescription>
        </DialogHeader>

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
                  <FormLabel className='after:content-["*"] after:text-destructive'>
                    Nome
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Nome do Departamento"
                      value={field.value ?? ""}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      name={field.name}
                      ref={field.ref}
                      required
                      disabled={isLoading}
                      className="placeholder:truncate border-primary/30 focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:border-primary/30"
                    />
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
                  <FormLabel className='after:content-["*"] after:text-destructive'>
                    Código
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Código do Departamento"
                      required
                      disabled={isLoading || !!department}
                      {...field}
                      onFocus={() => form.trigger("code")}
                      className="placeholder:truncate border-primary/30 focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:border-primary/30"
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
                  <FormLabel className="">Descrição</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Breve descrição do departamento"
                      rows={2}
                      disabled={isLoading}
                      value={field.value ?? ""}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      name={field.name}
                      ref={field.ref}
                      className="resize-none placeholder:truncate border-primary/30 focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:border-primary/30"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {isSubDepartment && (
              <FormField
                control={form.control}
                name="parentCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Departamento Pai</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        value={
                          parentDeptId?.name ||
                          parentDeptId?.description ||
                          parentDeptId?.code ||
                          ""
                        }
                        disabled
                        placeholder="Departamento pai"
                        className="bg-muted border-primary/30"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {department && (
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
            )}

            <DialogFooter className="pt-6 flex justify-between">
              <IGRPButton
                variant="outline"
                onClick={() => {
                  form.reset(defaultValues);
                  onOpenChange(false);
                }}
                type="button"
                disabled={isLoading}
                showIcon
                iconPlacement="start"
                iconName="X"
              >
                Cancelar
              </IGRPButton>

              <div className="flex gap-1">
                {!department && (
                  <Button
                    type="submit"
                    variant="outline"
                    disabled={isLoading}
                    onClick={() => setShouldClose(false)}
                    className="flex items-center gap-1"
                  >
                    <IGRPIcon iconName="Save" className="size-4" />
                    {isLoading ? "Guardando..." : "Guardar e Novo"}
                  </Button>
                )}

                <Button
                  type="submit"
                  disabled={isLoading}
                  onClick={() => setShouldClose(true)}
                  className="flex items-center gap-1"
                >
                  <IGRPIcon iconName="Save" className="size-4" />
                  {isLoading ? "Guardando..." : "Guardar"}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
