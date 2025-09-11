import { ButtonLink } from '@/components/button-link';
import { PageHeader } from '@/components/page-header';
import { ApplicationList } from '@/features/applications/components/app-list';
import { ROUTES } from '@/lib/constants';

export const dynamic = 'force-dynamic';

export default function ApplicationsPage() {
  return (
    <div className='flex flex-col gap-10 animate-fade-in'>
      <PageHeader
        title='Gerir Aplicações'
        description='Gerir Menus de Aplicações.'
        showActions
      >
        <ButtonLink
          href={ROUTES.NEW_APPS}
          label='Nova Aplicação'
          icon='LayoutGrid'
        />
      </PageHeader>

      <ApplicationList />
    </div>
  );
}
