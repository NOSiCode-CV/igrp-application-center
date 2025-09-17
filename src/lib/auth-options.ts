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
    // maxAge: 60,
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
          refreshToken: tokens.refresh_token ?? token.refreshToken,
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

  events: {
    async signOut({ token }) {
      if (token) {
        await doFinalSignoutHandshake(token as JWT);
      }
    },
  },
};

async function requestRefreshOfAccessToken(token: JWT) {
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

async function doFinalSignoutHandshake(jwt: JWT) {
  const issuer = process.env.KEYCLOAK_ISSUER;
  const { idToken } = jwt;

  if (idToken && issuer) {
    const postLogoutRedirectUri = process.env.NEXTAUTH_URL
      ? `${process.env.NEXTAUTH_URL}/login`
      : undefined;

    try {
      const body = new URLSearchParams({ id_token_hint: idToken });
      if (postLogoutRedirectUri) {
        body.append('post_logout_redirect_uri', postLogoutRedirectUri);
      }

      const params = new URLSearchParams();
      params.append('id_token_hint', idToken as string);

      const response = await fetch(`${issuer}/protocol/openid-connect/logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });
      console.log('Completed post-logout handshake', response.status, response.statusText);
    } catch (e) {
      console.error(
        'Unable to perform post-logout handshake',
        e instanceof Error ? e.message : String(e),
      );
    }
  } else {
    if (!idToken) console.warn('No idToken found for Keycloak post-logout handshake.');
    if (!issuer) console.warn('KEYCLOAK_ISSUER not set for post-logout handshake.');
  }
}
