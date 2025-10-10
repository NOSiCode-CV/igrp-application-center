import { NextResponse, type NextRequest } from 'next/server';
import { getToken } from '@igrp/framework-next-auth/jwt';

const PUBLIC_PATHS = ['/login', '/logout', '/api/auth'];

function isPublicPath(pathname: string, basePath: string) {
  // Remove basePath from pathname for comparison
  const pathWithoutBase =
    basePath && pathname.startsWith(basePath) ? pathname.slice(basePath.length) : pathname;

  const isPublic =
    PUBLIC_PATHS.some((p) => pathWithoutBase === p || pathWithoutBase.startsWith(p + '/')) ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/static/') ||
    pathname.includes('.');

  return isPublic;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const basePath = process.env.IGRP_APP_BASE_PATH || '';

  if (isPublicPath(pathname, basePath)) {
    return NextResponse.next();
  }

  const possibleCookieNames = ['__Secure-next-auth.session-token', 'next-auth.session-token'];

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
    // Redirect to login page
    const loginPath = `${basePath}/login`;

    // Get the correct public URL (handling proxies like Railway)
    const protocol = request.headers.get('x-forwarded-proto') || 'https';
    const host =
      request.headers.get('x-forwarded-host') ||
      request.headers.get('host') ||
      request.nextUrl.host;
    const publicUrl = `${protocol}://${host}${pathname}`;

    // Use NEXTAUTH_URL as base if available, otherwise construct from headers
    const baseUrl = process.env.NEXTAUTH_URL || `${protocol}://${host}`;
    const loginUrl = new URL(loginPath, baseUrl);
    loginUrl.searchParams.set('callbackUrl', publicUrl);

    return NextResponse.redirect(loginUrl);
  }

  if (token.error === 'RefreshAccessTokenError') {
    return NextResponse.redirect(new URL('/logout', request.url));
  }

  return NextResponse.next();
}

// adictional paths for apps, is used as subdomains
export const config = {
  matcher: ['/', '/((?!api|apps|health|_next|favicon.ico|.*\\..*).*)'],
};