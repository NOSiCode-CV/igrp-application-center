'use client';

import {
  IGRPCardPrimitive,
  IGRPCardContentPrimitive,
  IGRPCardDescriptionPrimitive,
  IGRPCardHeaderPrimitive,
  IGRPCardTitlePrimitive,
  IGRPSeparatorPrimitive,
  IGRPBadge,
  IGRPTabs,
  IGRPTabItem,
} from '@igrp/igrp-framework-react-design-system';
import { PageHeader } from '@/components/page-header';
import { RolesList } from '../../roles/components/role-list';
import { ROUTES } from '@/lib/constants';
import { useDepartmentByCode } from '../use-departments';
import { AppCenterLoading } from '@/components/loading';
import { AppCenterNotFound } from '@/components/not-found';
import { CopyToClipboard } from '@/components/copy-to-clipboard';
import { PermissionList } from '@/features/permission/components/permission-list';
import { useCurrentUser } from '@/features/users/use-users';

// TODO: See user to create a conetext for get the user all time the user is login
export function DepartmentDetails({ code }: { code: string }) {
  const { data: department, isLoading, error } = useDepartmentByCode(code);
  const {
    data: parentDept,
    isLoading: loadingParentDept,
    error: parentDeptError,
  } = useDepartmentByCode(code);
  const { data: currentUser, isLoading: userLoading, error: userError } = useCurrentUser();

  if (isLoading) return <AppCenterLoading descrption='A carregar departamento...' />;

  if (error) throw error;

  if (!department) {
    return (
      <AppCenterNotFound
        iconName='AppWindow'
        title='Nenhum departamento encontrada.'
      />
    );
  }

  if (userLoading) return <AppCenterLoading descrption='A carregar utilizador...' />;

  if (userError) throw userError;

  if (!currentUser) {
    return (
      <AppCenterNotFound
        iconName='AppWindow'
        title='Utilizador não encontrado.'
      />
    );
  }

  const { name, description, status, parent_code: parent } = department;

  let parentName;

  if (loadingParentDept) parentName = 'A carregar...';
  if (parentDeptError) parentName = 'Erro ao carregar Departamento Pai.';
  parentName = parentDept?.name;

  const tabs: IGRPTabItem[] = [
    {
      label: 'Perfis (Roles)',
      value: 'roles',
      content: (
        <RolesList
          departmentCode={code}
          username={currentUser.username}
        />
      ),
    },
    {
      label: 'Permissões',
      value: 'permissions',
      content: <PermissionList departmentCode={code} />,
    },
  ];

  return (
    <div className='flex-1 p-4 min-w-0 overflow-x-hidden'>
      <section className='space-y-10 max-w-full'>
        <div className='flex flex-col gap-6'>
          <div className='flex flex-col md:flex-row md:items-center md:justify-between gap-4'>
            <PageHeader
              title={name}
              showBackButton
              linkBackButton={ROUTES.DEPARTMENTS}
            />
          </div>

          <div className='flex flex-col gap-8 animate-fade-in motion-reduce:hidden'>
            <IGRPCardPrimitive className='overflow-hidden card-hover gap-3 py-6'>
              <IGRPCardHeaderPrimitive>
                <IGRPCardTitlePrimitive>Informação de Departamento</IGRPCardTitlePrimitive>
                <IGRPCardDescriptionPrimitive>
                  Informações detalhadas do departamento.
                </IGRPCardDescriptionPrimitive>
                <IGRPSeparatorPrimitive className='my-2' />
              </IGRPCardHeaderPrimitive>
              <IGRPCardContentPrimitive>
                <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-sm'>
                  <div className='flex items-center gap-4'>
                    <div className='flex flex-col'>
                      <h3 className='font-normal text-muted-foreground'>Nome</h3>
                      <p className='font-medium text-base'>{name}</p>
                    </div>
                    <CopyToClipboard value={name} />
                  </div>

                  <div className='flex items-center gap-4'>
                    <div>
                      <h3 className='font-normal text-muted-foreground'>Código</h3>
                      <p className='font-medium'>{code}</p>
                    </div>
                    <CopyToClipboard value={code} />
                  </div>

                  <div>
                    <h3 className='font-normal text-muted-foreground'>Estado</h3>
                    <IGRPBadge
                      variant='solid'
                      color={status === 'ACTIVE' ? 'success' : 'destructive'}
                    >
                      {status}
                    </IGRPBadge>
                  </div>

                  {parentName && (
                    <div className='flex items-center gap-4'>
                      <div>
                        <h3 className='font-normal text-muted-foreground'>Departamento Pai</h3>
                        <p className='font-medium'>{parentName}</p>
                      </div>
                    </div>
                  )}

                  <div className='sm:col-span-2 md:col-span-3'>
                    <h3 className='font-normal text-muted-foreground'>Descrição</h3>
                    <p>{description || 'N/A'}</p>
                  </div>
                </div>
              </IGRPCardContentPrimitive>
            </IGRPCardPrimitive>
          </div>
        </div>

        <IGRPTabs
          defaultValue='roles'
          items={tabs}
          className='min-w-0'
          tabContentClassName='px-0'
        />
      </section>
    </div>
  );
}
