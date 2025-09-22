import type { NextAuthOptions, Session, TokenSet } from '@igrp/framework-next-auth';
import type { JWT } from '@igrp/framework-next-auth/jwt';
import KeycloakProvider from 'next-auth/providers/keycloak';

const isProd = process.env.NODE_ENV === 'production';
const cookieDomain = process.env.IGRP_NEXTAUTH_CALLBACK || undefined;

export const authOptions: NextAuthOptions = {
  providers: [
    KeycloakProvider({
      clientId: process.env.KEYCLOAK_CLIENT_ID!,
      clientSecret: process.env.KEYCLOAK_CLIENT_SECRET!,
      issuer: process.env.KEYCLOAK_ISSUER!,
    }),
  ],

  secret: process.env.NEXTAUTH_SECRET,

  session: {
    strategy: 'jwt',
    maxAge: 4 * 60 * 60, // 4 hours
  },

  cookies: {
    sessionToken: {
      name: isProd ? '__Secure-next-auth.session-token' : 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: isProd,
        ...(cookieDomain ? { domain: cookieDomain } : {}),
      },
    },
  },

  callbacks: {
    // async redirect({ url, baseUrl }) {
    //   const NEXTAUTH_URL = process.env.NEXTAUTH_URL;
    //   const forced = NEXTAUTH_URL ?? baseUrl;

    //   console.log({ NEXTAUTH_URL });
    //   console.log({ url });
    //   console.log({ baseUrl });
    //   console.log({ forced });

    //   if (url.startsWith('/')) {
    //     console.log(' url start with /');
    //     const u = new URL(url, forced).toString();
    //     console.log({ url: u });
    //     return u;
    //   }

    //   try {
    //     const u = new URL(url);
    //     const f = new URL(forced);
    //     console.log({ u, f });
    //     const origin = u.origin === f.origin;
    //     console.log({ origin });
    //     return origin ? url : f.toString();
    //   } catch {
    //     console.log('catch return forced');
    //     console.log({ forced });
    //     return forced;
    //   }
    // },
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
  if (idToken) url.searchParams.set('id_token_hint', idToken);
  if (postLogoutRedirectUri)
    url.searchParams.set('post_logout_redirect_uri', postLogoutRedirectUri);

  return url.toString();
}
