'use client';

import { useState } from 'react';
// import { useForm } from 'react-hook-form';
// import { zodResolver } from '@hookform/resolvers/zod';
import {
  IGRPButtonPrimitive,
  IGRPInputPrimitive,
  // IGRPLabelPrimitive,
  IGRPTablePrimitive,
  IGRPTableBodyPrimitive,
  IGRPTableCellPrimitive,
  IGRPTableHeadPrimitive,
  IGRPTableHeaderPrimitive,
  IGRPTableRowPrimitive,
  // IGRPBadgePrimitive,
  // IGRPDialogPrimitive,
  // IGRPDialogContentPrimitive,
  // IGRPDialogDescriptionPrimitive,
  // IGRPDialogFooterPrimitive,
  // IGRPDialogHeaderPrimitive,
  // IGRPDialogTitlePrimitive,
  IGRPDropdownMenuPrimitive,
  IGRPDropdownMenuContentPrimitive,
  IGRPDropdownMenuItemPrimitive,
  IGRPDropdownMenuLabelPrimitive,
  IGRPDropdownMenuSeparatorPrimitive,
  IGRPDropdownMenuTriggerPrimitive,
  // IGRPFormPrimitive,
  // IGRPFormControlPrimitive,
  // IGRPFormDescriptionPrimitive,
  // IGRPFormFieldPrimitive,
  // IGRPFormItemPrimitive,
  // IGRPFormLabelPrimitive,
  // useIGRPToast,
  IGRPIcon,
  // IGRPDialogTriggerPrimitive,
  // IGRPFormMessagePrimitive,
  IGRPCardPrimitive,
  IGRPCardHeaderPrimitive,
  IGRPCardTitlePrimitive,
  IGRPCardDescriptionPrimitive,
  IGRPCardContentPrimitive,
} from '@igrp/igrp-framework-react-design-system';
import { useRoles } from '../use-roles';
import { ButtonLink } from '@/components/button-link';
import { AppCenterLoading } from '@/components/loading';
// import { useCurrentUser } from '@/features/users/use-users';
// import { IGRPUserDTO } from '@igrp/platform-access-management-client-ts';
import { RoleFormDialog } from './role-form-dialog';
import { RoleDeleteDialog } from './role-delete-dialog';
import { RoleArgs } from '../role-schemas';

interface RolesListProps {
  departmentCode: string;
  username: string;
}

