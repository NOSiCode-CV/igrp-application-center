import type { DefaultSession, User as NextAuthUser } from 'next-auth';
import type { JWT as NextAuthJWT } from 'next-auth/jwt';

declare module 'next-auth' {
  interface Session extends DefaultSession {
    accessToken?: string;
    idToken?: string;
    error?: string;
    expiresAt?: number;
    forceLogout?: boolean;
    user?: {
      id?: string;
    } & DefaultSession['user'];
  }
}

declare module 'next-auth/jwt' {
  interface JWT extends NextAuthJWT {
    accessToken?: string;
    refreshToken?: string;
    idToken?: string;
    expiresAt?: number;
    error?: 'RefreshAccessTokenError' | string;
    forceLogout?: boolean;
    user?: NextAuthUser;
  }
}
