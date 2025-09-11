// import { DepartmentEditForm } from '@/features/departaments/components/edit-form';

export const dynamic = 'force-dynamic';

export default async function DepartmentEditPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  // const { code } = await params;

  // if (!code) {
  return <div>Invalid department code</div>;
  // }

  // return <DepartmentEditForm code={code} />;
}
