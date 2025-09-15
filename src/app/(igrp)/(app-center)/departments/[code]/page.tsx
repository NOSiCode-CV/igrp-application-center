import { DepartmentDetails } from '@/features/departments/components/dept-details';

export const dynamic = 'force-dynamic';

export default async function DepartmentPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  return <DepartmentDetails code={code} />;
}
