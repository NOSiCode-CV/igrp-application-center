import { getToken } from '@igrp/framework-next-auth/jwt';
import { NextResponse, type NextRequest } from 'next/server';

// Public paths that don’t require authentication
const publicPaths = ['/login', '/logout', '/api/auth'];

// Check if path is public
function isPublicPath(pathname: string): boolean {
  return publicPaths.some(
    (p) =>
      pathname === p ||
      (p.endsWith('/') && pathname.startsWith(p)) ||
      pathname.startsWith('/api/auth/') ||
      pathname.startsWith('/_next/') ||
      pathname.startsWith('/static/') ||
      pathname.includes('.'),
  );
}

// Main middleware
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  // Get session token
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
    cookieName: 'next-auth.session-token',
  });

  if (!token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', request.url);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect on token refresh failure
  if (token.error === 'RefreshAccessTokenError') {
    return NextResponse.redirect(new URL('/logout', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/((?!api|apps|health|_next|favicon.ico|.*\\..*).*)'],
};
