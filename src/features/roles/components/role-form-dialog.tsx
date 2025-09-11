import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import {
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
  IGRPInputPrimitive,
  IGRPSelectContentPrimitive,
  IGRPSelectItemPrimitive,
  IGRPSelectPrimitive,
  IGRPSelectTriggerPrimitive,
  IGRPSelectValuePrimitive,
  IGRPTextAreaPrimitive,
  useIGRPToast,
} from '@igrp/igrp-framework-react-design-system';
import { STATUS_OPTIONS } from '@/lib/constants';
import { statusSchema } from '@/schemas/global';
import {
  CreateRoleArgs,
  createRoleSchema,
  normalizeRole,
  RoleArgs,
  UpdateRoleArgs,
  updateRoleSchema,
} from '../role-schemas';
import { useCreateRole, useUpdateRole } from '../use-roles';

interface RoleFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  departmentCode: string;
  role?: RoleArgs;
  openType?: 'edit' | 'view';
  roles?: RoleArgs[];
}

export function RoleFormDialog({
  open,
  onOpenChange,
  departmentCode,
  role,
  roles,
}: RoleFormDialogProps) {
  const { igrpToast } = useIGRPToast();

  const { mutateAsync: createRole, isPending: isCreating } = useCreateRole();
  const { mutateAsync: updateRole, isPending: isUpdating } = useUpdateRole();

  const isEdit = !!role

  const form = useForm<CreateRoleArgs>({
    resolver: zodResolver(createRoleSchema),
    defaultValues: {
      name: '',
      description: null,
      departmentCode: departmentCode,
      parentName: '',
      status: statusSchema.enum.ACTIVE,
    },
  });

  useEffect(() => {
    if (!open) return;

    if (role) {
      form.reset({
        name: role.name ?? '',
        description: role.description ?? null,
        departmentCode: departmentCode ?? '',
        parentName: role.parentName ?? null,
        status: role.status ?? statusSchema.enum.ACTIVE,
      } as CreateRoleArgs);
    } else {
      form.reset({
        name: '',
        description: null,
        departmentCode,
        parentName: null,
        status: statusSchema.enum.ACTIVE,
      } as CreateRoleArgs);
    }
  }, [open, role, departmentCode, form]);

  const onSubmit = async (values: CreateRoleArgs) => {
    try {
      if (isEdit && role) {
        const parsed = updateRoleSchema.parse({
          ...values,
        } as UpdateRoleArgs);

        const payload = normalizeRole(parsed as RoleArgs);

        await updateRole({ name: role.name, data: payload });

        igrpToast({
          type: 'success',
          title: 'Atualizar Perfil',
          description: 'Perfil foi atualizado com sucesso.',
        });
      } else {
        const payload = normalizeRole(values);

        await createRole(payload);
        igrpToast({
          type: 'success',
          title: 'Adicionar Perfil',
          description: 'Perfil foi adicionado com sucesso.',
        });
      }
    } catch (error) {
      console.error('Falha ao adicionar perfil:', error);
      igrpToast({
        type: 'error',
        title: 'Falha ao adicionar perfil',
        description: `Tente novamente. ${error}`,
      });
    } finally {
      form.reset();
      onOpenChange(false);
    }
  };

  return (
    <IGRPDialogPrimitive
      open={open}
      onOpenChange={onOpenChange}
      modal
    >
      <IGRPDialogContentPrimitive className='md:min-w-2xl'>
        <IGRPDialogHeaderPrimitive>
          <IGRPDialogTitlePrimitive>
            {isEdit ? 'Editar Perfil' : 'Adicionar Perfil'}
          </IGRPDialogTitlePrimitive>
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
                      placeholder='Identificador único do perfil'
                      required                      
                      className='placeholder:truncate border-primary/30 focus-visible:ring-[2px] focus-visible:ring-primary/30 focus-visible:border-primary/30'
                      {...field}
                    />
                  </IGRPFormControlPrimitive>
                  <IGRPFormMessagePrimitive />
                </IGRPFormItemPrimitive>
              )}
            />
            <IGRPFormFieldPrimitive
              control={form.control}
              name='description'
              render={({ field }) => (
                <IGRPFormItemPrimitive>
                  <IGRPFormLabelPrimitive>Descrição</IGRPFormLabelPrimitive>
                  <IGRPFormControlPrimitive>
                    <IGRPTextAreaPrimitive
                      placeholder='Breve descrição do perfil'
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

            {roles && roles.length > 0 && (
              <IGRPFormFieldPrimitive
                control={form.control}
                name='parentName'
                render={({ field }) => (
                  <IGRPFormItemPrimitive>
                    <IGRPFormLabelPrimitive>Perfil Pai</IGRPFormLabelPrimitive>
                    <IGRPSelectPrimitive
                      onValueChange={(v) => field.onChange(v === '' ? null : v)}
                      value={field.value ?? ''}                      
                    >
                      <IGRPFormControlPrimitive>
                        <IGRPSelectTriggerPrimitive className='w-full truncate'>
                          <IGRPSelectValuePrimitive placeholder='Selecione o perfil pai' />
                        </IGRPSelectTriggerPrimitive>
                      </IGRPFormControlPrimitive>
                      <IGRPSelectContentPrimitive>
                        {roles.map((r) => (
                          <IGRPSelectItemPrimitive
                            key={r.name}
                            value={r.name}
                          >
                            {r.description ?? r.name}
                          </IGRPSelectItemPrimitive>
                        ))}
                      </IGRPSelectContentPrimitive>
                    </IGRPSelectPrimitive>
                    <IGRPFormMessagePrimitive />
                  </IGRPFormItemPrimitive>
                )}
              />
            )}

            {role && (
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

            <IGRPDialogFooterPrimitive className='pt-4'>
              <IGRPButtonPrimitive
                type='button'
                variant='outline'
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </IGRPButtonPrimitive>
              <IGRPButtonPrimitive
                type='submit'
                disabled={isCreating || isUpdating}
              >
                {isEdit
                  ? isUpdating
                    ? 'Atualizando...'
                    : 'Atualizar'
                  : isCreating
                    ? 'Guardando...'
                    : 'Adicionar'
                }
              </IGRPButtonPrimitive>
            </IGRPDialogFooterPrimitive>
          </form>
        </IGRPFormPrimitive>
      </IGRPDialogContentPrimitive>
    </IGRPDialogPrimitive>
  );
}
