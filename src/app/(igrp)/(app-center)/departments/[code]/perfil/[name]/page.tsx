import { RoleDetails } from '../../../../../../../features/roles/components/role-permissions-dialog';

export const dynamic = 'force-dynamic';

export default async function DepartmentRolePage({
  params,
}: {
  params: { code: string; name: string };
}) {
  const { code, name } = await params;
  return (
    <RoleDetails
      name={name}
      departmentCode={code}
    />
  );
}
