import { withIGRPAuth } from "@igrp/framework-next-auth/config";
import { redirect } from "next/navigation";

import { igrpSetAccessClientConfig } from "@igrp/framework-next";
import { assertAuthProviderEnv } from "@igrp/framework-next-auth";
import { isPreviewMode } from "@/lib/utils";

/**
 * Central IGRP auth instance.
 *
 * - Provider is resolved automatically from AUTH_PROVIDER env var (keycloak / autentika / none).
 *   To use a custom provider, pass a Provider object: `provider: GitHubProvider({ ... })`.
 * - All auth boilerplate (authOptions, route handler, middleware, session helpers) is provided.
 *
 * Usage:
 *   Route handler  → export const { GET, POST } = auth;
 *   Middleware     → export const { middleware, config } = auth;
 *   Server action  → const session = await auth.serverSession();
 *   Layout         → const session = await auth.getSession();
 */
export const auth = withIGRPAuth({
  onSessionExpired: () => redirect("/logout"),
});

/**
 * Gets the server-side session from NextAuth.
 * Validates env, configures the IGRP access client when a session exists.
 *
 * @returns Session or null
 */
export async function serverSession() {
  const apiManagement = process.env.IGRP_ACCESS_MANAGEMENT_API || "";

  try {
    if (!process.env.NEXTAUTH_SECRET) {
      console.warn(
        "NEXTAUTH_SECRET is not set. This is required for production.",
      );
      if (process.env.NODE_ENV === "production") {
        throw new Error("NEXTAUTH_SECRET must be set in production");
      }
    }

    assertAuthProviderEnv(process.env);

    const session = await auth.serverSession();

    if (session !== null) {
      igrpSetAccessClientConfig({
        token: session.accessToken as string,
        baseUrl: apiManagement,
      });
    }

    return session;
  } catch (error) {
    console.error("::Error getting server session::", error);
    return null;
  }
}

/**
 * Gets the current session for layout use.
 * Redirects to /logout when token expired or refresh failed.
 * Returns null in preview mode.
 */
export async function getSession() {
  if (isPreviewMode()) return null;
  return auth.getSession();
}
