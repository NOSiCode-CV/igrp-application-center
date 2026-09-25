import { type NextRequest, NextResponse } from "next/server";

// Edge runtime: import the instance from its Edge-safe module, NOT "@/lib/auth"
// (which also carries Node-only session helpers — see lib/auth-instance.ts).
import { auth } from "@/lib/auth-instance";
import { LOGOUT_PENDING_COOKIE } from "@/lib/logout-pending";
import { isAuthBypass, sanitizeCallbackUrl } from "@/lib/utilities";

/**
 * Content-Security-Policy-Report-Only baseline. Report-only never blocks a
 * request — browsers only log violations to the console/report endpoint — so
 * this ships with zero behavioral risk while surfacing what an eventual
 * enforcing policy would need to allow.
 *
 * style-src allows 'unsafe-inline' deliberately and permanently: Radix (used
 * throughout the design system for Popover/DropdownMenu/Tooltip/Select/
 * HoverCard/ContextMenu) sets inline `style` attributes at runtime for
 * floating-UI positioning, with no CSP nonce escape hatch — this is not
 * fixable from application code.
 *
 * script-src intentionally does NOT allow 'unsafe-inline'. This WILL surface
 * a real violation from next-themes' inline theme-boot script (no nonce
 * wired today) — that's expected, not a bug in this policy. Silencing it
 * properly means threading a nonce from here through IGRPThemeProvider into
 * next-themes' `nonce` prop, a framework-next-ui change, not a header one.
 */
function buildCspReportOnly(): string {
  const imageDomains = (process.env.NEXT_PUBLIC_ALLOWED_DOMAINS ?? "")
    .split(",")
    .map((domain) => domain.trim())
    .filter(Boolean)
    .flatMap((domain) => [`https://${domain}`, `http://${domain}`]);

  // form-action defaults to 'self' and would otherwise silently block the
  // logout page's cross-origin POST to the IdP's end_session_endpoint.
  let authIssuerOrigin = "";
  try {
    authIssuerOrigin = process.env.IGRP_AUTH_ISSUER
      ? new URL(process.env.IGRP_AUTH_ISSUER).origin
      : "";
  } catch {
    // Malformed IGRP_AUTH_ISSUER — omit rather than break header construction.
  }

  return [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline'",
    `img-src 'self' data:${imageDomains.length ? ` ${imageDomains.join(" ")}` : ""}`,
    "font-src 'self'",
    "connect-src 'self'",
    `form-action 'self'${authIssuerOrigin ? ` ${authIssuerOrigin}` : ""}`,
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "object-src 'none'",
  ].join("; ");
}

/**
 * Security headers applied to all responses in production.
 *
 * X-XSS-Protection is deliberately absent: the legacy XSS auditor it enabled
 * has been removed from every current browser, and sending it can reintroduce
 * vulnerabilities. CSP is the replacement. (Dropped in c9973f0, re-added by
 * accident in ebc0e15 — `middleware.test.ts` asserts its absence.)
 */
const SECURITY_HEADERS: Record<string, string> = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy":
    "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  // Only meaningful when actually served over HTTPS, which every production
  // deployment of this template is expected to be (behind a TLS-terminating
  // proxy or directly). Safe to send unconditionally in the production gate
  // below — browsers ignore it on plain HTTP.
  "Strict-Transport-Security": "max-age=63072000; includeSubDomains",
  "Content-Security-Policy-Report-Only": buildCspReportOnly(),
};

function withSecurityHeaders(response: NextResponse): NextResponse {
  if (process.env.NODE_ENV === "production") {
    for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
      response.headers.set(key, value);
    }
  }
  return response;
}

const AUTH_UI_PREFIXES = ["/login", "/logout", "/api/auth"];

// `/api/health` is the container HEALTHCHECK target (docker/*/Dockerfile). Behind
// auth it answered 307 → /login, and `wget` followed the redirect — so the probe
// tested the login page at the public origin (or failed outright when the
// container cannot reach that origin) and never reached the health route.
const PUBLIC_PATHS = new Set(["/login", "/logout", "/api/auth", "/api/health"]);
const PUBLIC_PREFIXES = ["/login/", "/logout/", "/api/auth/"];
const STATIC_PREFIXES = ["/_next/", "/static/", "/favicon.ico"];

// Build-time constant — baked in by Next.js for NEXT_PUBLIC_* vars.
// Needed for raw URL construction in middleware where next/navigation isn't available.
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

