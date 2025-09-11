import { PageHeader } from '@/components/page-header';
import { ApplicationForm } from '@/features/applications/components/app-form';
import { ROUTES } from '@/lib/constants';

export const dynamic = 'force-dynamic';

export default function NewApplicationPage() {
  return (
    <div className='flex flex-col gap-10 animate-fade-in'>
      <PageHeader
        title='Criar Aplicação'
        showBackButton
        linkBackButton={ROUTES.APPS}
      />

      <ApplicationForm />
    </div>
  );
}
