import { cache } from "react";
import { redirect } from "next/navigation";
import type { Session } from "next-auth";

import { getSession } from "@/lib/auth";
import { isAuthBypass } from "@/lib/utils";

/**
 * Verifies the current request is authenticated.
 * Runs once per request regardless of how many server components call it (React cache).
 *
 * - In bypass mode (IGRP_PREVIEW_MODE or AUTH_PROVIDER=none): returns a stub session.
 * - Otherwise: calls getSession() which handles expired tokens (redirects to /logout).
 * - If no session exists: redirects to /login.
 */
export const verifySession = cache(async (): Promise<Session> => {
  if (isAuthBypass()) {
    // Stub covers the minimal fields the layout needs; cast is safe in dev/preview only.
    return {
      user: { name: "Preview User", email: "preview@example.com" },
      accessToken: "preview-token",
      expires: "9999-12-31T23:59:59.999Z",
    } as unknown as Session;
  }

  const session = await getSession();
  if (!session) redirect("/login");
  return session;
});

/**
 * Returns only the user fields UI components need — never the raw JWT,
 * refresh token, or internal error flags.
 */
export async function getAuthenticatedUser() {
  const session = await verifySession();
  return {
    id: (session.user as { id?: string } | undefined)?.id ?? "",
    name: session.user?.name ?? "",
    email: session.user?.email ?? "",
    accessToken: (session as { accessToken?: string }).accessToken ?? "",
  };
}
