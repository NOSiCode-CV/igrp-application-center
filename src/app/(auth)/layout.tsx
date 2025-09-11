import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'IGRP | Login - Applications Center',
  description: 'IGRP | Login - Applications Center',
  icons: { icon: '/igrp/logo-no-text.png' },
};

export default async function LoginLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <>{children}</>;
}
