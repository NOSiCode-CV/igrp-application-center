import { getUserInvitations, getUsers } from "@/actions/user";
import { UserListTable } from "@/features/users/components/user-list-table";
import { HttpStatusError } from "@/lib/errors";

export const dynamic = "force-dynamic";

export default async function UserPage() {
  const [usersResult, invitationsResult] = await Promise.all([
    getUsers(),
    getUserInvitations(),
  ]);

  // Users are the page's primary resource — fail the whole page.
  if (!usersResult.success) {
    throw new HttpStatusError(usersResult.status, usersResult.error);
  }

  // Invitations are secondary — degrade to an empty list.
  const initialInvitations = invitationsResult.success
    ? invitationsResult.data
    : [];

  return (
    <UserListTable
      initialUsers={usersResult.data}
      initialInvitations={initialInvitations}
    />
  );
}
