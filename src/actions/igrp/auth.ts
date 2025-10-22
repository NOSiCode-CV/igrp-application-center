"use server";

import { igrpSetAccessClientConfig } from "@igrp/framework-next";
import { getServerSession, type Session } from "@igrp/framework-next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@/lib/auth-options";

export async function serverSession() {
  const apiManagement = process.env.IGRP_APP_MANAGER_API || "";

  try {
    if (!process.env.NEXTAUTH_SECRET) {
      console.warn(
        "NEXTAUTH_SECRET is not set. This is required for production.",
      );
      if (process.env.NODE_ENV === "production") {
        throw new Error("NEXTAUTH_SECRET must be set in production");
      }
    }

    if (
      !process.env.KEYCLOAK_CLIENT_ID ||
      !process.env.KEYCLOAK_CLIENT_SECRET ||
      !process.env.KEYCLOAK_ISSUER
    ) {
      console.warn(
        "Warning: One or more Keycloak environment variables are missing.",
      );
      throw new Error(
        "One or more Keycloak environment variables are missing.",
      );
    }

    const session = await getServerSession(authOptions);

    if (session !== null) {
      igrpSetAccessClientConfig({
        token: session.accessToken as string,
        baseUrl: apiManagement,
      });
    }
    return session;
  } catch (error) {
    console.error("::Error getting server session::", error);
    return null;
  }
}

export async function getSession() {
  let session: Session | null;
  const isPreviewMode = process.env.IGRP_PREVIEW_MODE === "true";

  if (isPreviewMode) return null;

  try {
    session = await serverSession();
    if (!session) return session;

    const now = Math.floor(Date.now() / 1000) + 60;

    const providerExp =
      typeof session.expiresAt === "number" ? session.expiresAt : undefined;
    const providerExpired = providerExp !== undefined && providerExp < now;
    const refreshFailed = session.error === "RefreshAccessTokenError";

    if (providerExpired || refreshFailed) {
      const logout = "/logout";
      redirect(logout);
    }
  } catch (error) {
    console.error("Failed to get session in layout:", error);
    session = null;
  }

  return session;
}
