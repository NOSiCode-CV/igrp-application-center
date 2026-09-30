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

  // Users are the page's primary resource — fail the whole page.
  if (!usersResult.success) {
    throw new HttpStatusError(usersResult.status, usersResult.error);
  }

  // Invitations are secondary — degrade to an empty list.
  const initialInvitations = invitationsResult.success
    ? invitationsResult.data
    : [];

  /* Resolved on the server, not with `useCurrentUser()`: a client fetch would
     leave "Desativar" in your own row's menu until the query settled, which is
     exactly the moment the action must not be offered. If the call fails we
     cannot identify anyone, so the menu keeps its existing behaviour rather
     than guessing. */
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
