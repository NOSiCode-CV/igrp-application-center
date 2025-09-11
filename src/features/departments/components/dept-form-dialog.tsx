'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import {
  IGRPDialogPrimitive,
  IGRPDialogContentPrimitive,
  IGRPDialogDescriptionPrimitive,
  IGRPDialogFooterPrimitive,
  IGRPDialogHeaderPrimitive,
  IGRPDialogTitlePrimitive,
  IGRPButtonPrimitive,
  IGRPFormPrimitive,
  IGRPFormControlPrimitive,
  IGRPFormFieldPrimitive,
  IGRPFormItemPrimitive,
  IGRPFormLabelPrimitive,
  IGRPInputPrimitive,
  IGRPTextAreaPrimitive,
  IGRPSelectPrimitive,
  IGRPSelectContentPrimitive,
  IGRPSelectItemPrimitive,
  IGRPSelectTriggerPrimitive,
  IGRPSelectValuePrimitive,
  useIGRPToast,
  IGRPFormMessagePrimitive,
  IGRPButton,
  IGRPIcon,
} from '@igrp/igrp-framework-react-design-system';

import { DepartmentArgs, departmentSchema, normalizeDeptartment } from '../dept-schemas';
import { statusSchema } from '@/schemas/global';
import { useCreateDepartment, useUpdateDepartment } from '../use-departments';
import { STATUS_OPTIONS } from '@/lib/constants';

interface DepartmentCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  handleOpenForm: () => void;
  department?: DepartmentArgs;
}

