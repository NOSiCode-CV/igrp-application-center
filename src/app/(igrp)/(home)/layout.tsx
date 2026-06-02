import { IGRPLayoutFull } from "@igrp/framework-next";
import type { IGRPLayoutConfigArgs } from "@igrp/framework-next-types";
import { createConfig } from "@igrp/template-config";
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

  const [user, layoutConfig] = await Promise.all([
    getCurrentUser(),
    getLayoutConfig(),
  ]);

  // A failed current-user load can't be reasoned about — surface it to the
  // error boundary rather than silently rendering (which would also skip the
  // TEMPORARY redirect below).
  if (!user.success) throw new Error(user.error);

  if ((user.data?.status as string | undefined) === TEMPORARY_STATUS) {
    redirect("/invite/pending");
  }

  return (
    <div>{children}</div>
  );
}
