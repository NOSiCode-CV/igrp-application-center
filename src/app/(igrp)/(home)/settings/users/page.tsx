import { getUsers, getUserInvitations } from "@/actions/user";
import { UserListFilters } from "@/features/users/components/user-list-filters";
import { UserListTable } from "@/features/users/components/user-list-table";

export const dynamic = "force-dynamic";

export default async function UserPage({
  searchParams,
}: {
  searchParams: Promise<{
    name?: string;
    email?: string;
    departmentCode?: string;
  }>;
}) {
  const params = await searchParams;

  const [usersResult, invitationsResult] = await Promise.all([
    getUsers({
      name: params.name,
      email: params.email,
      departmentCode: params.departmentCode,
    }),
    getUserInvitations(),
  ]);

  const initialUsers = usersResult.success ? usersResult.data : [];
  const initialInvitations = invitationsResult.success
    ? invitationsResult.data
    : [];

  return (
    <div className="flex flex-col gap-4 p-6">
      <UserListFilters />
      <UserListTable
        initialUsers={initialUsers}
        initialInvitations={initialInvitations}
      />
    </div>
  );
}
