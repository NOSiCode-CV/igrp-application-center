import type {
  NextAuthOptions,
  Session,
  TokenSet,
} from "@igrp/framework-next-auth";
import type { JWT } from "@igrp/framework-next-auth/jwt";
import KeycloakProvider from "next-auth/providers/keycloak";

const isProd = process.env.NODE_ENV === "production";
const baseUrl = process.env.NEXTAUTH_URL ?? "";

// According to NextAuth.js docs: https://next-auth.js.org/getting-started/client#custom-base-path
//
// WITHOUT basePath (app at root):
//   NEXTAUTH_URL=https://example.com
//   NextAuth automatically adds /api/auth
//
// WITH custom basePath:
//   NEXTAUTH_URL=https://example.com/custom-route/api/auth
//   You MUST include the full path with /api/auth

// Validation checks removed - console logging disabled

// Validate and fix invalid URLs (like 0.0.0.0)
const validBaseUrl = baseUrl.includes("0.0.0.0")
  ? process.env.IGRP_APP_CENTER_URL || baseUrl
  : baseUrl;

// Don't set domain for cookies - let browser handle it automatically
// This prevents issues with subdomains and different environments
const cookieDomain = undefined;

export const authOptions: NextAuthOptions = {
  providers: [
    KeycloakProvider({
      clientId: process.env.KEYCLOAK_CLIENT_ID || "",
      clientSecret: process.env.KEYCLOAK_CLIENT_SECRET || "",
      issuer: process.env.KEYCLOAK_ISSUER || "",
    }),
  ],

  secret: process.env.NEXTAUTH_SECRET,

  session: {
    strategy: "jwt",
    maxAge: 4 * 60 * 60, // 4 hours
  },

  cookies: {
    sessionToken: {
      name: isProd
        ? "__Secure-next-auth.session-token"
        : "next-auth.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: process.env.IGRP_APP_BASE_PATH || "/",
        secure: isProd,
        ...(cookieDomain ? { domain: cookieDomain } : {}),
      },
    },
  },

  callbacks: {
    async redirect({ url, baseUrl: nextAuthBaseUrl }) {
      const basePath = process.env.IGRP_APP_BASE_PATH || "";
      // Use validBaseUrl instead of baseUrl to handle 0.0.0.0
      // Important: When using custom basePath, validBaseUrl already includes basePath + /api/auth
      // Example: https://apisix.zingdevelopers.com/igrp-application-center/api/auth
      const baseUrl = validBaseUrl || nextAuthBaseUrl;

      // Extract the domain without /api/auth for building redirect URLs
      const baseDomain = baseUrl.replace("/api/auth", "");

      // CRITICAL FIX: Detect and fix URLs with duplicated basePath
      // NextAuth sometimes creates URLs like: /basePath/basePath/ or /basePath/api/auth/basePath/
      if (basePath) {
        // Fix pattern 1: /basePath/api/auth/basePath/ -> /basePath/api/auth/
        if (url.includes(basePath + "/api/auth" + basePath)) {
          url = url.replace(
            basePath + "/api/auth" + basePath,
            basePath + "/api/auth",
          );
        }
        // Fix pattern 2: /basePath/basePath/ -> /basePath/
        else if (url.includes(basePath + basePath + "/")) {
          url = url.replace(basePath + basePath + "/", basePath + "/");
        }
        // Fix pattern 3: domain.com/basePath/basePath -> domain.com/basePath/
        else if (url.includes(basePath + basePath)) {
          url = url.replace(basePath + basePath, basePath);
        }
      }

      // Handle relative paths (e.g., "/", "/dashboard")
      if (url.startsWith("/")) {
        // Check if the relative path already has basePath
        if (basePath && url.startsWith(basePath)) {
          return `${baseDomain}${url}`;
        }
        return `${baseDomain}${basePath}${url}`;
      }

      // Handle full URLs
      if (url.startsWith("http")) {
        try {
          const urlObj = new URL(url);
          const pathname = urlObj.pathname;

          // Check if pathname already has basePath
          if (basePath && pathname.startsWith(basePath)) {
            return url;
          }

          // If URL is using our domain, add basePath
          if (url.startsWith(baseDomain)) {
            return `${baseDomain}${basePath}${pathname}`;
          }

          // External URL, return as-is
          return url;
        } catch (error) {
          console.error(":: AUTH REDIRECT - Error parsing URL:", error);
          return url;
        }
      }

      // Default fallback - go to root with basePath
      return `${baseDomain}${basePath}/`;
    },
    async jwt({ token, user, account, profile }) {
      if (account) {
        if (user && !("user" in token)) {
          token.user = {
            id: token.sub ?? user.id ?? undefined,
            name: user.name ?? profile?.name ?? null,
            email: user.email ?? profile?.email ?? null,
          };
        }
        // Store only accessToken and refreshToken (no idToken to reduce size)
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.expiresAt = account.expires_at;

        delete token.error;

        return token;
      }

      if (token.expiresAt && Date.now() < token.expiresAt * 1000 - 60_000) {
        return token;
      }

      try {
        if (!token.refreshToken) {
          return { ...token, error: "RefreshAccessTokenError" };
        }

        const response = await requestRefreshOfAccessToken(token);
        const tokens: TokenSet = await response.json();

        if (!response.ok) {
          throw tokens;
        }

        const updatedToken: JWT = {
          ...token,
          user: token.user,
          accessToken: tokens.access_token,
          expiresAt: Math.floor(Date.now() / 1000 + Number(tokens.expires_in)),
          refreshToken: tokens.refresh_token || token.refreshToken,
          error: undefined,
        };
        return updatedToken;
      } catch (error) {
        console.error(":: AUTH JWT - Error refreshing access token:", error);
        return { ...token, error: "RefreshAccessTokenError" };
      }
    },
    async session({ session, token }) {
      session.user = token.user as Session["user"];
      session.accessToken = token.accessToken;
      session.error = token.error;
      session.expiresAt = token.expiresAt;
      return session;
    },
  },

  pages: {
    signIn: "/login",
    error: "/login",
  },
};

