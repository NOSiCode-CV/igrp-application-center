'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  IGRPButtonPrimitive,
  IGRPInputPrimitive,
  IGRPTablePrimitive,
  IGRPTableBodyPrimitive,
  IGRPTableCellPrimitive,
  IGRPTableHeadPrimitive,
  IGRPTableHeaderPrimitive,
  IGRPTableRowPrimitive,
  IGRPDropdownMenuPrimitive,
  IGRPDropdownMenuContentPrimitive,
  IGRPDropdownMenuItemPrimitive,
  IGRPDropdownMenuLabelPrimitive,
  IGRPDropdownMenuSeparatorPrimitive,
  IGRPDropdownMenuTriggerPrimitive,
  IGRPIcon,
  IGRPDropdownMenuCheckboxItemPrimitive,
  IGRPBadge,
  IGRPBadgePrimitive,
  cn,
} from '@igrp/igrp-framework-react-design-system';
import { useRoles } from '../use-roles';
import { ButtonLink } from '@/components/button-link';
import { RoleFormDialog } from './role-form-dialog';
import { RoleDeleteDialog } from './role-delete-dialog';
import { RoleArgs } from '../role-schemas';
import { ROUTES, STATUS_OPTIONS } from '@/lib/constants';
import { showStatus, statusClass } from '@/lib/utils';
import { RoleDetails } from './role-permissions-dialog';

interface RolesListProps {
  departmentCode: string;
  username: string;
}

export function RolesList({ departmentCode, username }: RolesListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [openFormDialog, setOpenFormDialog] = useState(false);
  const [openDetailsDialog, setOpenDetailsDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [selectedRole, setSelectedRole] = useState<RoleArgs | undefined>(undefined);
  const [roleToDelete, setRoleToDelete] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string[]>([]);

  const router = useRouter();

  const { data: roles, isLoading, error: error } = useRoles({ departmentCode, username });

  const handleNewRole = () => {
    setSelectedRole(undefined);
    setOpenDetailsDialog(false);
    setOpenFormDialog(true);
  };

  const handleDelete = (name: string) => {
    setRoleToDelete(name);
    setOpenDeleteDialog(true);
  };

  const handleEdit = (role: RoleArgs) => {
    setSelectedRole(role);
    setRoleToDelete(null);
    setOpenDetailsDialog(false);
    setOpenFormDialog(true);
  };

  const handlePermissions = (role: RoleArgs) => {
    setSelectedRole(role);
    setRoleToDelete(null);
    setOpenFormDialog(false);
    setOpenDetailsDialog(true);
  };

  if (error) {
    return (
      <div className='rounded-md border py-6'>
        <p className='text-center'>Ocorreu um erro ao carregar roles.</p>
        <p className='text-center'>{error.message}</p>
      </div>
    );
  }

  const filteredRoles = roles?.filter((role) => {
    const matchesSearch =
      role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (role.description && role.description.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter.length === 0 || statusFilter.includes(role.status);

    return matchesSearch && matchesStatus;
  });

  const roleEmpty = roles && roles.length === 0;

  return (
    <>
      <div className='flex flex-col gap-3 overflow-hidden py-4 px-3 animate-fade-in'>
        <div>
          <div className='flex items-center justify-between'>
            <div>
              <div className='leading-none font-semibold'>Perfis</div>
              <div className='text-muted-foreground text-sm'>Gerir e reorganizar os perfis.</div>
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
          <div className='flex flex-col sm:flex-row items-start gap-4 w-full min-w-0'>
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
            <div className='flex flex-wrap gap-2 flex-shirnk-0'>
              <IGRPDropdownMenuPrimitive>
                <IGRPDropdownMenuTriggerPrimitive asChild>
                  <IGRPButtonPrimitive
                    variant='outline'
                    className='gap-2'
                  >
                    <IGRPIcon
                      iconName='ListFilter'
                      strokeWidth={2}
                    />
                    Estado {statusFilter.length > 0 && `(${statusFilter.length})`}
                  </IGRPButtonPrimitive>
                </IGRPDropdownMenuTriggerPrimitive>
                <IGRPDropdownMenuContentPrimitive
                  align='start'
                  className='w-40'
                >
                  <IGRPDropdownMenuSeparatorPrimitive />
                  {STATUS_OPTIONS.map(({ value, label }) => (
                    <IGRPDropdownMenuCheckboxItemPrimitive
                      key={value}
                      checked={statusFilter.includes(value)}
                      onCheckedChange={(checked) => {
                        setStatusFilter(
                          checked
                            ? [...statusFilter, value]
                            : statusFilter.filter((s) => s !== value),
                        );
                      }}
                    >
                      {label}
                    </IGRPDropdownMenuCheckboxItemPrimitive>
                  ))}
                  {statusFilter.length > 0 && (
                    <>
                      <IGRPDropdownMenuSeparatorPrimitive />
                      <IGRPDropdownMenuItemPrimitive
                        onClick={() => setStatusFilter([])}
                        className='cursor-pointer hover:bg-primary hover:text-primary-foreground'
                      >
                        <IGRPIcon
                          iconName='X'
                          className='mr-1'
                          strokeWidth={2}
                        />
                        Limpar
                      </IGRPDropdownMenuItemPrimitive>
                    </>
                  )}
                </IGRPDropdownMenuContentPrimitive>
              </IGRPDropdownMenuPrimitive>
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
                    <IGRPTableHeadPrimitive className='whitespace-nowrap'>
                      Perfil
                    </IGRPTableHeadPrimitive>
                    <IGRPTableHeadPrimitive className='whitespace-nowrap'>
                      Descrição
                    </IGRPTableHeadPrimitive>
                    <IGRPTableHeadPrimitive className='whitespace-nowrap'>
                      Estado
                    </IGRPTableHeadPrimitive>
                    <IGRPTableHeadPrimitive className='w-24' />
                  </IGRPTableRowPrimitive>
                </IGRPTableHeaderPrimitive>
                <IGRPTableBodyPrimitive>
                  {filteredRoles?.map((role) => (
                    <IGRPTableRowPrimitive key={role.id}>
                      <IGRPTableCellPrimitive className='font-medium'>
                        {role.name}
                      </IGRPTableCellPrimitive>
                      <IGRPTableCellPrimitive>{role.description || 'N/A'}</IGRPTableCellPrimitive>
                      <IGRPTableCellPrimitive className='whitespace-nowrap'>
                        <IGRPBadgePrimitive className={cn(statusClass(role.status), 'capitalize')}>
                          {showStatus(role.status)}
                        </IGRPBadgePrimitive>
                      </IGRPTableCellPrimitive>
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
                            <IGRPDropdownMenuItemPrimitive onSelect={() => handleEdit(role)}>
                              <IGRPIcon
                                iconName='Pencil'
                                className='mr-1 size-4'
                              />
                              Editar
                            </IGRPDropdownMenuItemPrimitive>
                            <IGRPDropdownMenuItemPrimitive onSelect={() => handlePermissions(role)}>
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

      {selectedRole && (
        <RoleDetails
          departmentCode={departmentCode}
          role={selectedRole}
          open={openDetailsDialog}
          onOpenChange={setOpenDetailsDialog}
        />
      )}
    </>
  );
}
