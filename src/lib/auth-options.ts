import type { AuthOptions } from "next-auth";
import {
  createAuthProviderFromEnv,
  getAuthProviderIdFromEnv,
} from "@igrp/framework-next-auth";
import { refreshAccessToken, signOut } from "./auth-helpers";

export const authOptions: AuthOptions = {
  providers: [createAuthProviderFromEnv(process.env)],

  secret: process.env.NEXTAUTH_SECRET,

  callbacks: {
    async jwt({ token, account, user }) {
      // Initial sign in
      if (account && user) {
        token.authProviderId = getAuthProviderIdFromEnv(process.env);
        token.accessToken = account.access_token;
        token.idToken = account.id_token;
        token.expiresAt = account.expires_at! * 1000;
        token.refreshToken = account.refresh_token;
      }

      // Return previous token if the access token has not expired yet
      if (Date.now() < (token.expiresAt as number)) {
        return token;
      }

      // Access token has expired, try to update it
      return refreshAccessToken(token);
    },
    async session({ session, token }) {
      if (token) {
        session.accessToken = token.accessToken;
        session.idToken = token.idToken;
        session.authProviderId = token.authProviderId;
        session.error = token.error;
      }
      return session;
    },
    async redirect({ url }) {
      const nextInternalUrl = process.env.NEXTAUTH_URL_INTERNAL || "";
      const igrpAppHomeSlug = process.env.NEXT_PUBLIC_IGRP_APP_HOME_SLUG || "";
      const redirectTo = `${nextInternalUrl}${igrpAppHomeSlug}`;

      return nextInternalUrl ? redirectTo : url;
    },
  },
  events: {
    async signOut({ token }) {
      await signOut(token);
    },
  },
};
