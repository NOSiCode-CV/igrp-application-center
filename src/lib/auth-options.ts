import { AuthOptions } from "next-auth";
import KeycloakProvider from "next-auth/providers/keycloak";

export const authOptions: AuthOptions = {
  providers: [
    KeycloakProvider({
      clientId: process.env.KEYCLOAK_CLIENT_ID || "",
      clientSecret: process.env.KEYCLOAK_CLIENT_SECRET || "",
      issuer: process.env.KEYCLOAK_ISSUER || "",
    }),
  ],

  secret: process.env.NEXTAUTH_SECRET,

  callbacks: {
    async jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.expiresAt = account.expires_at;
      }
      return token;
    },
    async redirect({ url }) {
      const nextPublicUrl = process.env.NEXTAUTH_URL_INTERNAL || "";
      const igrpAppHomeSlug = process.env.IGRP_APP_HOME_SLUG || "";

      const redirectTo = nextPublicUrl
        ? `${nextPublicUrl}${igrpAppHomeSlug}`
        : "";

      return redirectTo ? redirectTo : url;
    },
  },
};
