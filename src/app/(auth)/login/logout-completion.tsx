"use client";

import { signOut } from "@igrp/framework-next-auth/client";
import { IGRPTemplateLoading } from "@igrp/framework-next-ui";
import { useEffect, useRef } from "react";

import { clearLogoutPending } from "@/lib/logout-pending";
import { reportError } from "@/lib/report-error";

/**
 * Deferred logout teardown (Option A).
 *
 * The logout page no longer clears the local NextAuth session before POSTing to
 * the IdP — it sets a `logout_pending` cookie and leaves. The IdP's redirect
 * back to /login is the confirmation that the SSO session was terminated; this
 * component runs the local signOut() at that point, clears the marker, then
 * reloads /login so the server re-renders the login form with no session.
 *
 * Rendered by the login page (server) only when the marker is present, so a
 * normal login visit never mounts this and shows the form immediately.
 */
export function LogoutCompletion() {
  // Module-instance guard: the async teardown must run exactly once even if the
  // effect re-fires (Strict Mode mount→unmount→mount in dev).
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    (async () => {
      console.log("[logout][client] completing deferred signOut on /login…");
      try {
        await signOut({ redirect: false });
        console.log("[logout][client] deferred signOut complete");
      } catch (error) {
        console.error("[logout][client] deferred signOut threw", error);
        reportError(error, { segment: "(auth)/login:logout-completion" });
      } finally {
        // Clear the marker BEFORE reloading (document.cookie is synchronous, so
        // the cookie is gone before the next request fires). On reload the
        // server no longer gates on the marker and renders the login form; the
        // full reload also forces every server component to re-read the now-
        // cleared session.
        clearLogoutPending();
        const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
        window.location.replace(`${window.location.origin}${basePath}/login`);
      }
    })();
  }, []);

  return (
    <IGRPTemplateLoading
      text="A terminar sessão..."
      appCode={process.env.NEXT_PUBLIC_IGRP_APP_CODE}
    />
  );
}
