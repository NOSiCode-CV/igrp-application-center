import { headers } from "next/headers";

import { auth, serverSession } from "@/lib/auth";
import { isAuthBypass } from "@/lib/utilities";

import { LogoutFlow } from "./logout-flow";

// Mirrors the framework's private TOKEN_REFRESH_BUFFER_MS, the window in which
// getSession() treats a session as expired and runs onSessionExpired.
const REFRESH_BUFFER_MS = 60_000;

/**
 * The one cross-site arrival that must still log out on its own: the
 * onSessionExpired `redirect("/logout")`, which keeps the cross-site
 * Sec-Fetch-Site of a navigation that began elsewhere. It only fires while the
 * raw cookie token still passes middleware's check (otherwise middleware sends
 * the request to /login) and the server session read finds it expired or its
 * refresh failed. A long-stale cookie fails the first test, so it stays gated.
 */
async function isOnSessionExpiredRedirect(): Promise<boolean> {
  try {
    const token = await auth.getAccessToken();
    // Judge expiry only: with the Redis session store, getAccessToken() merges
    // the stored copy, whose `error` middleware never sees (it reads the cookie).
    if (
      typeof token?.expiresAt !== "number" ||
      auth.isTokenExpiredOrFailed({ ...token, error: undefined })
    ) {
      return false;
    }
    const session = await serverSession();
    if (!session) return false;
    const { error, expiresAt } = session as {
      error?: unknown;
      expiresAt?: unknown;
    };
    return (
      error === "RefreshAccessTokenError" ||
      (typeof expiresAt === "number" &&
        expiresAt < Date.now() + REFRESH_BUFFER_MS)
    );
  } catch {
    return false;
  }
}

/**
 * Logout is a state change reachable by GET, so an arrival that started on
 * another site (Sec-Fetch-Site cross-site/same-site) must confirm with a click
 * (CSRF, finding F4). The check runs here, where the route renders, so encoded
 * spellings of the path cannot skip it. In-app entry points (the framework
 * user menu, the session watcher, router.push calls) send same-origin. Typed
 * URLs, bookmarks ("none") and browsers that omit the header keep the old
 * auto-logout.
 */
export default async function LogoutPage() {
  const site = (await headers()).get("sec-fetch-site");
  const crossSite = site === "cross-site" || site === "same-site";
  const needsConfirm =
    crossSite && !isAuthBypass() && !(await isOnSessionExpiredRedirect());
  return <LogoutFlow needsConfirm={needsConfirm} />;
}
