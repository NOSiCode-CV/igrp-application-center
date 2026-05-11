import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

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

function isPublicPath(pathname: string): boolean {
  if (/\.[^/]+$/.test(pathname)) return true;
  if (PUBLIC_PATHS.has(pathname)) return true;
  if (PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) return true;
  if (STATIC_PREFIXES.some((p) => pathname.startsWith(p))) return true;
  return false;
}

function isAuthUiPath(pathname: string): boolean {
  return AUTH_UI_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (auth.isAuthDisabled() || auth.isPreviewMode()) {
    if (isAuthUiPath(pathname)) {
      return withSecurityHeaders(
        NextResponse.redirect(new URL("/", request.url)),
      );
    }
    return withSecurityHeaders(NextResponse.next());
  }

  if (isPublicPath(pathname)) return withSecurityHeaders(NextResponse.next());

  const loginRedirect = () =>
    withSecurityHeaders(
      NextResponse.redirect(auth.getLoginRedirectUrl(request)),
    );

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

  return withSecurityHeaders(NextResponse.next());
}

export const { config } = auth;
