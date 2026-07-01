import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";

import type { Session } from "next-auth";

import { configLayout } from "@/actions/igrp/layout";
import { getSession, PREVIEW_SESSION_STUB } from "@/lib/auth";
import { isAuthBypass, sanitizeCallbackUrl } from "@/lib/utilities";

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
    // Single source of truth for the bypass session shape (see lib/auth.ts).
    return PREVIEW_SESSION_STUB as unknown as Session;
  }

  const session = await getSession();
  if (!session) {
    const h = await headers();
    // Sanitize before reflecting into the login redirect (open-redirect / loop guard).
    const safeCallback = sanitizeCallbackUrl(h.get("x-current-path"));
    redirect(
      safeCallback && safeCallback !== "/"
        ? `/login?callbackUrl=${encodeURIComponent(safeCallback)}`
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
