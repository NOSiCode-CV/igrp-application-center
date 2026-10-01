import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { getAuthProviderIdFromEnv } from "@igrp/framework-next-auth";
import { IGRPAuthCarousel, IGRPAuthForm } from "@igrp/framework-next-ui";
import { cn } from "@igrp/igrp-framework-react-design-system/cn";

import { carouselItems, loginConfig } from "@/config/login";
import { siteConfig } from "@/config/site";
import { LocaleSwitcher } from "@/i18n/components/locale-switcher";
import { LOGOUT_PENDING_COOKIE } from "@/lib/logout-pending";
import { isAuthBypass, sanitizeCallbackUrl } from "@/lib/utilities";

import { AutoSignIn } from "./auto-sign-in";
import { LogoutCompletion } from "./logout-completion";

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

  const { callbackUrl, error, loggedOut } = await searchParams;
  // Drop callbackUrl values that would bounce the user back to /login (or
  // /logout) after the OIDC round-trip — those produce the nested
  // `?callbackUrl=…?callbackUrl=…` chain. Fall back to `/` so a successful
  // login lands on the app home.
  const safeCallbackUrl = sanitizeCallbackUrl(callbackUrl) ?? "/";
  const providerId = getAuthProviderIdFromEnv(process.env);

  const loginForm = (
    <section className="relative flex min-h-screen flex-col md:flex-row">
      <div className="absolute top-8 right-16 z-10">
        <LocaleSwitcher />
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

  // Auto sign-in: start the IdP flow straight away so a live SSO session (e.g.
  // coming from another app on the same host) needs no click. The form shows on
  // a NextAuth error (retrying would loop), right after logout, when disabled
  // via IGRP_LOGIN_AUTO_SIGNIN=false, or when AutoSignIn detects a loop.
  const autoSignInEnabled =
    process.env.IGRP_LOGIN_AUTO_SIGNIN?.trim().toLowerCase() !== "false";
  if (autoSignInEnabled && !error && !loggedOut) {
    return (
      <AutoSignIn
        providerId={providerId}
        callbackUrl={safeCallbackUrl}
        fallback={loginForm}
      />
    );
  }

  return loginForm;
}
