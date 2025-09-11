'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  IGRPDropdownMenuCheckboxItemPrimitive,
  IGRPInputPrimitive,
  IGRPBadgePrimitive,
  IGRPButtonPrimitive,
  IGRPTablePrimitive,
  IGRPTableBodyPrimitive,
  IGRPTableCellPrimitive,
  IGRPTableHeadPrimitive,
  IGRPTableHeaderPrimitive,
  IGRPTableRowPrimitive,
  IGRPIcon,
  IGRPDropdownMenuPrimitive,
  IGRPDropdownMenuItemPrimitive,
  IGRPDropdownMenuContentPrimitive,
  IGRPDropdownMenuSeparatorPrimitive,
  IGRPDropdownMenuLabelPrimitive,
  IGRPDropdownMenuTriggerPrimitive,
  IGRPBadge,
} from '@igrp/igrp-framework-react-design-system';

import { ButtonLink } from '@/components/button-link';
import { AppCenterLoading } from '@/components/loading';
import { PageHeader } from '@/components/page-header';
import { ROUTES, STATUS_OPTIONS } from '@/lib/constants';
import { statusSchema } from '@/schemas/global';

import { DepartmentCreateDialog } from './dept-form-dialog';
import { DepartmentDeleteDialog } from './dept-delete-dialog';
import { useDepartments } from '../use-departments';
import { DepartmentArgs } from '../dept-schemas';
// import { useCurrentUser } from '@/features/users/use-users';

