"use client";

import { signOut } from "@igrp/framework-next-auth/client";
import { IGRPTemplateLoading } from "@igrp/framework-next-ui";
import { useEffect, useRef, useState } from "react";

import { getLogoutUrl } from "@/actions/igrp/auth";
import { reportError } from "@/lib/report-error";

// Module-scoped guard so a remount of this page (e.g. provider re-renders that
// briefly null out the subtree) cannot kick off a SECOND signOut. A `useRef`
// is component-instance scoped and gets re-created on remount, which is how
// the previous guard let two `POST /api/auth/signout` calls slip through in
// dev.
let logoutStarted = false;

// Cap on the IdP end-session URL lookup (which does an OIDC discovery
// round-trip). Bounding it is what lets the mandatory local signOut() run
// unconditionally: a slow/hanging IdP can only cost us the OPTIONAL IdP
// redirect, never the local teardown.
// TRADE-OFF: if your IdP's discovery latency routinely exceeds this, every
// logout degrades to local-only (the IdP SSO session then persists). Tune to
// sit just above real-world discovery latency.
const LOOKUP_TIMEOUT_MS = 3000;

// Last-resort watchdog. Only fires if signOut() ITSELF hangs — the lookup
// above is already bounded by LOOKUP_TIMEOUT_MS, so it can no longer stall the
// effect this long. MUST be greater than LOOKUP_TIMEOUT_MS.
const FALLBACK_TIMEOUT_MS = 8000;

function buildLoginUrl(): string {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  return `${window.location.origin}${basePath}/login`;
}

// Shape for the IdP end-session request, split so it can be submitted as a
// top-level POST (params in the body) instead of a GET (params in the URL).
type EndSessionPost = { action: string; fields: Record<string, string> };

