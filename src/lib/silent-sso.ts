// Silent SSO (OIDC `prompt=none`) for the login page.
//
// A user who is still signed in at the IdP — typically because they just came
// from another IGRP app on the same IdP — should not have to click "login" to
// get a session in this app. With no session, /login first renders
// `SilentSignIn`, which asks the IdP for a code WITHOUT any user interaction.
// If the IdP session is alive the user lands in the app; if not, the IdP
// answers `login_required`, NextAuth sends the browser back to
// `/login?error=Callback`, and the login form is shown.
//
// This cookie is the loop guard. It is set right before every silent attempt
// and while present the login page shows the form instead of trying again.
// Without it, a silent sign-in that succeeds but whose session the app still
// cannot read would bounce between the app and the IdP forever. It also
// carries the callbackUrl: on a failed attempt NextAuth hands /login an
// ABSOLUTE callbackUrl, which `sanitizeCallbackUrl` rightly rejects.
//
// Module scope must stay edge-safe: no `document` access outside the
// client-only functions below.

import { basePathCookieSuffix } from "@igrp/framework-next-auth/cookies";
import { isOidcManagedProviderId } from "@igrp/framework-next-auth/providers";

import { sanitizeCallbackUrl } from "@/lib/utilities";

/**
 * Scoped by basePath like the auth cookies themselves: a root-path app's cookie
 * lives at `path=/` and reaches every app on the host, so an unscoped name
 * would make one app's attempt suppress another's.
 */
export const SILENT_SSO_COOKIE = `igrp.silent-sso${basePathCookieSuffix(
  process.env.NEXT_PUBLIC_BASE_PATH,
)}`;

// Long enough to cover the IdP round-trip, short enough that a later visit to
// /login tries silently again.
const SILENT_SSO_MAX_AGE_SECONDS = 60;

function cookiePath(): string {
  return process.env.NEXT_PUBLIC_BASE_PATH || "/";
}

function secureAttr(): string {
  return process.env.NODE_ENV === "production" ? "; secure" : "";
}

/**
 * Whether /login should try a silent sign-in before showing the form.
 *
 * - `alreadyTried`: the loop guard above is present.
 * - `error`: NextAuth is reporting a failed sign-in (a failed silent attempt
 *   arrives as `?error=Callback`) — show the form, never retry.
 * - `prompt=none` is an OIDC parameter, so only providers this framework
 *   manages as OIDC get it.
 */
export function shouldAttemptSilentSso({
  alreadyTried,
  error,
  providerId,
}: {
  alreadyTried: boolean;
  error: unknown;
  providerId: string | undefined;
}): boolean {
  if (alreadyTried) return false;
  if (error !== undefined) return false;
  return isOidcManagedProviderId(providerId);
}

/** The callbackUrl a failed silent attempt set out with, if still safe. */
export function silentSsoCallbackUrl(
  cookieValue: string | undefined,
): string | undefined {
  if (!cookieValue) return undefined;
  try {
    return sanitizeCallbackUrl(decodeURIComponent(cookieValue));
  } catch {
    return undefined; // malformed percent-encoding
  }
}

/**
 * Record a silent attempt (or suppress the next one). Client-only — call right
 * before `signIn(..., { prompt: "none" })`, and from the logout completion so
 * a user who just signed out sees the form instead of being signed back in.
 *
 * SameSite=Lax: the IdP's redirect back is a top-level GET navigation.
 */
export function markSilentSsoTried(callbackUrl = "/"): void {
  // biome-ignore lint/suspicious/noDocumentCookie: the Cookie Store API can't set SameSite/path the way this marker needs, and this only runs client-side.
  document.cookie = `${SILENT_SSO_COOKIE}=${encodeURIComponent(callbackUrl)}; path=${cookiePath()}; max-age=${SILENT_SSO_MAX_AGE_SECONDS}; samesite=lax${secureAttr()}`;
}
