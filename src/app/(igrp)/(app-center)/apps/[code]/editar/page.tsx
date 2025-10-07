'use client';

import { use } from 'react';

import { PageHeader } from '@/components/page-header';
import { ApplicationForm } from '@/features/applications/components/app-form';
import { useApplicationByCode } from '@/features/applications/use-applications';
import { ROUTES } from '@/lib/constants';
import { AppCenterLoading } from '@/components/loading';
import { AppCenterNotFound } from '@/components/not-found';

export const dynamic = 'force-dynamic';

export default function EditApplicationPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);
  const { data, isLoading, error } = useApplicationByCode(code);

  if (isLoading && !error) return <AppCenterLoading descrption='Carregando aplicação...' />;

  if (error) throw error;

  if (!data) {
    return (
      <AppCenterNotFound
        iconName='AppWindow'
        title='Nenhuma aplicação encontrada.'
      />
    );
  }

  return (
    <div className='flex flex-col gap-10 animate-fade-in'>
      <PageHeader
        title='Editar Aplicação'
        showBackButton
        linkBackButton={`${ROUTES.APPLICATIONS}/${code}`}
      />

      <ApplicationForm application={data} />
    </div>
  );
}
