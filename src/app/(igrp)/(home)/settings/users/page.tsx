import type { Metadata } from "next";

import { getCurrentUser, getUserInvitations, getUsers } from "@/actions/user";
import { UserList } from "@/features/users/components/user-list";
import { HttpStatusError } from "@/lib/errors";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Utilizadores",
  description: "Gerir utilizadores, convites e perfis.",
};

export default async function UserPage() {
  const [usersResult, invitationsResult, currentUserResult] = await Promise.all(
    [getUsers(), getUserInvitations(), getCurrentUser()],
  );

  if (!usersResult.success) {
    throw new HttpStatusError(usersResult.status, usersResult.error);
  }

  const initialInvitations = invitationsResult.success
    ? invitationsResult.data
    : [];

  
  const currentUserId = currentUserResult.success
    ? currentUserResult.data.id
    : undefined;

  return (
    <UserList
      initialUsers={usersResult.data}
      initialInvitations={initialInvitations}
      currentUserId={currentUserId}
    />
  );
}
