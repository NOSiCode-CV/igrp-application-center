import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { IGRPLocaleSwitcher } from "@igrp/framework-next/i18n/client";
import { getAuthProviderIdFromEnv } from "@igrp/framework-next-auth";
import { IGRPAuthCarousel, IGRPAuthForm } from "@igrp/framework-next-ui";
import { cn } from "@igrp/igrp-framework-react-design-system/cn";

import { carouselItems, loginConfig } from "@/config/login";
import { siteConfig } from "@/config/site";
import { setLocale } from "@/i18n/actions";
import { LOGOUT_PENDING_COOKIE } from "@/lib/logout-pending";
import {
  SILENT_SSO_COOKIE,
  shouldAttemptSilentSso,
  silentSsoCallbackUrl,
} from "@/lib/silent-sso";
import { isAuthBypass, sanitizeCallbackUrl } from "@/lib/utilities";

import { LogoutCompletion } from "./logout-completion";
import { SilentSignIn } from "./silent-sign-in";

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

  // Deferred logout (Option A): the logout page set this marker and left for
  // the IdP without clearing the local session. The browser is now back on
  // /login (the IdP's redirect-back = confirmation), or the middleware backstop
  // sent us here with a still-live session. Either way, complete the teardown:
  // render LogoutCompletion (it runs signOut, clears the marker, reloads) and
  // skip the login form until that round-trip finishes.
  const cookieStore = await cookies();
  if (cookieStore.has(LOGOUT_PENDING_COOKIE)) {
    return <LogoutCompletion />;
  }

  const { callbackUrl, error } = await searchParams;
  const silentSso = cookieStore.get(SILENT_SSO_COOKIE);
  // Drop callbackUrl values that would bounce the user back to /login (or
  // /logout) after the OIDC round-trip — those produce the nested
  // `?callbackUrl=…?callbackUrl=…` chain. After a failed silent attempt the
  // query value is NextAuth's absolute URL, which this rejects, so the value
  // the attempt set out with is recovered from its cookie. Fall back to `/`
  // so a successful login lands on the app home.
  const safeCallbackUrl =
    sanitizeCallbackUrl(callbackUrl) ??
    silentSsoCallbackUrl(silentSso?.value) ??
    "/";
  const providerId = getAuthProviderIdFromEnv(process.env);

  // Silent SSO: still signed in at the IdP (e.g. coming from another app) →
  // straight into the app with no click. See lib/silent-sso.ts.
  if (
    shouldAttemptSilentSso({
      alreadyTried: silentSso !== undefined,
      error,
      providerId,
    })
  ) {
    return (
      <SilentSignIn providerId={providerId} callbackUrl={safeCallbackUrl} />
    );
  }

  return (
    <section className="relative flex min-h-screen flex-col md:flex-row">
      <div className="absolute top-8 right-16 z-10">
        <IGRPLocaleSwitcher action={setLocale} />
      </div>
      <div
        className={cn(
          "relative hidden w-full md:block md:w-1/2",
          "lg:order-first",
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
