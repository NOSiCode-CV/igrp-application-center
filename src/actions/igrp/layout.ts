"use server";

import { cookies } from "next/headers";

import { getAccessToken } from "@/lib/auth-helpers";

export async function getTheme() {
  const cookieStore = await cookies();
  const activeThemeValue = cookieStore.get("igrp_active_theme")?.value;
  const isScaled = activeThemeValue?.endsWith("-scaled");

  return { activeThemeValue, isScaled };
}

export async function configLayout() {
  const session = await getAccessToken();

  const { activeThemeValue, isScaled } = await getTheme();

  return { session, activeThemeValue, isScaled };
}
