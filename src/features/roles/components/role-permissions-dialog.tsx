'use client';

import {
  IGRPCardPrimitive,
  IGRPCardContentPrimitive,
  IGRPCardDescriptionPrimitive,
  IGRPCardHeaderPrimitive,
  IGRPCardTitlePrimitive,
  IGRPSeparatorPrimitive,
  cn,
  IGRPBadgePrimitive,
  IGRPDialogPrimitive,
  IGRPDialogContentPrimitive,
  IGRPDialogHeaderPrimitive,
  IGRPDialogTitlePrimitive,
} from '@igrp/igrp-framework-react-design-system';
import { AppCenterNotFound } from '@/components/not-found';
import { CopyToClipboard } from '@/components/copy-to-clipboard';
import { showStatus, statusClass } from '@/lib/utils';
import { PermissionsCheckList } from '@/features/permission/components/permissions-checklist';
import { RoleArgs } from '../role-schemas';

interface RoleDetailsProps {
  departmentCode: string;
  role: RoleArgs;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RoleDetails({ 
  departmentCode, 
  role,
  open,
  onOpenChange
 }: RoleDetailsProps) {     

  const { description, parentName, status, name } = role;

  return (
    <IGRPDialogPrimitive
      open={open}
      onOpenChange={onOpenChange}
      modal
    >
      <IGRPDialogContentPrimitive className='md:min-w-2xl'>
        <IGRPDialogHeaderPrimitive>
          <IGRPDialogTitlePrimitive>
            Adicionar ou Remover Permissões
          </IGRPDialogTitlePrimitive>
        </IGRPDialogHeaderPrimitive>

        <div className='flex-1 min-w-0 overflow-x-hidden'>
          <section className='space-y-10 max-w-full'>
            <div className='flex flex-col gap-6'>  
              <div className='flex flex-col gap-8 animate-fade-in motion-reduce:hidden'>
                <IGRPCardPrimitive className='overflow-hidden gap-3 py-6'>                  
                  <IGRPCardContentPrimitive>
                    <div className='grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm'>
                      <div className='flex items-center gap-4'>
                        <div className='flex flex-col'>
                          <h3 className='font-normal text-muted-foreground'>Nome</h3>
                          <p className='font-medium text-base'>{name}</p>
                        </div>                        
                      </div>

                      <div>
                        <h3 className='font-normal text-muted-foreground'>Descrição</h3>
                        <p>{description || 'N/A'}</p>
                      </div>

                      <div className='flex items-center gap-4'>
                        <div>
                          <h3 className='font-normal text-muted-foreground'>Código departamento</h3>
                          <p className='font-medium'>{departmentCode}</p>
                        </div>                        
                      </div>

                      {parentName && (
                        <div className='flex items-center gap-4'>
                          <div>
                            <h3 className='font-normal text-muted-foreground'>Perfil Pai</h3>
                            <p className='font-medium'>{parentName}</p>
                          </div>
                        </div>
                      )}

                      <div>
                        <h3 className='font-normal text-muted-foreground'>Estado</h3>
                        <IGRPBadgePrimitive className={cn(statusClass(status), 'capitalize')}>
                          {showStatus(status)}
                        </IGRPBadgePrimitive>
                      </div>
                    </div>
                  </IGRPCardContentPrimitive>
                </IGRPCardPrimitive>
              </div>
            </div>

            <PermissionsCheckList departmentCode={departmentCode} />
          </section>
        </div>
      </IGRPDialogContentPrimitive>
    </IGRPDialogPrimitive>
  );
}