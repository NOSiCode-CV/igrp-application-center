import { withIGRPAuth } from "@igrp/framework-next-auth/config";
import { redirect } from "next/navigation";

import { igrpSetAccessClientConfig } from "@igrp/framework-next";
import { isIgrpError } from "@igrp/framework-next/errors";
import { assertAuthProviderEnv } from "@igrp/framework-next-auth";
import { isAuthBypass } from "@/lib/utils";
import { reportError } from "@/lib/report-error";

/**
 * Central IGRP auth instance.
 *
 * - Provider is resolved automatically from AUTH_PROVIDER env var (igrp-auth / none).
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

  if (!process.env.NEXTAUTH_SECRET) {
    console.warn(
      "NEXTAUTH_SECRET is not set. This is required for production.",
    );
    if (process.env.NODE_ENV === "production") {
      // Hard fail in prod — we will not masquerade as "no session". Bubbles
      // to the nearest App Router `error.tsx`.
      throw new Error("NEXTAUTH_SECRET must be set in production");
    }
  }

  // Env/provider misconfiguration is a setup problem, not a "no session"
  // condition — let typed framework errors propagate so the boundary can
  // render a real diagnosis rather than silently redirecting to login.
  assertAuthProviderEnv(process.env);

  try {
    const session = await auth.serverSession();

    if (session !== null) {
      igrpSetAccessClientConfig({
        token: session.accessToken as string,
        baseUrl: apiManagement,
      });
    }

    return session;
  } catch (error) {
    // Only swallow the "no session / cookie decode failed" branch. Typed
    // IgrpError instances and IGRPAuthConfigError indicate config-level problems
    // and must surface so error boundaries can render a proper diagnosis.
    if (isIgrpError(error)) throw error;
    if (error instanceof Error && error.name === "IGRPAuthConfigError")
      throw error;
    reportError(error, { segment: "lib/auth.serverSession" });
    return null;
  }
}

/**
 * Gets the current session for layout use.
 * Redirects to /logout when token expired or refresh failed.
 * Returns null in bypass mode (IGRP_PREVIEW_MODE or AUTH_PROVIDER=none).
 */
export async function getSession() {
  if (isAuthBypass()) return null;
  return auth.getSession();
}