export function RolesList({ departmentCode, username }: RolesListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [openFormDialog, setOpenFormDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [selectedRole, setSelectedRole] = useState<RoleArgs | undefined>(undefined);
  const [roleToDelete, setRoleToDelete] = useState<{ name: string } | null>(null);

  const { data: roles, isLoading, error: error } = useRoles({ departmentCode, username });

  const handleNewRole = () => {
    setSelectedRole(undefined);
    setOpenFormDialog(true);
  };

  const handleDelete = (name: string) => {
    setRoleToDelete({ name });
    setOpenDeleteDialog(true);
  };  

  const handleEdit = (role: RoleArgs) => {
    setSelectedRole(role);
    setRoleToDelete(null);
    setOpenFormDialog(true);
  };

  if (error) {
    return (
      <div className='rounded-md border py-6'>
        <p className='text-center'>Ocorreu um erro ao carregar roles.</p>
        <p className='text-center'>{error.message}</p>
      </div>
    );
  }

  const filteredRoles = roles?.filter(
    (role) =>
      role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (role.description && role.description.toLowerCase().includes(searchTerm.toLowerCase())),
  );

  const roleEmpty = roles && roles.length === 0;

  return (
    <>
      <div className='flex flex-col gap-3 overflow-hidden py-4 px-3 animate-fade-in'>
        <div>
          <div className='flex items-center justify-between'>
            <div>
              <div className='leading-none font-semibold'>Perfis</div>
              <div className='text-muted-foreground text-sm'>
                Gerir e reorganizar os perfis.
              </div>
            </div>
            {!roleEmpty && (
              <div className='flex justify-end'>
                <ButtonLink
                  onClick={handleNewRole}
                  icon='UserLock'
                  href='#'
                  label='Novo Perfil'
                />
              </div>
            )}
          </div>
        </div>

        <div className='flex flex-col gap-6'>
          <div className='flex justify-between items-center'>
            <div className='relative w-full max-w-sm'>
              <IGRPIcon
                iconName='Search'
                className='absolute left-2.5 top-2.5 size-4 text-muted-foreground'
              />
              <IGRPInputPrimitive
                type='search'
                placeholder='Pesquisar perfil...'
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
          ) : roleEmpty ? (
            <div className='text-center py-6 text-muted-foreground'>
              Nenhum perfil encontrado{' '}
              {searchTerm ? 'Tente ajustar a sua pesquisa.' : 'Adicione um perfil para começar.'}
            </div>
          ) : (
            <div className='rounded-md border'>
              <IGRPTablePrimitive>
                <IGRPTableHeaderPrimitive>
                  <IGRPTableRowPrimitive>
                    <IGRPTableHeadPrimitive>Perfil</IGRPTableHeadPrimitive>
                    <IGRPTableHeadPrimitive>Descrição</IGRPTableHeadPrimitive>
                    <IGRPTableHeadPrimitive className='w-24' />
                  </IGRPTableRowPrimitive>
                </IGRPTableHeaderPrimitive>
                <IGRPTableBodyPrimitive>
                  {filteredRoles?.map((role, i) => (
                    <IGRPTableRowPrimitive key={role.id || i}>
                      <IGRPTableCellPrimitive className='font-medium'>
                        {role.name}
                      </IGRPTableCellPrimitive>
                      <IGRPTableCellPrimitive>{role.description || 'N/A'}</IGRPTableCellPrimitive>
                      <IGRPTableCellPrimitive>
                        <IGRPDropdownMenuPrimitive>
                          <IGRPDropdownMenuTriggerPrimitive asChild>
                            <IGRPButtonPrimitive
                              variant='ghost'
                              className='size-8 p-0'
                            >
                              <span className='sr-only'>Abrir Menu</span>
                              <IGRPIcon
                                iconName='Ellipsis'
                                className='size-4'
                              />
                            </IGRPButtonPrimitive>
                          </IGRPDropdownMenuTriggerPrimitive>
                          <IGRPDropdownMenuContentPrimitive align='end'>
                            <IGRPDropdownMenuLabelPrimitive>Ações</IGRPDropdownMenuLabelPrimitive>
                            <IGRPDropdownMenuItemPrimitive
                              onSelect={() => handleEdit(role)}
                            >
                              <IGRPIcon
                                iconName='Pencil'
                                className='mr-1 size-4'
                              />
                              Editar
                            </IGRPDropdownMenuItemPrimitive>
                            <IGRPDropdownMenuItemPrimitive 
                              onSelect={() => void(0)}
                            >
                              <IGRPIcon
                                iconName='ShieldCheck'
                                className='mr-1 size-4'
                              />
                              Permissões
                            </IGRPDropdownMenuItemPrimitive>
                            <IGRPDropdownMenuSeparatorPrimitive />
                            <IGRPDropdownMenuItemPrimitive
                              onClick={() => handleDelete(role.name)}
                              variant='destructive'
                            >
                              <IGRPIcon
                                iconName='Trash'
                                className='mr-1 size-4'
                              />
                              Eliminar
                            </IGRPDropdownMenuItemPrimitive>
                          </IGRPDropdownMenuContentPrimitive>
                        </IGRPDropdownMenuPrimitive>
                      </IGRPTableCellPrimitive>
                    </IGRPTableRowPrimitive>
                  ))}
                </IGRPTableBodyPrimitive>
              </IGRPTablePrimitive>
            </div>
          )}
        </div>
      </div>

      <RoleFormDialog
        open={openFormDialog}
        onOpenChange={setOpenFormDialog}
        departmentCode={departmentCode}
        role={selectedRole}        
      />

      {roleToDelete && (
        <RoleDeleteDialog
          open={openDeleteDialog}
          onOpenChange={setOpenDeleteDialog}
          roleToDelete={roleToDelete}
        />
      )}
    </>
  );
}
