import { NextResponse, type NextRequest } from "next/server";
import { getToken } from "@igrp/framework-next-auth/jwt";

const PUBLIC_PATHS = ["/login", "/logout", "/api/auth"];

function isPublicPath(pathname: string) {
  return (
    PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/")) ||
    pathname.startsWith("/api/auth/") ||
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/static/") ||
    pathname.includes(".")
  );
}
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPublicPath(pathname)) return NextResponse.next();

  const possibleCookieNames = [
    "__Secure-next-auth.session-token",
    "next-auth.session-token",
  ];

  let token = null;
  for (const name of possibleCookieNames) {
    token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
      cookieName: name,
    });
    if (token) break;
  }

  if (!token) {
    let publicOrigin = (process.env.NEXTAUTH_URL || "").replace(/\/$/, "");

    if (!publicOrigin) {
      const xfHost =
        request.headers.get("x-forwarded-host") ||
        request.headers.get("host") ||
        "";
      const xfProto = request.headers.get("x-forwarded-proto") || "http";
      if (xfHost) publicOrigin = `${xfProto}://${xfHost}`;
    }

    const path =
      request.nextUrl.pathname + request.nextUrl.search + request.nextUrl.hash;
    const cb = publicOrigin
      ? publicOrigin + path
      : path.startsWith("/")
        ? path
        : "/";
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.search = "?callbackUrl=" + encodeURIComponent(cb);
    return NextResponse.redirect(loginUrl);
  }

  if (token.error === "RefreshAccessTokenError") {
    return NextResponse.redirect(new URL("/logout", request.url));
  }

  return NextResponse.next();
}

// adictional paths for apps, is used as subdomains
export const config = {
  matcher: ["/", "/((?!api|apps|health|_next|favicon.ico|.*\\..*).*)"],
};
