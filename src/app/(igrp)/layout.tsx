import { IGRPLayout } from '@igrp/framework-next';
// import { redirect } from 'next/navigation';

import { configLayout } from '@/actions/igrp/layout';
import { createConfig } from '@igrp/template-config';
// import { headers } from 'next/headers';

export default async function IGRPRootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const layoutConfig = await configLayout();
  const config = await createConfig(layoutConfig);

  // const { layout, previewMode } = config;
  // const { session } = layout ?? {};  

  // const baseUrl =  process.env.NEXTAUTH_URL || 'http://localhost:3000';
  // const basePath = process.env.IGRP_APP_BASE_PATH || '';

  // const urlLogin = basePath ? `${basePath}/login` : '/login';
  // const loginPath = new URL(urlLogin, baseUrl).pathname;
  // const isAlreadyOnLogin = baseUrl.startsWith(loginPath);

  // if (!previewMode && session === null && !isAlreadyOnLogin) {
  //   redirect(urlLogin);
  // }

  return <IGRPLayout config={config}>{children}</IGRPLayout>;
}
