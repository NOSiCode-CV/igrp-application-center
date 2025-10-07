import { ButtonLink } from '@/components/button-link';
import { PageHeader } from '@/components/page-header';
import { ApplicationsListHome } from '@/features/applications/components/app-list-home';
import { ROUTES } from '@/lib/constants';

const appName = 'IGRP';

export default function Home() {
  return (
    <div className='flex flex-col gap-10 animate-fade-in'>
      <PageHeader
        title={`Bem-vindo ao ${appName}`}
        showActions
      >
        <ButtonLink
          href={ROUTES.APPS}
          label='Gerir Aplicação'
          icon='AppWindow'
          variant='outline'
        />

        <ButtonLink
          href={ROUTES.NEW_APPS}
          label='Nova Aplicação'
          icon='LayoutGrid'
        />
      </PageHeader>

      <ApplicationsListHome />
    </div>
  );
}
