// Shared marker for the deferred-teardown logout flow (Option A).
//
// The logout page sets this cookie *instead of* calling signOut() before it
// POSTs to the IdP end_session_endpoint. The local session is torn down only
// once the IdP redirects the browser back to /login: `LogoutCompletion` reads
// this cookie there, runs signOut(), then clears it. The middleware backstop
// reads the same cookie to force an abandoned logout to complete on the next
// protected-route request (see src/middleware.ts).
//
// Module scope must stay edge-safe: middleware imports LOGOUT_PENDING_COOKIE,
// so no `document` access outside the client-only functions below.

/** Cookie name shared by the logout page, /login completion, and middleware. */
export const LOGOUT_PENDING_COOKIE = "logout_pending";

// 5 min: long enough for the IdP round-trip, short enough to self-heal if the
// user abandons the flow at the IdP.
const LOGOUT_PENDING_MAX_AGE_SECONDS = 300;

// Scope to the app's basePath so the marker can't leak across apps sharing a
// domain. NEXT_PUBLIC_* is inlined client-side at build time.
function cookiePath(): string {
  return process.env.NEXT_PUBLIC_BASE_PATH || "/";
}

function secureAttr(): string {
  return process.env.NODE_ENV === "production" ? "; secure" : "";
}

/**
 * Set the logout-pending marker. Client-only — call immediately before the
 * top-level IdP end-session POST.
 *
 * SameSite=Lax is required: the IdP's redirect back to /login is a top-level
 * GET navigation, and Lax sends the cookie on top-level GET navigations.
 */
export function markLogoutPending(): void {
  // biome-ignore lint/suspicious/noDocumentCookie: the Cookie Store API can't set SameSite/path the way this marker needs, and this only runs client-side.
  document.cookie = `${LOGOUT_PENDING_COOKIE}=1; path=${cookiePath()}; max-age=${LOGOUT_PENDING_MAX_AGE_SECONDS}; samesite=lax${secureAttr()}`;
}

/** Clear the marker. Client-only — call after signOut() completes on /login. */
export function clearLogoutPending(): void {
  // biome-ignore lint/suspicious/noDocumentCookie: see markLogoutPending — intentional client-only cookie write.
  document.cookie = `${LOGOUT_PENDING_COOKIE}=; path=${cookiePath()}; max-age=0; samesite=lax${secureAttr()}`;
}
