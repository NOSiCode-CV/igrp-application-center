"use client";

import { useEffect, useRef } from "react";

import { type AuthProviderId, signIn } from "@igrp/framework-next-auth/client";
import { IGRPTemplateLoading } from "@igrp/framework-next-ui";

import { reportError } from "@/lib/report-error";
import { markSilentSsoTried } from "@/lib/silent-sso";

/**
 * Silent SSO attempt (OIDC `prompt=none`) — see `lib/silent-sso.ts`.
 *
 * Rendered by the login page (server) instead of the form when a silent
 * attempt is worth making. The IdP either returns a code (the user lands on
 * `callbackUrl` without clicking anything) or `login_required`, which NextAuth
 * turns into `/login?error=Callback` — where the form is shown.
 */
export function SilentSignIn({
  providerId,
  callbackUrl,
}: {
  providerId: AuthProviderId;
  callbackUrl: string;
}) {
  // Module-instance guard: the attempt must start exactly once even if the
  // effect re-fires (Strict Mode mount→unmount→mount in dev).
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    // Loop guard first: whatever happens next, the login page must not try
    // again until the cookie expires.
    markSilentSsoTried(callbackUrl);

    signIn(providerId, { callbackUrl }, { prompt: "none" }).catch((error) => {
      // `signIn` rejects only before it can navigate (CSRF fetch failed, etc.).
      // Reload: the loop guard is set, so the server now renders the form.
      console.error("[login] silent sign-in threw", error);
      reportError(error, { segment: "(auth)/login:silent-sign-in" });
      window.location.reload();
    });
  }, [providerId, callbackUrl]);

  return (
    <IGRPTemplateLoading
      text="Aguarde..."
      appCode={process.env.NEXT_PUBLIC_IGRP_APP_CODE}
    />
  );
}
