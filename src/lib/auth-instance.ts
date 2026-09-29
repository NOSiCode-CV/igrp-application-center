import { withIGRPAuth } from "@igrp/framework-next-auth/config";
import { redirect } from "next/navigation";

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

const AUTH_UI_PATH = /^\/(login|logout)(\/|$)/;

/**
 * Post-login/post-logout redirect, rebuilt from `NEXT_PUBLIC_BASE_PATH`
 * instead of trusting next-auth's own `baseUrl`.
 *
 * Why this override exists: next-auth v4 core (`createCallbackUrl`, in
 * `next-auth/core/lib/callback-url.ts`) ALWAYS calls
 * `callbacks.redirect({ url, baseUrl: options.url.origin })` — i.e. `baseUrl`
 * is the bare origin (protocol+host), with any path component of
 * `NEXTAUTH_URL` already stripped. `withIGRPAuth`'s own default redirect
 * callback (`resolveAppBaseUrl`) does `baseUrl || env.NEXTAUTH_URL`, meant to
 * fall back to the full, path-preserving `NEXTAUTH_URL` — but `baseUrl` is
 * never falsy (it's always a valid origin string), so that fallback never
 * fires. Net effect: under a basePath deployment (e.g. `NEXT_PUBLIC_BASE_PATH
 * =/apps/core`), the framework's default post-login redirect lands on
 * `https://host/dashboard` instead of `https://host/apps/core/dashboard` —
 * outside the ingress path prefix, so it 404s. Confirmed via a live network
 * trace against apps-test.inss.gw: `signIn()` itself already correctly posts
 * to `/apps/core/api/auth/signin/...` (that basePath wiring, via
 * `sessionArgs.basePath` in `get-session-args.ts`, is unaffected by this bug),
 * but the callback's own internal home-redirect drops the prefix.
 */
function redirectWithBasePath({
  url,
  baseUrl,
}: {
  url: string;
  baseUrl: string;
}): string {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  let origin: string;
  try {
    origin = new URL(baseUrl).origin;
  } catch {
    origin = baseUrl;
  }
  const appBaseUrl = `${origin}${basePath}`;
  const homeSlug = process.env.NEXT_PUBLIC_IGRP_APP_HOME_SLUG || "/";
  const homeUrl = `${appBaseUrl}${homeSlug.startsWith("/") ? homeSlug : `/${homeSlug}`}`;

  // Relative path — join to app origin + basePath. Guard against
  // double-prefixing if `url` already carries the basePath itself.
  if (url.startsWith("/") && !url.startsWith("//")) {
    const pathOnly = url.split("?")[0] ?? "";
    if (AUTH_UI_PATH.test(pathOnly)) return homeUrl;
    if (basePath && url.startsWith(basePath)) return `${origin}${url}`;
    return `${appBaseUrl}${url}`;
  }

  // Absolute URL — allow only same origin.
  try {
    const parsed = new URL(url);
    if (parsed.origin === origin) {
      if (AUTH_UI_PATH.test(parsed.pathname)) return homeUrl;
      return url;
    }
  } catch {
    // fall through
  }

  return homeUrl;
}

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
  callbacks: {
    redirect: redirectWithBasePath,
  },
});