export function DepartmentList() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [openFormDialog, setOpenFormDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [currentDept, setCurrentDept] = useState<DepartmentArgs | undefined>(undefined);
  const [deptToDelete, setDeptToDelete] = useState<{ code: string; name: string } | null>(null);

  const { data: departments, isLoading, error, refetch } = useDepartments();

  if (isLoading || !departments) {
    return <AppCenterLoading descrption='Carregando departamentos...' />;
  }

  if (error) throw error;

  const filteredDepartments = departments.filter((dept) => {
    const matchesSearch =
      dept.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dept.code.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter.length === 0 || statusFilter.includes(dept.status);

    return matchesSearch && matchesStatus;
  });

  const emptyList = departments.length === 0;

  const handleOpen = () => {
    refetch();
    setDeptToDelete(null);
  };

  const handleDelete = (code: string, name: string) => {
    setDeptToDelete({ code, name });
    setOpenDeleteDialog(true);
  };

  return (
    <div className='flex flex-col gap-10 animate-fade-in'>
      <PageHeader
        title='Gestão de Departamentos'
        description='Gerir departamentos e roles.'
        showActions
      >
        {!emptyList && (
          <ButtonLink
            onClick={() => setOpenFormDialog(true)}
            icon='GlobeLock'
            href='#'
            label='Novo Departamento'
          />
        )}
      </PageHeader>

      {emptyList ? (
        <div className='rounded-md border'>
          <div className='text-center py-8 text-muted-foreground'>
            <p className='mb-2'>Nenhum departamento encontrado.</p>
            <IGRPButtonPrimitive
              onClick={() => setOpenFormDialog(true)}
              variant='outline'
            >
              <IGRPIcon
                iconName='Plus'
                className='mr-1 size-4'
              />
              Criar novo Departamento
            </IGRPButtonPrimitive>
          </div>
        </div>
      ) : (
        <>
          <div className='flex flex-col sm:flex-row gap-2 mt-4'>
            <div className='relative w-full max-w-sm'>
              <IGRPIcon
                iconName='Search'
                className='absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground'
              />
              <IGRPInputPrimitive
                type='search'
                placeholder='Pesquisar departamentos...'
                className='w-full bg-background pl-8'
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <IGRPDropdownMenuPrimitive>
              <IGRPDropdownMenuTriggerPrimitive asChild>
                <IGRPButtonPrimitive
                  variant='outline'
                  className='gap-2'
                >
                  <IGRPIcon
                    iconName='ListFilter'
                    className='size-4 mr-1'
                  />
                  Estados
                </IGRPButtonPrimitive>
              </IGRPDropdownMenuTriggerPrimitive>
              <IGRPDropdownMenuContentPrimitive
                align='end'
                className='w-40'
              >
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

          <div className='rounded-md border'>
            <IGRPTablePrimitive>
              <IGRPTableHeaderPrimitive>
                <IGRPTableRowPrimitive>
                  <IGRPTableHeadPrimitive>Nome</IGRPTableHeadPrimitive>
                  <IGRPTableHeadPrimitive>Código</IGRPTableHeadPrimitive>
                  <IGRPTableHeadPrimitive>Descrição</IGRPTableHeadPrimitive>
                  <IGRPTableHeadPrimitive>Estado</IGRPTableHeadPrimitive>
                  <IGRPTableHeadPrimitive className='w-24' />
                </IGRPTableRowPrimitive>
              </IGRPTableHeaderPrimitive>
              <IGRPTableBodyPrimitive>
                {filteredDepartments.map((dept) => (
                  <IGRPTableRowPrimitive key={dept.id}>
                    <IGRPTableCellPrimitive>
                      <ButtonLink
                        href={`${ROUTES.DEPARTMENTS}/${dept.code}`}
                        className='cursor-pointer hover:underline text-primary'
                        icon={''}
                        variant='link'
                        label={dept.name}
                      />
                    </IGRPTableCellPrimitive>
                    <IGRPTableCellPrimitive>
                      <IGRPBadge
                        color='primary'
                        variant='soft'
                      >
                        {dept.code}
                      </IGRPBadge>
                    </IGRPTableCellPrimitive>
                    <IGRPTableCellPrimitive>{dept.description || 'N/A'}</IGRPTableCellPrimitive>
                    <IGRPTableCellPrimitive>
                      <IGRPBadgePrimitive
                        variant={dept.status === statusSchema.enum.ACTIVE ? 'default' : 'outline'}
                      >
                        {dept.status}
                      </IGRPBadgePrimitive>
                    </IGRPTableCellPrimitive>
                    <IGRPTableCellPrimitive>
                      <IGRPDropdownMenuPrimitive>
                        <IGRPDropdownMenuTriggerPrimitive asChild>
                          <IGRPButtonPrimitive
                            variant='ghost'
                            className='h-8 w-8 p-0'
                          >
                            <span className='sr-only'>Open menu</span>
                            <IGRPIcon
                              iconName='Ellipsis'
                              className='size-4'
                            />
                          </IGRPButtonPrimitive>
                        </IGRPDropdownMenuTriggerPrimitive>
                        <IGRPDropdownMenuContentPrimitive align='end'>
                          <IGRPDropdownMenuLabelPrimitive>Ações</IGRPDropdownMenuLabelPrimitive>
                          <IGRPDropdownMenuSeparatorPrimitive className='my-1' />
                          <IGRPDropdownMenuItemPrimitive asChild>
                            <Link href={`${ROUTES.DEPARTMENTS}/${dept.code}`}>
                              <IGRPIcon
                                iconName='Eye'
                                className='mr-1 size-4'
                              />
                              Ver
                            </Link>
                          </IGRPDropdownMenuItemPrimitive>
                          <IGRPDropdownMenuItemPrimitive
                            onSelect={() => {
                              setCurrentDept(dept);
                              setOpenFormDialog(true);
                            }}
                          >
                            <IGRPIcon
                              iconName='Pencil'
                              className='mr-1 size-4'
                            />
                            Editar
                          </IGRPDropdownMenuItemPrimitive>
                          <IGRPDropdownMenuSeparatorPrimitive />
                          <IGRPDropdownMenuItemPrimitive
                            variant='destructive'
                            onClick={() => handleDelete(dept.code, dept.name)}
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
        </>
      )}

      <DepartmentCreateDialog
        open={openFormDialog}
        onOpenChange={(open) => setOpenFormDialog(open)}
        handleOpenForm={handleOpen}
        department={currentDept}
      />

      {deptToDelete && (
        <DepartmentDeleteDialog
          open={openDeleteDialog}
          onOpenChange={setOpenDeleteDialog}
          deptToDelete={deptToDelete}
        />
      )}
    </div>
  );
}
