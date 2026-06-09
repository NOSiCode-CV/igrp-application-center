"use server";

import { buildEndSessionUrl } from "@igrp/framework-next-auth/oidc";
import { auth } from "@/lib/auth";

/**
 * Returns the IdP end-session URL for RP-initiated logout, or null when:
 * - auth is disabled (AUTH_PROVIDER=none)
 * - no active session
 * - IdP discovery doc has no end_session_endpoint
 *
 * Must be called BEFORE signOut() — the access token is needed to build the URL.
 */
export async function getLogoutUrl(
  postLogoutRedirectUri: string,
): Promise<string | null> {
  // [logout] The post_logout_redirect_uri is built on the CLIENT from
  // `window.location.origin` — so it carries whatever domain the browser is on.
  // Spring AS only redirects back when this value is registered byte-for-byte in
  // the client's `postLogoutRedirectUris`. A non-localhost domain that isn't
  // registered is the #1 cause of "logout errors / doesn't return to the app".
  console.log("[logout][server] getLogoutUrl called", {
    postLogoutRedirectUri,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    NEXT_PUBLIC_BASE_PATH: process.env.NEXT_PUBLIC_BASE_PATH,
    AUTH_PROVIDER: process.env.AUTH_PROVIDER,
  });

  const token = await auth.getAccessToken();

  // [logout] If this logs `hasToken: false` on the other domain but works on
  // localhost, the session cookie isn't being read — almost always the
  // `__Secure-` cookie-prefix mismatch over https (NEXTAUTH_URL still http /
  // pointing at localhost). Without a token there is no id_token_hint, so RP-
  // initiated logout degrades to local-only.
  console.log("[logout][server] getAccessToken resolved", {
    hasToken: !!token,
    hasIdToken: !!token?.idToken,
    hasRefreshToken: !!token?.refreshToken,
    expiresAt: token?.expiresAt,
    error: token?.error,
  });

  if (!token) {
    console.warn(
      "[logout][server] no active token found — skipping IdP logout redirect",
    );
    return null;
  }

  if (!token.idToken) {
    console.warn(
      "[logout][server] token has no idToken — logout URL will be built without id_token_hint (Spring AS will refuse the redirect-back)",
    );
  }

  const url = await buildEndSessionUrl(
    token,
    process.env,
    postLogoutRedirectUri,
  );

  if (!url) {
    console.warn(
      "[logout][server] buildEndSessionUrl returned null — IdP may not support end_session_endpoint or auth is disabled",
    );
  } else {
    // SECURITY: `params` includes the FULL id_token_hint (a signed ID token /
    // credential). This dumps it in cleartext to the server console/log sink —
    // strip this log (or share its output) only while actively debugging.
    const parsed = new URL(url);
    const params = Object.fromEntries(parsed.searchParams);
    console.log("[logout][server] end-session URL built", {
      endpoint: `${parsed.origin}${parsed.pathname}`,
      params, // ← full values, incl. id_token_hint (sensitive)
      fullUrl: url, // ← the exact URL the form will POST to
    });
  }

  return url;
}
