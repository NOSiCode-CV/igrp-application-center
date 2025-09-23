import { IGRPLayout } from '@igrp/framework-next';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';

import { configLayout } from '@/actions/igrp/layout';
import { createConfig } from '@igrp/template-config';

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const layoutConfig = await configLayout();
  const config = await createConfig(layoutConfig);

  // TDOD: see to move this to the root-layout
  const { layout, previewMode, loginUrl, logoutUrl } = config;
  const { session } = layout ?? {};

  const headersList = await headers();
  const currentPath =
    headersList.get('x-pathname') ||
    headersList.get('x-next-url') ||
    headersList.get('referer') ||
    '';

  const baseUrl = process.env.NEXTAUTH_URL;

  const urlLogin = loginUrl ?? '/login';
  const urlLogout = logoutUrl ?? '/logout';

  const loginPath = new URL(loginUrl || '/', baseUrl).pathname;

  const isAlreadyOnLogin = currentPath.startsWith(loginPath);

  if (!previewMode && session === null && urlLogin && !isAlreadyOnLogin) {
    redirect(urlLogin || urlLogout);
  }

  return <IGRPLayout config={config}>{children}</IGRPLayout>;
}