export default function LogoutPage() {
  // When set, the end-session POST form is rendered and auto-submitted. We use
  // POST rather than a `window.location` GET so `id_token_hint` (the full
  // signed ID token) rides in the request body — never the URL, browser
  // history, or the IdP's access logs. It is still a TOP-LEVEL navigation, so
  // the browser presents the IdP SSO cookie and the session is terminated.
  const [endSessionPost, setEndSessionPost] = useState<EndSessionPost | null>(
    null,
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (logoutStarted) return;
    logoutStarted = true;

    // Single source of truth for "we've already committed to navigating away".
    // Shared by the fallback timer, the async logout body, and the IdP-POST
    // branch so only ONE of them ever triggers a navigation.
    let settled = false;
    const hardNavigate = (url: string) => {
      if (settled) return;
      settled = true;
      // Hard navigation rather than `router.replace`: logout must tear down
      // every client cache/provider that still holds the now-dead session.
      //
      // INVARIANT: every exit path MUST navigate away — either here, or via the
      // end-session POST form. Because `logoutStarted` is never reset, a
      // full-page load is the only thing that re-arms this page; a soft-nav (or
      // an early return without navigating) would wedge it un-loggable-out for
      // the rest of the SPA lifetime.
      window.location.replace(url);
    };

    // Last-resort watchdog for a hung signOut(). The IdP end-session lookup is
    // already bounded by LOOKUP_TIMEOUT_MS below, so it can no longer stall the
    // effect this long — the only thing that can is signOut() itself.
    //
    // Deliberately NOT cleared on unmount. The `logoutStarted` module guard
    // makes the effect body run exactly ONCE per module lifetime, so a remount
    // during the logout window (React Strict Mode's mount→unmount→mount in dev,
    // or `IGRPSessionWatcher` re-rendering the subtree on a session refetch)
    // cannot re-arm this timer. If the unmount cleanup cleared it, that remount
    // would strip away the only safety net and — should signOut() stall — leave
    // the page rendering the spinner forever. The `settled` flag already
    // prevents a double navigation, so a surviving timer that fires after a
    // successful navigate is a harmless no-op (the page has already
    // hard-navigated away).
    const fallbackTimeout = setTimeout(
      () => hardNavigate(buildLoginUrl()),
      FALLBACK_TIMEOUT_MS,
    );

    (async () => {
      // Best-effort: fetch the end-session URL BEFORE clearing the local
      // session — the token needed to build the id_token_hint parameter is
      // gone after signOut(). A failure OR a hang here must NOT block the local
      // signOut below; otherwise a flaky/hanging IdP discovery round-trip would
      // strand the user still authenticated (session cookie intact) even though
      // we navigate them to /login.
      //
      // The lookup is raced against LOOKUP_TIMEOUT_MS so a hung IdP can only
      // cost us the (optional) IdP redirect — never the (mandatory) local
      // teardown. This is what makes signOut() below unconditional: the outer
      // fallbackTimeout is now a true last resort (covers a hung signOut
      // itself) rather than something that can pre-empt signOut while this
      // lookup is still pending. Worst case on timeout/failure: we skip the IdP
      // redirect and its SSO session lingers, but the local session is still
      // torn down.
      let endSessionUrl: string | null = null;
      let lookupTimer: ReturnType<typeof setTimeout> | undefined;
      try {
        endSessionUrl = await Promise.race([
          getLogoutUrl(buildLoginUrl()),
          new Promise<null>((resolve) => {
            lookupTimer = setTimeout(() => resolve(null), LOOKUP_TIMEOUT_MS);
          }),
        ]);
      } catch (error) {
        reportError(error, { segment: "(auth)/logout" });
      } finally {
        // Clear the race timer if getLogoutUrl won — otherwise it lingers and
        // fires later to resolve an already-settled promise (a harmless no-op,
        // but a needless dangling timer).
        clearTimeout(lookupTimer);
      }

      // The one step that must never be skipped: clear the local NextAuth
      // session. Isolated in its own try so a rejection still falls through to
      // the navigation below rather than leaving the spinner up forever.
      try {
        await signOut({ redirect: false });
      } catch (error) {
        reportError(error, { segment: "(auth)/logout" });
      }

      clearTimeout(fallbackTimeout);
      if (settled) return;

      if (endSessionUrl) {
        // Commit to the IdP-POST path: mark settled so the fallback timer /
        // hardNavigate can no longer fire, then split the URL into a bare
        // endpoint (form action) + params (hidden fields) and let the render
        // below auto-submit it.
        settled = true;
        const url = new URL(endSessionUrl);
        if (process.env.NODE_ENV !== "production") {
          console.debug(
            "[logout] posting to end-session endpoint",
            `${url.origin}${url.pathname}`,
          );
        }
        setEndSessionPost({
          action: `${url.origin}${url.pathname}`,
          fields: Object.fromEntries(url.searchParams),
        });
      } else {
        if (process.env.NODE_ENV !== "production") {
          console.warn(
            "[logout] no end-session URL — IdP SSO session may persist; falling back to /login",
          );
        }
        hardNavigate(buildLoginUrl());
      }
    })();
  }, []);

  // Auto-submit the end-session form once it has rendered. This is the
  // top-level cross-origin POST that terminates the IdP session; submitting
  // from an effect (rather than building the form imperatively) keeps React in
  // charge of the DOM node and is SSR-safe.
  useEffect(() => {
    if (endSessionPost) formRef.current?.requestSubmit();
  }, [endSessionPost]);

  return (
    <>
      <IGRPTemplateLoading
        text="A terminar sessão..."
        appCode={process.env.NEXT_PUBLIC_IGRP_APP_CODE}
      />
      {endSessionPost && (
        <form ref={formRef} method="POST" action={endSessionPost.action} hidden>
          {Object.entries(endSessionPost.fields).map(([name, value]) => (
            <input key={name} type="hidden" name={name} defaultValue={value} />
          ))}
        </form>
      )}
    </>
  );
}
