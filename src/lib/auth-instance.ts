import { redirect } from "next/navigation";

import { withIGRPAuth } from "@igrp/framework-next-auth/config";

/*
 * EDGE-SAFE MODULE — `src/middleware.ts` imports this, and middleware runs on
 * the Edge runtime. Import nothing here that reaches Node-only code.
 *
 * In particular, never import from `@igrp/framework-next`: its access-client
 * store is built on `node:async_hooks`, and when this instance lived in
 * `lib/auth.ts` next to the server session helpers (which do use it), every
 * `next build` warned "A Node.js module is loaded ('node:async_hooks') which is
 * not supported in the Edge Runtime", with the import trace
 * `middleware.ts → lib/auth.ts → framework-next/dist/lib/api-config.js`.
 *
 * App code should keep importing from `@/lib/auth`, which re-exports `auth`
 * and adds the Node-side session helpers. Only middleware imports this file.
 */

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
  // Explicit session lifetime when IGRP_SESSION_MAX_AGE is set; otherwise omit
  // so withIGRPAuth keeps NextAuth's default (no `session` override).
  ...(sessionMaxAge ? { session: { maxAge: sessionMaxAge } } : {}),
  // Point NextAuth at our custom sign-in page so its internal "needs sign-in"
  // redirects (e.g. when a future caller uses `useSession({ required: true })`
  // or `withAuth`) land on /login instead of the framework default page.
  pages: { signIn: "/login" },
});
