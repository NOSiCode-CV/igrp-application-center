"use server";

import { cookies } from "next/headers";

import { PREVIEW_SESSION_STUB, serverSession } from "@/lib/auth";
import { isAuthBypass } from "@/lib/utilities";

export async function getTheme() {
  const cookieStore = await cookies();
  const activeThemeValue = cookieStore.get("igrp_active_theme")?.value;
  const isScaled = activeThemeValue?.endsWith("-scaled");

  return { activeThemeValue, isScaled };
}

export async function configLayout() {
  // NOTE: This function is called from both the root layout (app/layout.tsx) and the
  // protected IGRP layout (app/(igrp)/layout.tsx). Auth enforcement is handled by
  // verifySession() in dal.ts, which is called only from the protected layout.
  // Do NOT add verifySession() here — it would redirect unauthenticated users on
  // the root layout, breaking the login page.
  //
  // When auth is bypassed (preview mode OR AUTH_PROVIDER=none), provide a mock
  // session so the layout doesn't kick the user to /login. The framework reads
  // session existence rather than the preview flag when deciding redirects.
  // Use the sanitized NextAuth Session — NOT auth.getAccessToken(), which
  // returns the full JWT (including the refresh token) and would leak it into
  // the client SessionProvider. serverSession() is redirect-free, so it stays
  // safe to call from the root layout (auth enforcement lives in verifySession()).
  const session = isAuthBypass() ? PREVIEW_SESSION_STUB : await serverSession();

  const { activeThemeValue, isScaled } = await getTheme();

  return { session, activeThemeValue, isScaled };
}
