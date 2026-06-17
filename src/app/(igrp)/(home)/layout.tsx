import { redirect } from "next/navigation";

import { getCurrentUser } from "@/actions/user";
import { getLayoutConfig, verifySession } from "@/lib/dal";

/** SDK Status enum does not yet model TEMPORARY — cast until it does */
const TEMPORARY_STATUS = "TEMPORARY";

export default async function HomeLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // Resolve the auth gate before fetching authed data, so an invalid session
  // redirects to /login instead of racing the data calls below.
  await verifySession();

  const [user] = await Promise.all([getCurrentUser(), getLayoutConfig()]);

  // A 403 from ACCESS MANAGEMENT means the session's access token doesn't
  // carry the required role — most likely a TEMPORARY user navigating directly
  // to "/", or a user whose token hasn't been refreshed after accepting an
  // invite.  Send them to the pending page instead of crashing.
  if (!user.success) {
    if (user.status === 403) redirect("/invite/pending");
    throw new Error(user.error);
  }

  if ((user.data?.status as string | undefined) === TEMPORARY_STATUS) {
    redirect("/invite/pending");
  }

  return <>{children}</>;
}
