"use server";

import { cookies } from "next/headers";
import { auth, PREVIEW_SESSION_STUB } from "@/lib/auth";
import { isAuthBypass } from "@/lib/utils";

export async function getTheme() {
  const cookieStore = await cookies();
  const activeThemeValue = cookieStore.get("igrp_active_theme")?.value;
  const isScaled = activeThemeValue?.endsWith("-scaled");
  return { activeThemeValue, isScaled };
}

type AccessTokenSession = Awaited<ReturnType<typeof auth.getAccessToken>>;

export async function configLayout() {
  const session: AccessTokenSession = isAuthBypass()
    ? (PREVIEW_SESSION_STUB as unknown as AccessTokenSession)
    : await auth.getAccessToken();
  const { activeThemeValue, isScaled } = await getTheme();
  return { session, activeThemeValue, isScaled };
}