// isPublicPath/isAuthUiPath are exported for `src/__tests__/middleware/
// path-predicates.test.ts` — the routing table they encode is worth covering
// directly. Keep the exports when editing this file; they have been dropped
// twice by unrelated rewrites (4846f4d, ebc0e15), breaking typecheck each time.
export function isPublicPath(pathname: string): boolean {
  if (PUBLIC_PATHS.has(pathname)) return true;
  if (PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) return true;
  if (STATIC_PREFIXES.some((p) => pathname.startsWith(p))) return true;
  // Belt-and-braces only: the DEFAULT matcher exported as `auth.config` already
  // excludes `.*\..*`, so under the stock config this branch never runs — a
  // request for a dotted path does not wake the middleware at all. It stays
  // because the matcher is overridable (`withIGRPAuth({ matcher })`), and a
  // consumer who widens it would otherwise lose the static-asset skip.
  //
  // It is NOT the auth boundary for dotted PAGE routes (e.g. a dynamic segment
  // that captures "john.doe"). Those skip middleware under the stock matcher
  // too — they are protected because `(igrp)/layout.tsx` calls `verifySession()`
  // on the server for every route beneath it. Do not move a protected route out
  // from under that layout on the assumption middleware covers it.
  if (/\.[^/]+$/.test(pathname)) return true;
  return false;
}

export function isAuthUiPath(pathname: string): boolean {
  return AUTH_UI_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

/**
 * Next.js middleware: auth check + security headers.
 *
 * Flow:
 * 1. When auth is bypassed (AUTH_PROVIDER=none or IGRP_PREVIEW_MODE=true),
 *    redirect any /login, /logout, or /api/auth/* request to / and let every
 *    other path through untouched. There is no real provider to talk to.
 * 2. Otherwise: skip auth for public/static paths.
 * 3. Extract JWT — redirect to login on failure.
 * 4. Redirect to login when token expired or refresh failed.
 * 5. Apply security headers to all passing responses.
 *
 * x-current-path is injected as a request header on every passing response so
 * server components can build a callbackUrl when they need to redirect to login.
 */
export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const currentPath = pathname + search;

  // Passes the request through, forwarding the current path to server components.
  const nextWithPath = (): NextResponse => {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-current-path", currentPath);
    return withSecurityHeaders(
      NextResponse.next({ request: { headers: requestHeaders } }),
    );
  };

  // Redirects to /login with the current path as callbackUrl.
  //
  // Origin resolution is the framework's (`auth.resolveAppUrl`), not
  // `new URL(path, request.url)`: behind a TLS-terminating proxy `request.url`
  // carries the INTERNAL origin, so a Location built from it points the browser
  // somewhere it cannot reach. One resolver for every redirect below.
  const loginRedirect = (): NextResponse => {
    const loginUrl = auth.getLoginRedirectUrl(request);
    // Only set callbackUrl when it's a useful destination — never `/`, never
    // /login/* (would loop), never /logout/*.
    const safeCallback = sanitizeCallbackUrl(currentPath, BASE_PATH);
    if (safeCallback && safeCallback !== "/") {
      loginUrl.searchParams.set("callbackUrl", safeCallback);
    }
    return withSecurityHeaders(NextResponse.redirect(loginUrl));
  };

  // Use the template's single hardened bypass predicate (handles quoted /
  // whitespaced env values) so middleware agrees with the rest of the app.
  if (isAuthBypass()) {
    if (isAuthUiPath(pathname)) {
      return withSecurityHeaders(
        NextResponse.redirect(auth.resolveAppUrl("/", request)),
      );
    }
    return nextWithPath();
  }

  if (isPublicPath(pathname)) return nextWithPath();

  // Logout backstop (Option A): a `logout_pending` marker means a logout left
  // for the IdP but the local session teardown is still owed (e.g. the IdP
  // never redirected back). Force the user through /login — which completes the
  // deferred signOut and clears the marker — instead of letting a still-live
  // session back into the app. /login and /api/auth/* are already past the
  // isPublicPath check above, so this only fires on protected routes and cannot
  // loop. No callbackUrl: a completed logout should land on /login, not bounce
  // back into the app.
  if (request.cookies.has(LOGOUT_PENDING_COOKIE)) {
    console.warn(
      "[logout][middleware] logout_pending marker on protected route — forcing /login to complete teardown",
      { pathname },
    );
    return withSecurityHeaders(
      NextResponse.redirect(auth.getLoginRedirectUrl(request)),
    );
  }

  let token: Awaited<ReturnType<typeof auth.getTokenFromRequest>>;
  try {
    token = await auth.getTokenFromRequest(request);
  } catch (error) {
    console.error("[Middleware] getToken failed", error, { pathname });
    return loginRedirect();
  }

  if (!token || auth.isTokenExpiredOrFailed(token)) {
    return loginRedirect();
  }

  return nextWithPath();
}

// Matcher: page routes only (legacy template)
export const { config } = auth;
