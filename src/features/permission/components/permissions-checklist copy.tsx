import { useId, useState } from 'react';
import { usePermissions } from '../use-permission';
import {
  cn,
  IGRPBadgePrimitive,
  IGRPCheckboxPrimitive,  
  IGRPIcon,
  IGRPInputPrimitive,
  IGRPTableBodyPrimitive,
  IGRPTableCellPrimitive,
  IGRPTableHeaderPrimitive,
  IGRPTableHeadPrimitive,
  IGRPTablePrimitive,
  IGRPTableRowPrimitive,
} from '@igrp/igrp-framework-react-design-system';
import { showStatus, statusClass } from '@/lib/utils';
import { statusSchema } from '@/schemas/global';

export function PermissionsCheckList({ departmentCode }: { departmentCode: string }) {
  const [searchTerm, setSearchTerm] = useState('');
  const id = useId();

  const { data: permissions, isLoading, error } = usePermissions({ departmentCode });

  if (error) {
    return (
      <div className='rounded-md border py-6'>
        <p className='text-center'>Ocorreu um erro ao carregar permissões.</p>
        <p className='text-center'>{error.message}</p>
      </div>
    );
  }

  const activePrmissions = permissions?.filter(perm => perm.status === statusSchema.enum.ACTIVE);

  const filteredPermissions = activePrmissions?.filter(
    (perm) =>
      perm.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      perm.description?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const permissionEmpty = permissions?.length === 0;

  return (
    <div className='flex flex-col gap-6 py-4 px-3 min-w-0'>
      <div className='flex flex-col gap-6'>
        <div className='flex flex-col sm:flex-row items-start gap-4 w-full min-w-0'>
          <div className='relative w-full max-w-sm'>
            <IGRPIcon
              iconName='Search'
              className='absolute left-2.5 top-2.5 size-4 text-muted-foreground'
            />
            <IGRPInputPrimitive
              type='search'
              placeholder='Pesquisar permissões...'
              className='pl-8'
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>          
        </div>

        {isLoading ? (
          <div className='grid gap-4 animate-pulse'>
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className='h-12 rounded-lg bg-muted'
              />
            ))}
          </div>
        ) : permissionEmpty ? (
          <div className='text-center py-6 text-muted-foreground'>
            Nenhum perfil encontrado{' '}
            {searchTerm ? 'Tente ajustar a sua pesquisa.' : 'Adicione uma permissão para começar.'}
          </div>
        ) : (
          <div className='w-full min-w-0'>
            <div className='rounded-md border overflow-x-auto'>
              <IGRPTablePrimitive className='min-w-full'>
                <IGRPTableHeaderPrimitive>
                  <IGRPTableRowPrimitive>
                    <IGRPTableHeadPrimitive className="h-11">
                      <IGRPCheckboxPrimitive id={id} />
                    </IGRPTableHeadPrimitive>
                    <IGRPTableHeadPrimitive className='whitespace-nowrap'>
                      Permissão
                    </IGRPTableHeadPrimitive>
                    <IGRPTableHeadPrimitive className='whitespace-nowrap'>
                      Descrição
                    </IGRPTableHeadPrimitive>
                    <IGRPTableHeadPrimitive className='whitespace-nowrap'>
                      Estado
                    </IGRPTableHeadPrimitive>
                  </IGRPTableRowPrimitive>
                </IGRPTableHeaderPrimitive>
                <IGRPTableBodyPrimitive>
                  {filteredPermissions?.map((permssion, i) => (
                    <IGRPTableRowPrimitive key={permssion.id}>
                      <IGRPTableCellPrimitive>
                        <IGRPCheckboxPrimitive id={permssion.name} />
                      </IGRPTableCellPrimitive>
                      <IGRPTableCellPrimitive className='font-medium whitespace-nowrap'>
                        {permssion.name}
                      </IGRPTableCellPrimitive>
                      <IGRPTableCellPrimitive className='whitespace-nowrap'>
                        {permssion.description || 'N/A'}
                      </IGRPTableCellPrimitive>
                      <IGRPTableCellPrimitive className='whitespace-nowrap'>
                        <IGRPBadgePrimitive
                          className={cn(statusClass(permssion.status), 'capitalize')}
                        >
                          {showStatus(permssion.status)}
                        </IGRPBadgePrimitive>
                      </IGRPTableCellPrimitive>
                      <IGRPTableCellPrimitive className='whitespace-nowrap'>
                        {permssion.description || 'N/A'}
                      </IGRPTableCellPrimitive>
                    </IGRPTableRowPrimitive>
                  ))}
                </IGRPTableBodyPrimitive>
              </IGRPTablePrimitive>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
