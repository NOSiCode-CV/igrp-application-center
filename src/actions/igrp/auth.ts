"use server";

import { cookies, headers } from "next/headers";

import { igrpIsSecureRequest } from "@igrp/framework-next/i18n";
import {
  HOST_LOGOUT_COOKIE,
  HOST_LOGOUT_COOKIE_MAX_AGE_S,
} from "@igrp/framework-next-auth/cookies";
import { buildEndSessionUrl } from "@igrp/framework-next-auth/oidc";

import { auth } from "@/lib/auth";
import { isAuthBypass } from "@/lib/utilities";

/**
 * Writes the host-wide logout signal (`igrp.logout-at`, unix seconds, Path=/).
 * Runs as a server action so the timestamp comes from a server clock; every
 * co-hosted app's middleware ends sessions that predate it.
 */
export async function markHostLogout(): Promise<void> {
  if (isAuthBypass()) return;
  (await cookies()).set(
    HOST_LOGOUT_COOKIE,
    String(Math.floor(Date.now() / 1000)),
    {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure: igrpIsSecureRequest(await headers()),
      maxAge: HOST_LOGOUT_COOKIE_MAX_AGE_S,
    },
  );
}

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

  const token = await auth.getAccessToken();

  // [logout] If `hasToken` is false on a non-localhost domain but works on
  // localhost, the session cookie isn't being read — almost always a
  // `__Secure-` cookie-prefix mismatch over https (NEXTAUTH_URL still http /
  // pointing at localhost). Without a token there is no id_token_hint, so RP-
  // initiated logout degrades to local-only.

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
  }

  return url;
}
