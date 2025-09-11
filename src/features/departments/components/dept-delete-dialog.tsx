'use client';

import { useState } from 'react';
import {
  IGRPDialogPrimitive,
  IGRPDialogContentPrimitive,
  IGRPDialogDescriptionPrimitive,
  IGRPDialogFooterPrimitive,
  IGRPDialogHeaderPrimitive,
  IGRPDialogTitlePrimitive,
  useIGRPToast,
  IGRPIcon,
} from '@igrp/igrp-framework-react-design-system';
import { IGRPButtonPrimitive } from '@igrp/igrp-framework-react-design-system';
import { IGRPInputPrimitive } from '@igrp/igrp-framework-react-design-system';
import { IGRPLabelPrimitive } from '@igrp/igrp-framework-react-design-system';
import { useDeleteDepartment } from '../use-departments';

interface DepartmentDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deptToDelete: { code: string; name: string };
}

export function DepartmentDeleteDialog({
  open,
  onOpenChange,
  deptToDelete,
}: DepartmentDeleteDialogProps) {
  const [confirmation, setConfirmation] = useState('');
  const { igrpToast } = useIGRPToast();

  const { mutateAsync: deleteDepartment } = useDeleteDepartment();

  const isConfirmed = confirmation === deptToDelete.name;

  async function confirmDelete() {
    try {
      await deleteDepartment(deptToDelete.code);
      igrpToast({
        type: 'success',
        title: 'Departamento Eliminado',
        description: `Departamento '${deptToDelete.name}' foi eliminado com sucesso.`,
        duration: 4000,
      });
    } catch (error) {
      igrpToast({
        type: 'error',
        title: 'Erro ao eliminar.',
        description: (error as Error).message,
        duration: 4000,
      });
    } finally {
      setTimeout(() => {
        onOpenChange(false);
      }, 2000);
    }
  }

  return (
    <IGRPDialogPrimitive
      open={open}
      onOpenChange={onOpenChange}
    >
      <IGRPDialogContentPrimitive>
        <div>
          <IGRPDialogHeaderPrimitive className='flex flex-col gap-4'>
            <div className='flex flex-col items-center gap-1'>
              <div
                className='flex size-9 shrink-0 items-center justify-center'
                aria-hidden='true'
              >
                <IGRPIcon
                  iconName='CircleAlertIcon'
                  className='opacity-80 size-4'
                />
              </div>
              <IGRPDialogTitlePrimitive>Confirmação</IGRPDialogTitlePrimitive>
            </div>
            <IGRPDialogDescriptionPrimitive className='sm:text-center text-base text-balance '>
              <span>
                Esta ação é irreversível. O menu e todos os seus dados serão eliminados
                permanentemente. Para confirmar, escreva
              </span>{' '}
              <span className='font-semibold bg-emerald-50bg-destructive/20 dark:bg-destructive/50 dark:text-white p-0.5 rounded-sm '>
                &nbsp;{deptToDelete.name}&nbsp;
              </span>{' '}
              abaixo:
            </IGRPDialogDescriptionPrimitive>
          </IGRPDialogHeaderPrimitive>
        </div>

        <div className='flex flex-col gap-2'>
          <IGRPLabelPrimitive
            htmlFor='confirmation'
            className='after:content-["*"] after:text-destructive gap-0.5 mb-1'
          >
            Nome Departamento
          </IGRPLabelPrimitive>
          <IGRPInputPrimitive
            id='confirmation'
            value={confirmation}
            onChange={(e) => setConfirmation(e.target.value)}
            placeholder={`Digite '${deptToDelete.name}' para confirmação`}
            className='placeholder:truncate border-primary/30 focus-visible:ring-[2px] focus-visible:ring-primary/30 focus-visible:border-primary/30'
            required
          />
        </div>
        <IGRPDialogFooterPrimitive className='flex flex-col'>
          <IGRPButtonPrimitive
            variant='outline'
            onClick={() => {
              onOpenChange(false);
              setConfirmation('');
            }}
            type='button'
          >
            Cancelar
          </IGRPButtonPrimitive>
          <IGRPButtonPrimitive
            variant='destructive'
            onClick={confirmDelete}
            disabled={!isConfirmed}
          >
            Eliminar
          </IGRPButtonPrimitive>
        </IGRPDialogFooterPrimitive>
      </IGRPDialogContentPrimitive>
    </IGRPDialogPrimitive>
  );
}
