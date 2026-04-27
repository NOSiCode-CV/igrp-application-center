import { withIGRPAuth } from "@igrp/framework-next-auth/config";
import { redirect } from "next/navigation";
import { igrpSetAccessClientConfig } from "@igrp/framework-next";
import { isIgrpError } from "@igrp/framework-next/errors";
import { assertAuthProviderEnv } from "@igrp/framework-next-auth";
import { isPreviewMode } from "@/lib/utils";
import { reportError } from "@/lib/report-error";

export const auth = withIGRPAuth({
  onSessionExpired: () => redirect("/logout"),
});

export async function serverSession() {
  const apiManagement = process.env.IGRP_ACCESS_MANAGEMENT_API || "";
  if (!process.env.NEXTAUTH_SECRET) {
    console.warn("NEXTAUTH_SECRET is not set. This is required for production.");
    if (process.env.NODE_ENV === "production") {
      throw new Error("NEXTAUTH_SECRET must be set in production");
    }
  }
  assertAuthProviderEnv(process.env);
  try {
    const session = await auth.serverSession();
    if (session !== null) {
      igrpSetAccessClientConfig({ token: session.accessToken as string, baseUrl: apiManagement });
    }
    return session;
  } catch (error) {
    if (isIgrpError(error)) throw error;
    reportError(error, { segment: "lib/auth.serverSession" });
    return null;
  }
}

export async function getSession() {
  if (isPreviewMode()) return null;
  return auth.getSession();
}
