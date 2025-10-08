import { IGRPLayout } from '@igrp/framework-next';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';

import { configLayout } from '@/actions/igrp/layout';
import { createConfig } from '@igrp/template-config';

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const layoutConfig = await configLayout();
  const config = await createConfig(layoutConfig);

  // TDOD: see to move this to the root-layout
  const { layout, previewMode } = config;
  const { session } = layout ?? {};

  const headersList = await headers();
  const nextUrl = headersList.get('x-next-url') ?? ''
  const pathname = headersList.get('x-pathname') ?? ''
  const referer = headersList.get('x-referer') ?? ''

  console.log({ nextUrl, pathname, referer })

  const currentPath =
    headersList.get('x-pathname') ||
    headersList.get('x-next-url') ||
    headersList.get('referer') ||
    '';

  const basePath = process.env.IGRP_APP_BASE_PATH || '';

  const urlLogin = basePath ? `${basePath}/login` : '/login';

  const loginPath = new URL(urlLogin, currentPath).pathname;

  const isAlreadyOnLogin = currentPath.startsWith(loginPath);

  if (!previewMode && session === null && urlLogin && !isAlreadyOnLogin) {
    redirect(urlLogin);
  }

  return <IGRPLayout config={config}>{children}</IGRPLayout>;
}
