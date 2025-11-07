import { IGRPLayout } from "@igrp/framework-next";
import type { IGRPLayoutConfigArgs } from "@igrp/framework-next-types";
import { createConfig } from "@igrp/template-config";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { configLayout } from "@/actions/igrp/layout";

export default async function IGRPRootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const layoutConfig = await configLayout();
  const config = await createConfig(layoutConfig as IGRPLayoutConfigArgs);

  // TDOD: see to move this to the root-layout
  const { layout, previewMode } = config;
  const { session } = layout || {};

  const headersList = await headers();
  const currentPath =
    headersList.get("x-pathname") ||
    headersList.get("x-next-url") ||
    headersList.get("referer") ||
    "";

  const baseUrl = process.env.NEXTAUTH_URL_INTERNAL || process.env.NEXTAUTH_URL;

  const urlLogin = "/login";

  const loginPath = new URL(urlLogin || "/", baseUrl).pathname;

  const isAlreadyOnLogin = currentPath.startsWith(loginPath);

  if (!previewMode && session === null && urlLogin && !isAlreadyOnLogin) {
    redirect(urlLogin);
  }

  return <IGRPLayout config={config}>{children}</IGRPLayout>;
}
