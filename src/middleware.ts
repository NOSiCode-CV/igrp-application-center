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

  console.log({ token });

  if (!token) {
    console.log("Sem token")
    const loginUrl = new URL('/login', request.url);
    console.log({ loginUrl })
    console.log({ requestURL:request.url })

    loginUrl.searchParams.set('callbackUrl', request.url);
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
