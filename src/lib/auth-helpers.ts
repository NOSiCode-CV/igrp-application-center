import type { NextApiRequest } from "next";
import { cookies } from "next/headers";
import {
  refreshOidcAccessToken,
  revokeOidcSession,
} from "@igrp/framework-next-auth";
import { getToken, type JWT } from "next-auth/jwt";

export async function getAccessToken() {
  const cookieStore = await cookies();

  const token = await getToken({
    req: {
      cookies: Object.fromEntries(
        cookieStore.getAll().map((c) => [c.name, c.value]),
      ),
    } as NextApiRequest,
    secret: process.env.NEXTAUTH_SECRET || "",
  });

  return token;
}

/**
 * Refreshes the access token using the refresh token from Keycloak
 * @param token The JWT token to refresh
 * @returns Promise with refreshed token data
 */
export async function refreshAccessToken(token: JWT): Promise<JWT> {
  try {
    return await refreshOidcAccessToken(token, process.env);
  } catch (error) {
    console.error("[Auth] Error refreshing token:", error);
    return { ...token, error: "RefreshAccessTokenError" };
  }
}

export async function signOut(token: JWT) {
  try {
    await revokeOidcSession(token, process.env);
  } catch (error) {
    console.error("Error revoking token", error);
  }
}
