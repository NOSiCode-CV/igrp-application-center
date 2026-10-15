import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    /** The user's preferred language (`metadata.locale`), when set. */
    locale?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    locale?: string;
  }
}