export async function requestRefreshOfAccessToken(token: JWT) {
  if (
    !process.env.KEYCLOAK_ISSUER ||
    !process.env.KEYCLOAK_CLIENT_ID ||
    !process.env.KEYCLOAK_CLIENT_SECRET
  ) {
    throw new Error("Missing Keycloak configuration for token refresh.");
  }

  if (!token.refreshToken) {
    throw new Error("Missing refresh token.");
  }

  return await fetch(
    `${process.env.KEYCLOAK_ISSUER}/protocol/openid-connect/token`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.KEYCLOAK_CLIENT_ID!,
        client_secret: process.env.KEYCLOAK_CLIENT_SECRET!,
        grant_type: "refresh_token",
        refresh_token: String(token.refreshToken),
      }),
    },
  );
}

export async function buildKeycloakEndSessionUrl(jwt: JWT): Promise<string> {
  const issuer = process.env.KEYCLOAK_ISSUER;
  if (!issuer) throw new Error("KEYCLOAK_ISSUER not set");

  // Build URL safely - issuer is already checked above
  const url = new URL(`${issuer}/protocol/openid-connect/logout`);

  // Get fresh id_token from refresh token (since we don't store it to reduce JWT size)
  let idToken: string | undefined;

  if (jwt?.refreshToken) {
    try {
      const response = await requestRefreshOfAccessToken(jwt);

      if (response.ok) {
        const tokens: TokenSet = await response.json();
        idToken = tokens.id_token;
      }
    } catch (error) {
      // Silently handle error
      console.error(":: AUTH LOGOUT - Error refreshing access token:", error);
    }
  }

  if (idToken) {
    url.searchParams.set("id_token_hint", idToken);
  }

  // TEMPORARY: Removed post_logout_redirect_uri because it's not configured in Keycloak
  // To enable automatic redirect after logout, configure in Keycloak:
  // Clients -> access-management -> Settings -> Valid Post Logout Redirect URIs
  // Add: http://localhost:3000/* and your production URL

  // const loginUrl = '/login';
  // const basePath = process.env.IGRP_APP_BASE_PATH || '';
  // const postLogoutRedirectUri = process.env.NEXTAUTH_URL
  //   ? `${process.env.NEXTAUTH_URL}${basePath}${loginUrl}`
  //   : undefined;
  // if (postLogoutRedirectUri) {
  //   url.searchParams.set('post_logout_redirect_uri', postLogoutRedirectUri);
  // }

  return url.toString();
}
