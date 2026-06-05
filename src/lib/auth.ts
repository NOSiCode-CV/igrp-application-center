import { redirect } from "next/navigation";

import { igrpSetAccessClientConfig } from "@igrp/framework-next";
import { isIgrpError } from "@igrp/framework-next/errors";
import { withIGRPAuth } from "@igrp/framework-next-auth/config";
import { assertAuthProviderEnv } from "@igrp/framework-next-auth/providers";

import { reportError } from "@/lib/report-error";
import { isAuthBypass } from "@/lib/utils";

/**
 * Minimal session shape used in bypass mode (IGRP_PREVIEW_MODE or
 * AUTH_PROVIDER=none). Covers only the fields layouts/actions read; callers
 * cast to their concrete session type. Single source of truth — do not inline.
 */
export const PREVIEW_SESSION_STUB = {
  user: { name: "Preview User", email: "preview@example.com" },
  accessToken: "preview-token",
  expires: "9999-12-31T23:59:59.999Z",
} as const;

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
/**
 * Strips the trailing `/api/auth` segment NextAuth v4 requires in
 * NEXTAUTH_URL when the app uses a `basePath`, leaving the bare app origin
 * (e.g. `http://localhost:3000/apps/template`). We need that base when
 * building post-login redirects — concatenating NextAuth's `baseUrl` (which
 * is the NEXTAUTH_URL string verbatim) onto a path would otherwise yield
 * `…/api/auth/<path>`, i.e. a NextAuth API URL instead of an app page.
 */
function deriveAppBaseUrl(baseUrlFromNextAuth: string): string {
  const envInternal = (process.env.NEXTAUTH_URL_INTERNAL ?? "").replace(
    /\/api\/auth\/?$/,
    "",
  );
  if (envInternal) return envInternal;
  return baseUrlFromNextAuth.replace(/\/api\/auth\/?$/, "");
}

const AUTH_UI_PATH = /^\/(login|logout)(\/|$)/;

/**
 * Optional explicit NextAuth session-cookie lifetime, in seconds. Align this to
 * your IdP's refresh-token lifetime so the session cookie expires with the
 * refresh token instead of lingering for NextAuth's ~30-day default. Unset (or
 * non-numeric / <= 0) leaves the NextAuth default in place — no behavior change.
 */
function getSessionMaxAge(): number | undefined {
  const raw = process.env.IGRP_SESSION_MAX_AGE?.trim();
  if (!raw) return undefined;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

const sessionMaxAge = getSessionMaxAge();

export const auth = withIGRPAuth({
  onSessionExpired: () => redirect("/logout"),
  // Explicit session lifetime when IGRP_SESSION_MAX_AGE is set; otherwise omit
  // so withIGRPAuth keeps NextAuth's default (no `session` override).
  ...(sessionMaxAge ? { session: { maxAge: sessionMaxAge } } : {}),
  // Point NextAuth at our custom sign-in page so its internal "needs sign-in"
  // redirects (e.g. when a future caller uses `useSession({ required: true })`
  // or `withAuth`) land on /login instead of the framework default page.
  pages: { signIn: "/login" },
  callbacks: {
    /**
     * Post-auth redirect.
     *
     * Replaces the framework default, which ignores `url` and returns
     * `NEXTAUTH_URL_INTERNAL + APP_HOME_SLUG` — broken when NEXTAUTH_URL
     * includes `/api/auth` (which v4 requires under a basePath).
     *
     * Contract here:
     *   - Always resolve to the **app origin** (NEXTAUTH_URL minus `/api/auth`).
     *   - Honor a same-origin `url` (relative `/…` or absolute) unless it
     *     points to the auth chrome itself (`/login*`, `/logout*`) — in which
     *     case fall back to APP_HOME_SLUG or `/`.
     *   - Anything else (off-origin, malformed) → app home, never echo back.
     */
    redirect: ({ url, baseUrl }) => {
      const appBaseUrl = deriveAppBaseUrl(baseUrl);
      const homeSlug = process.env.NEXT_PUBLIC_IGRP_APP_HOME_SLUG || "/";
      const homeUrl = `${appBaseUrl}${homeSlug.startsWith("/") ? homeSlug : `/${homeSlug}`}`;

      // Relative path — join to app origin
      if (url.startsWith("/") && !url.startsWith("//")) {
        if (AUTH_UI_PATH.test(url.split("?")[0] ?? "")) return homeUrl;
        return `${appBaseUrl}${url}`;
      }

      // Absolute URL — allow only same origin
      try {
        const parsed = new URL(url);
        const base = new URL(appBaseUrl);
        if (parsed.origin === base.origin) {
          if (AUTH_UI_PATH.test(parsed.pathname)) return homeUrl;
          return url;
        }
      } catch {
        // fall through
      }

      return homeUrl;
    },
  },
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

    // Dev-only diagnostics for the most common silent-failure modes:
    //  - session present but the JWT carries a `error` flag from `callbacks.jwt`
    //    (typical when the OIDC refresh token has expired or the issuer
    //    rejected refresh). Layouts treat the user as "logged out" but the
    //    underlying cause is invisible without a log.
    //  - session is null while a NextAuth cookie is present (cookie decode
    //    failed, NEXTAUTH_SECRET changed, or the cookie was issued by a
    //    different basePath/domain).
    if (process.env.NODE_ENV !== "production") {
      const sessionError =
        session && typeof session === "object" && "error" in session
          ? (session as { error?: unknown }).error
          : undefined;
      if (sessionError) {
        console.warn(
          "[serverSession] session present but carries error flag:",
          sessionError,
          "→ user will be treated as unauthenticated; check OIDC refresh token / issuer logs",
        );
      } else if (session === null) {
        console.debug(
          "[serverSession] no session (unauthenticated request, or cookie failed to decode)",
        );
      }
    }

    if (session !== null) {
      igrpSetAccessClientConfig({
        token: session.accessToken as string,
        baseUrl: apiManagement,
      });
    }

    return session;
  } catch (error) {
    // Next.js static-render bailout: `headers()`/cookies were read during
    // prerender. This is control flow, not an error — re-throw so Next marks
    // the route dynamic. Swallowing it both masks the bailout as "no session"
    // and floods the error reporter at build time.
    if (
      error instanceof Error &&
      (error as { digest?: string }).digest === "DYNAMIC_SERVER_USAGE"
    ) {
      throw error;
    }

    // Only swallow the "no session / cookie decode failed" branch. Typed
    // IgrpError instances and IGRPAuthConfigError indicate config-level problems
    // and must surface so error boundaries can render a proper diagnosis.
    if (isIgrpError(error)) throw error;
    if (error instanceof Error && error.name === "IGRPAuthConfigError")
      throw error;
    // Surface the error name so the log distinguishes "JWE decryption failed
    // / cookie-decode failed" (recoverable — treat as no session) from less
    // obvious causes (e.g. JSON parse failures, network errors hitting the
    // session endpoint). Without this, every swallowed error reads the same.
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        "[serverSession] swallowed error — returning null session:",
        error instanceof Error ? `${error.name}: ${error.message}` : error,
      );
    }
    reportError(error, { segment: "lib/auth.serverSession" });
    return null;
  }
}

/**
 * Gets the current session for layout use.
 * Redirects to /logout when token expired or refresh failed.
 * Returns null in preview mode.
 */
export async function getSession() {
  if (isAuthBypass()) return null;
  return auth.getSession();
}
