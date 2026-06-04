"use server";

import { cookies } from "next/headers";

import type { JWT } from "next-auth/jwt";

import { auth } from "@/lib/auth";
import { isAuthBypass } from "@/lib/utils";

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
  const session = isAuthBypass()
    ? ({
        user: { name: "Preview User", email: "preview@example.com" },
        accessToken: "preview-token",
        expires: "9999-12-31T23:59:59.999Z",
      } as JWT | null)
    : await auth.getAccessToken();

  const { activeThemeValue, isScaled } = await getTheme();

  return { session, activeThemeValue, isScaled };
}
