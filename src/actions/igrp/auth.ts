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
  const token = await auth.getAccessToken();

  if (!token) {
    console.warn(
      "[getLogoutUrl] no active token found — skipping IdP logout redirect",
    );
    return null;
  }

  if (!token.idToken) {
    console.warn(
      "[getLogoutUrl] token has no idToken — logout URL will be built without id_token_hint",
    );
  }

  const url = await buildEndSessionUrl(
    token,
    process.env,
    postLogoutRedirectUri,
  );

  if (!url) {
    console.warn(
      "[getLogoutUrl] buildEndSessionUrl returned null — IdP may not support end_session_endpoint or auth is disabled",
    );
  }

  return url;
}
