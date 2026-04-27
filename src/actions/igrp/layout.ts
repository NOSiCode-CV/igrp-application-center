"use server";

import { cookies } from "next/headers";
import { auth } from "@/lib/auth";
import { isAuthBypass } from "@/lib/utils";

export async function getTheme() {
  const cookieStore = await cookies();
  const activeThemeValue = cookieStore.get("igrp_active_theme")?.value;
  const isScaled = activeThemeValue?.endsWith("-scaled");
  return { activeThemeValue, isScaled };
}

export async function configLayout() {
  const session = isAuthBypass()
    ? ({ user: { name: "Preview User", email: "preview@example.com" }, accessToken: "preview-token", expires: "9999-12-31T23:59:59.999Z" } as any)
    : await auth.getAccessToken();
  const { activeThemeValue, isScaled } = await getTheme();
  return { session, activeThemeValue, isScaled };
}