export function DepartmentCreateDialog({
  open,
  onOpenChange,
  department,
}: DepartmentCreateDialogProps) {
  const { igrpToast } = useIGRPToast();

  const { mutateAsync: createDepartment, isPending: isCreating } = useCreateDepartment();
  const { mutateAsync: updateDepartment, isPending: isUpdating } = useUpdateDepartment();

  const form = useForm<DepartmentArgs>({
    resolver: zodResolver(departmentSchema),
    defaultValues: {
      name: '',
      code: '',
      description: '',
      status: statusSchema.enum.ACTIVE,
      parent_code: '',
    },
  });

  useEffect(() => {
    if (!open) return;

    if (department) {
      form.reset({
        name: department.name ?? '',
        code: department.code ?? '',
        description: department.description ?? '',
        status: department.status ?? statusSchema.enum.ACTIVE,
        parent_code: department.parent_code ?? '',
      });
    }
  }, [open, department, form]);

  const watchedName = form.watch('name');

  useEffect(() => {
    const codeDirty = !!form.formState.dirtyFields?.code;
    if (codeDirty) return;

    const raw = (watchedName ?? '').trim();
    if (!raw) return;

    if (!department) {
      const code = `DEPT_${raw.replace(/\s+/g, '_').toUpperCase()}`.slice(0, 30);
      form.setValue('code', code, { shouldValidate: true, shouldDirty: false });
    }
  }, [watchedName, form, department]);

  const isLoading = isCreating || isUpdating;

  const onSubmit = async (values: DepartmentArgs) => {
    try {
      if (department) {
        const paylod = normalizeDeptartment(values);
        await updateDepartment({ code: department.code, data: paylod });
      } else {
        await createDepartment(values);
      }

      igrpToast({
        type: 'success',
        title: 'Departamento',
        description: `O departamento foi ${department ? 'atualizado' : 'criado'} com sucesso.`,
        duration: 4000,
      });
    } catch (error) {
      igrpToast({
        type: 'error',
        title: `Não foi possível ${department ? 'atualizar' : 'criar'} departamento.`,
        description: error instanceof Error ? error.message : 'Ocorreu um erro desconhecido.',
        duration: 4000,
      });
    } finally {
      setTimeout(() => {
        form.reset();
        onOpenChange(false);
      }, 2500);
    }
  };

  const titleTxt = department ? 'Editar Departamento' : 'Criar Novo Departamento';
  const descriptionTxt = department ? 'Criar um novo departamento.' : 'Atualizar Departamento';

  return (
    <IGRPDialogPrimitive
      open={open}
      onOpenChange={onOpenChange}
      modal
    >
      <IGRPDialogContentPrimitive>
        <IGRPDialogHeaderPrimitive>
          <IGRPDialogTitlePrimitive>{titleTxt}</IGRPDialogTitlePrimitive>
          <IGRPDialogDescriptionPrimitive>{descriptionTxt}</IGRPDialogDescriptionPrimitive>
        </IGRPDialogHeaderPrimitive>

        <IGRPFormPrimitive {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className='flex flex-col gap-4'
          >
            <IGRPFormFieldPrimitive
              control={form.control}
              name='name'
              render={({ field }) => (
                <IGRPFormItemPrimitive>
                  <IGRPFormLabelPrimitive className='after:content-["*"] after:text-destructive'>
                    Nome
                  </IGRPFormLabelPrimitive>
                  <IGRPFormControlPrimitive>
                    <IGRPInputPrimitive
                      placeholder='Nome do Departamento'
                      value={field.value ?? ''}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      name={field.name}
                      ref={field.ref}
                      required
                      className='placeholder:truncate border-primary/30 focus-visible:ring-[2px] focus-visible:ring-primary/30 focus-visible:border-primary/30'
                    />
                  </IGRPFormControlPrimitive>
                  <IGRPFormMessagePrimitive />
                </IGRPFormItemPrimitive>
              )}
            />

            {!department && (
              <IGRPFormFieldPrimitive
                control={form.control}
                name='code'
                render={({ field }) => (
                  <IGRPFormItemPrimitive>
                    <IGRPFormLabelPrimitive className='after:content-["*"] after:text-destructive'>
                      Código
                    </IGRPFormLabelPrimitive>
                    <IGRPFormControlPrimitive>
                      <IGRPInputPrimitive
                        placeholder='DEPT_CODE'
                        {...field}
                        onFocus={() => form.trigger('code')}
                        className='placeholder:truncate border-primary/30 focus-visible:ring-[2px] focus-visible:ring-primary/30 focus-visible:border-primary/30'
                      />
                    </IGRPFormControlPrimitive>
                    <IGRPFormMessagePrimitive />
                  </IGRPFormItemPrimitive>
                )}
              />
            )}

            <IGRPFormFieldPrimitive
              control={form.control}
              name='description'
              render={({ field }) => (
                <IGRPFormItemPrimitive>
                  <IGRPFormLabelPrimitive>Descrição</IGRPFormLabelPrimitive>
                  <IGRPFormControlPrimitive>
                    <IGRPTextAreaPrimitive
                      placeholder='Breve descrição do departamento'
                      rows={2}
                      value={field.value ?? ''}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      name={field.name}
                      ref={field.ref}
                      className='resize-none placeholder:truncate border-primary/30 focus-visible:ring-[2px] focus-visible:ring-primary/30 focus-visible:border-primary/30'
                    />
                  </IGRPFormControlPrimitive>
                  <IGRPFormMessagePrimitive />
                </IGRPFormItemPrimitive>
              )}
            />

            {department && (
              <IGRPFormFieldPrimitive
                control={form.control}
                name='status'
                render={({ field }) => (
                  <IGRPFormItemPrimitive>
                    <IGRPFormLabelPrimitive>Estado</IGRPFormLabelPrimitive>
                    <IGRPSelectPrimitive
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <IGRPFormControlPrimitive>
                        <IGRPSelectTriggerPrimitive className='w-full truncate'>
                          <IGRPSelectValuePrimitive placeholder='Selecionar estado' />
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
            )}

            <IGRPDialogFooterPrimitive className='pt-6'>
              <IGRPButton
                variant='outline'
                onClick={() => {
                  form.reset();
                  onOpenChange(false);
                }}
                type='button'
                disabled={isLoading}
                showIcon
                iconPlacement='start'
                iconName='Undo2'
              >
                Cancelar
              </IGRPButton>
              <IGRPButtonPrimitive
                type='button'
                disabled={isLoading}
                onClick={form.handleSubmit(onSubmit)}
              >
                {isLoading ? 'Guardando...' : 'Guardar'}
                <IGRPIcon
                  iconName='Check'
                  className='size-4'
                />
              </IGRPButtonPrimitive>
            </IGRPDialogFooterPrimitive>
          </form>
        </IGRPFormPrimitive>
      </IGRPDialogContentPrimitive>
    </IGRPDialogPrimitive>
  );
}
