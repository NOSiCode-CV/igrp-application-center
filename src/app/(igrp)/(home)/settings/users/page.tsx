import { getUserInvitations, getUsers } from "@/actions/user";
import { UserListTable } from "@/features/users/components/user-list-table";

export const dynamic = "force-dynamic";

export default async function UserPage() {
  const [usersResult, invitationsResult] = await Promise.all([
    getUsers(),
    getUserInvitations(),
  ]);

  const initialUsers = usersResult.success ? usersResult.data : [];
  const initialInvitations = invitationsResult.success
    ? invitationsResult.data
    : [];

  return (
    <UserListTable
      initialUsers={initialUsers}
      initialInvitations={initialInvitations}
    />
  );
}