import { NextResponse, type NextRequest } from 'next/server';
import { getToken } from '@igrp/framework-next-auth/jwt';

const PUBLIC_PATHS = ['/login', '/logout', '/api/auth'];

function isPublicPath(pathname: string) {
  return (
    PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/')) ||
    pathname.startsWith('/api/auth/') ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/static/') ||
    pathname.includes('.')
  );
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPublicPath(pathname)) return NextResponse.next();

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
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', request.url);
    return NextResponse.redirect(loginUrl);
  }

  const now = Math.floor(Date.now() / 1000);
  const skew = 60;
  const nextAuthExp = typeof token.exp === 'number' ? token.exp : undefined;
  console.log({ nextAuthExp });
  console.log({ tokenExp: token.exp });

  const providerExp = typeof token.expiresAt === 'number' ? token.expiresAt : undefined;
  console.log({ providerExp });
  console.log({ tokenExpiresAt: token.expiresAt });

  const sessionExpired = nextAuthExp !== undefined && nextAuthExp <= now + skew;
  console.log({ sessionExpired });

  const providerExpired = providerExp !== undefined && providerExp <= now + skew;
  console.log({ providerExpired });

  const refreshFailed = token.error === 'RefreshAccessTokenError';

  if (sessionExpired || providerExpired || refreshFailed) {
    return NextResponse.redirect(new URL('/logout', request.url));
  }

  return NextResponse.next();
}

// adictional paths for apps, is used as subdomains
export const config = {
  matcher: ['/', '/((?!api|apps|health|_next|favicon.ico|.*\\..*).*)'],
};
