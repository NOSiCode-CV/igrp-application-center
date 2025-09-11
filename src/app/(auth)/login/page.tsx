import { loginConfig, carouselItems } from '@/config/login';
import { siteConfig } from '@/config/site';
import { cn } from '@/lib/utils';
import { IGRPAuthCarousel, IGRPAuthForm } from '@igrp/framework-next-ui';

const { sliderPosition, texts } = loginConfig;
const { logo, name } = siteConfig;

export default async function AuthPage() {
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
      />
    </section>
  );
}
