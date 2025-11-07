import type { NextApiRequest } from "next";
import { cookies } from "next/headers";
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
    const issuer = process.env.KEYCLOAK_ISSUER;
    const clientId = process.env.KEYCLOAK_CLIENT_ID;
    const clientSecret = process.env.KEYCLOAK_CLIENT_SECRET;

    if (!issuer || !clientId || !clientSecret) {
      console.error("[Auth] Missing Keycloak configuration for token refresh");
      return { ...token, error: "RefreshAccessTokenError" };
    }

    const refreshResponse = await fetch(
      `${issuer}/protocol/openid-connect/token`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          grant_type: "refresh_token",
          refresh_token: token.refreshToken || "",
        }),
      },
    );

    if (!refreshResponse.ok) {
      const errorText = await refreshResponse.text();
      console.error(
        "[Auth] Failed to refresh token:",
        refreshResponse.status,
        errorText,
      );
      return { ...token, error: "RefreshAccessTokenError" };
    }

    const refreshed = await refreshResponse.json();

    return {
      ...token,
      accessToken: refreshed.access_token,
      expiresAt: Date.now() + (refreshed.expires_in || 3600) * 1000,
      refreshToken: refreshed.refresh_token ?? token.refreshToken, // Fall back to old refresh token
    };
  } catch (error) {
    console.error("[Auth] Error refreshing token:", error);
    return { ...token, error: "RefreshAccessTokenError" };
  }
}
