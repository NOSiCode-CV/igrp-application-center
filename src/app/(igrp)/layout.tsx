import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { configLayout } from "@/actions/igrp/layout";
import { QueryProvider } from "@/providers/query-provider";

export default async function IGRPRootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const layoutConfig = await configLayout();
  const { session } = layoutConfig || {};
  const previewMode = process.env.IGRP_PREVIEW_MODE === "true";

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

  if (!previewMode && !session && urlLogin && !isAlreadyOnLogin) {
    redirect(urlLogin);
  }

  return <QueryProvider>{children}</QueryProvider>;
}