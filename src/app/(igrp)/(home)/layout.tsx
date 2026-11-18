import { redirect } from "next/navigation";

import { getCurrentUser } from "@/actions/user";
import { getLayoutConfig, verifySession } from "@/lib/dal";

const TEMPORARY_STATUS = "TEMPORARY";

export default async function HomeLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  await verifySession();

  const [user] = await Promise.all([getCurrentUser(), getLayoutConfig()]);

  if (!user.success) {
    if (user.status === 403) redirect("/invite/pending");
    throw new Error(user.error);
  }

  if ((user.data?.status as string | undefined) === TEMPORARY_STATUS) {
    redirect("/invite/pending");
  }

  return <>{children}</>;
}
