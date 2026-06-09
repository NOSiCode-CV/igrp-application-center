import { type NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { LOGOUT_PENDING_COOKIE } from "@/lib/logout-pending";
import { sanitizeCallbackUrl } from "@/lib/utils";

/** Security headers applied to all responses in production. */
const SECURITY_HEADERS: Record<string, string> = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-XSS-Protection": "1; mode=block",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy":
    "camera=(), microphone=(), geolocation=(), interest-cohort=()",
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

const PUBLIC_PATHS = new Set(["/login", "/logout", "/api/auth"]);
const PUBLIC_PREFIXES = ["/login/", "/logout/", "/api/auth/"];
const STATIC_PREFIXES = ["/_next/", "/static/", "/favicon.ico"];

// Build-time constant — baked in by Next.js for NEXT_PUBLIC_* vars.
// Needed for raw URL construction in middleware where next/navigation isn't available.
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

function isPublicPath(pathname: string): boolean {
  if (PUBLIC_PATHS.has(pathname)) return true;
  if (PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) return true;
  if (STATIC_PREFIXES.some((p) => pathname.startsWith(p))) return true;
  if (/\.[^/]+$/.test(pathname)) return true;
  return false;
}

function isAuthUiPath(pathname: string): boolean {
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
  const loginRedirect = (): NextResponse => {
    const loginUrl = new URL(`${BASE_PATH}/login`, request.url);
    // Only set callbackUrl when it's a useful destination — never `/`, never
    // /login/* (would loop), never /logout/*.
    const safeCallback = sanitizeCallbackUrl(currentPath, BASE_PATH);
    if (safeCallback && safeCallback !== "/") {
      loginUrl.searchParams.set("callbackUrl", safeCallback);
    }
    return withSecurityHeaders(NextResponse.redirect(loginUrl));
  };

  if (auth.isAuthDisabled() || auth.isPreviewMode()) {
    if (isAuthUiPath(pathname)) {
      return withSecurityHeaders(
        NextResponse.redirect(new URL(`${BASE_PATH}/`, request.url)),
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
      NextResponse.redirect(new URL(`${BASE_PATH}/login`, request.url)),
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
