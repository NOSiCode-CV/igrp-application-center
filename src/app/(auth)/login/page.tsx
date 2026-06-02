import { getAuthProviderIdFromEnv } from "@igrp/framework-next-auth";
import { IGRPAuthCarousel, IGRPAuthForm } from "@igrp/framework-next-ui";
import { redirect } from "next/navigation";

import { carouselItems, loginConfig } from "@/config/login";
import { siteConfig } from "@/config/site";
import { cn, isAuthBypass, sanitizeCallbackUrl } from "@/lib/utils";

const { sliderPosition, texts } = loginConfig;
const { logo, name } = siteConfig;

export default async function AuthPage({
  searchParams,
}: {
  searchParams: PageProps<"/login">["searchParams"];
}) {
  // When auth is bypassed (preview mode OR AUTH_PROVIDER=none) there is no
  // real provider to sign into — send the user to the app home instead of
  // rendering a login form that would only 404 on submit.
  if (isAuthBypass()) {
    redirect("/");
  }

  const { callbackUrl } = await searchParams;
  // Drop callbackUrl values that would bounce the user back to /login (or
  // /logout) after the OIDC round-trip — those produce the nested
  // `?callbackUrl=…?callbackUrl=…` chain. Fall back to `/` so a successful
  // login lands on the app home.
  const safeCallbackUrl = sanitizeCallbackUrl(callbackUrl) ?? "/";
  const providerId = getAuthProviderIdFromEnv(process.env);

  return (
    <section className="flex min-h-screen flex-col md:flex-row">
      <div
        className={cn(
          "relative hidden w-full md:block md:w-1/2",
          "lg:order-first hidden lg:block",
          sliderPosition === "right" && "lg:order-last",
        )}
      >
        <IGRPAuthCarousel carouselItems={carouselItems} />
      </div>
      <IGRPAuthForm
        texts={texts}
        logo={logo}
        name={name}
        callbackUrl={safeCallbackUrl}
        providerId={providerId}
      />
    </section>
  );
}
