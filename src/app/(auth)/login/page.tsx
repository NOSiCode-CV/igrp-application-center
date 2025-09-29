import { IGRPAuthCarousel, IGRPAuthForm } from '@igrp/framework-next-ui';

import { loginConfig, carouselItems } from '@/config/login';
import { siteConfig } from '@/config/site';
import { cn } from '@/lib/utils';

const { sliderPosition, texts } = loginConfig;
const { logo, name } = siteConfig;

export default async function AuthPage({
  searchParams,
}: {
  searchParams: PageProps<'/login'>['searchParams'];
}) {
  //const { callbackUrl } = await searchParams;
  
  //const raw = (await searchParams)?.callbackUrl as string | undefined;
  //const callbackUrl = raw && raw.startsWith('/') ? raw : '/';

  const raw = (await searchParams)?.callbackUrl as string | undefined;
  const base = (process.env.NEXTAUTH_URL ?? '').replace(/\/$/, '');
  let callbackUrl = '/';
  if (raw) {
    try {
      const u = new URL(raw);              
      callbackUrl = base
        ? `${base}${u.pathname}${u.search}${u.hash}` 
        : `${u.pathname}${u.search}${u.hash}`;      
    } catch {
      if (raw.startsWith('/')) callbackUrl = raw;  
    }
  }

  return (
    <section className='flex min-h-screen flex-col md:flex-row'>
      <div
        className={cn(
          'relative hidden w-full md:block md:w-1/2',
          'lg:order-first hidden lg:block',
          sliderPosition === 'right' && 'lg:order-last',
        )}
      >
        <IGRPAuthCarousel carouselItems={carouselItems} />
      </div>
      <IGRPAuthForm
        texts={texts}
        logo={logo}
        name={name}
        callbackUrl={callbackUrl}
      />
    </section>
  );
}