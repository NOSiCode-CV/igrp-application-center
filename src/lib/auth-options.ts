import type { NextAuthOptions, Session, TokenSet } from '@igrp/framework-next-auth';
import type { JWT } from '@igrp/framework-next-auth/jwt';
import KeycloakProvider from 'next-auth/providers/keycloak';
import { redirect as nextRedirect } from 'next/navigation';


const isProd = process.env.NODE_ENV === 'production';
const cookieDomain = (process.env.IGRP_NEXTAUTH_CALLBACK ?? '').trim() || undefined;


const isHttps = (process.env.NEXTAUTH_URL ?? '').startsWith('https://');
const secureCookie = isProd && isHttps;

const COOKIE_DOMAIN = (() => {
  if (!isProd || !cookieDomain) return undefined;
  let host = cookieDomain;
  try { if (host.includes('://')) host = new URL(host).hostname; } catch { }
  host = host.split('/')[0].split(':')[0];
  if (
    !host ||
    host === 'localhost' ||
    !host.includes('.') ||
    /^\d+\.\d+\.\d+\.\d+$/.test(host)
  ) return undefined;
  return host;
})();



export const authOptions: NextAuthOptions = {
  providers: [
    KeycloakProvider({
      clientId: process.env.KEYCLOAK_CLIENT_ID!,
      clientSecret: process.env.KEYCLOAK_CLIENT_SECRET!,
      issuer: process.env.KEYCLOAK_ISSUER!,
      authorization: {
        params: {
          redirect_uri: `${process.env.NEXTAUTH_URL}/api/auth/callback/keycloak`,
        },
      },
      checks: ['pkce', 'state'],
    }),
  ],

  secret: process.env.NEXTAUTH_SECRET,

  session: {
    strategy: 'jwt',
    maxAge: 4 * 60 * 60, // 4 hours
  },

  cookies: {
    sessionToken: {
      name: secureCookie ? '__Secure-next-auth.session-token' : 'next-auth.session-token',
      options: {
        httpOnly: true, sameSite: 'lax', path: '/',
        secure: secureCookie,
        ...(COOKIE_DOMAIN ? { domain: COOKIE_DOMAIN } : {}),
      },
    },

    state: {
      name: secureCookie ? '__Secure-next-auth.state' : 'next-auth.state',
      options: {
        httpOnly: true, sameSite: 'lax', path: '/',
        secure: secureCookie,
        ...(COOKIE_DOMAIN ? { domain: COOKIE_DOMAIN } : {}),
      },
    },

    pkceCodeVerifier: {
      name: secureCookie ? '__Secure-next-auth.pkce.code_verifier' : 'next-auth.pkce.code_verifier',
      options: {
        httpOnly: true, sameSite: 'lax', path: '/',
        secure: secureCookie,
        ...(COOKIE_DOMAIN ? { domain: COOKIE_DOMAIN } : {}),
      },
    },

    csrfToken: {
      name: secureCookie ? '__Host-next-auth.csrf-token' : 'next-auth.csrf-token',
      options: { httpOnly: false, sameSite: 'lax', path: '/', secure: secureCookie },
    },
    callbackUrl: {
      name: secureCookie ? '__Host-next-auth.callback-url' : 'next-auth.callback-url',
      options: { httpOnly: false, sameSite: 'lax', path: '/', secure: secureCookie },
    },
  },
  callbacks: {
    async redirect({ url, baseUrl }) {
      if (url.startsWith('/')) return url;
      try {
        const u = new URL(url);
        const b = new URL(baseUrl);
        if (u.origin !== b.origin) {
          return `${b.origin}${u.pathname}${u.search}${u.hash}`;
        }
        return u.toString();
      } catch {
        if (url.startsWith('/')) return url;
        return baseUrl;
      }
    },
    async jwt({ token, user, account, profile }) {
      if (account) {
        if (user && !('user' in token)) {
          token.user = {
            id: token.sub ?? user.id ?? undefined,
            name: user.name ?? profile?.name ?? null,
            email: user.email ?? profile?.email ?? null,
          };
        }
        token.idToken = account.id_token;
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.expiresAt = account.expires_at;

        delete token.error;
        return token;
      }

      if (token.expiresAt && Date.now() < token.expiresAt * 1000 - 60_000) {
        return token;
      }

      try {
        if (!token.refreshToken) {
          console.error('No refresh token available for refresh.');
          return { ...token, error: 'RefreshAccessTokenError' };
        }

        const response = await requestRefreshOfAccessToken(token);
        const tokens: TokenSet = await response.json();

        if (!response.ok) {
          console.error('Error refreshing access token, response not ok:', tokens);
          throw tokens;
        }

        const updatedToken: JWT = {
          ...token,
          user: token.user,
          idToken: tokens.id_token,
          accessToken: tokens.access_token,
          expiresAt: Math.floor(Date.now() / 1000 + Number(tokens.expires_in)),
          refreshToken: tokens.refresh_token || token.refreshToken,
          error: undefined,
        };
        return updatedToken;
      } catch (error) {
        console.error('Error refreshing access token', error);
        return { ...token, error: 'RefreshAccessTokenError' };
      }
    },
    async session({ session, token }) {
      session.user = token.user as Session['user'];
      session.accessToken = token.accessToken;
      session.error = token.error;
      session.idToken = token.idToken;
      session.expiresAt = token.expiresAt;
      return session;
    },
  },
};

export async function requestRefreshOfAccessToken(token: JWT) {
  if (
    !process.env.KEYCLOAK_ISSUER ||
    !process.env.KEYCLOAK_CLIENT_ID ||
    !process.env.KEYCLOAK_CLIENT_SECRET
  ) {
    console.error('Keycloak environment variables are not set for token refresh.');
    throw new Error('Missing Keycloak configuration for token refresh.');
  }

  if (!token.refreshToken) {
    console.error('No refresh token available.');
    throw new Error('Missing refresh token.');
  }

  return await fetch(`${process.env.KEYCLOAK_ISSUER}/protocol/openid-connect/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.KEYCLOAK_CLIENT_ID!,
      client_secret: process.env.KEYCLOAK_CLIENT_SECRET!,
      grant_type: 'refresh_token',
      refresh_token: String(token.refreshToken),
    }),
  });
}

export function buildKeycloakEndSessionUrl(jwt: JWT) {
  const issuer = process.env.KEYCLOAK_ISSUER;
  if (!issuer) throw new Error('KEYCLOAK_ISSUER not set');

  const idToken = jwt?.idToken as string | undefined;
  const postLogoutRedirectUri = process.env.NEXTAUTH_URL
    ? `${process.env.NEXTAUTH_URL}/login`
    : undefined;

  const url = new URL(`${issuer}/protocol/openid-connect/logout`);
  if (!idToken) {
    console.error('No your or not login, available for logout.');
    const loginUrl = process.env.IGRP_LOGIN_URL || '/login'
    nextRedirect(loginUrl);
  }
  url.searchParams.set('id_token_hint', idToken);
  if (postLogoutRedirectUri)
    url.searchParams.set('post_logout_redirect_uri', postLogoutRedirectUri);

  return url.toString();
}
