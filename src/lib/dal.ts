import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { Session } from "next-auth";
import { cache } from "react";

import { configLayout } from "@/actions/igrp/layout";
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
  if (!session) {
    const h = await headers();
    const callbackUrl = h.get("x-current-path");
    redirect(
      callbackUrl
        ? `/login?callbackUrl=${encodeURIComponent(callbackUrl)}`
        : "/login",
    );
  }
  return session;
});

/**
 * Resolves the layout config (session + active theme) for a request.
 * The root layout and the (home) layout both need it; this cache ensures the
 * underlying auth + cookies work runs once per request instead of per layout.
 */
export const getLayoutConfig = cache(configLayout);

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
