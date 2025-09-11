'use client';

import { Fragment } from 'react';

import { AppCenterNotFound } from '@/components/not-found';
import { AppCenterLoading } from '@/components/loading';
import { ApplicationCard } from '@/features/applications/components/app-card';
import { useApplications } from '@/features/applications/use-applications';

export function ApplicationsListHome() {
  const { data: applications, isLoading, error } = useApplications();

  if (isLoading && !error) return <AppCenterLoading descrption='Carregando aplicações...' />;

  if (error) throw error;

  if (!applications || applications.length === 0) {
    return (
      <AppCenterNotFound
        iconName='AppWindow'
        title='Nenhuma aplicação encontrada.'
      >
        Clique em &nbsp;
        <span className='font-semibold'>“Nova Aplicação”</span>
      </AppCenterNotFound>
    );
  }

  console.log({ applications, isLoading, error });

  const activeApps = applications.filter((app) => app.status === 'ACTIVE').slice(0, 6);

  return (
    <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
      {activeApps.map((app) => {
        return (
          <Fragment key={app.id}>
            <ApplicationCard app={app} />
          </Fragment>
        );
      })}
    </div>
  );
}
