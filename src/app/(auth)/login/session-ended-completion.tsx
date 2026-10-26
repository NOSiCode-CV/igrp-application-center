"use client";

import { useEffect, useRef } from "react";

import { signOut } from "@igrp/framework-next-auth/client";
import { IGRPTemplateLoading } from "@igrp/framework-next-ui";
import { useTranslations } from "next-intl";

import { reportError } from "@/lib/report-error";

/**
 * Access Management answered 401, so the framework sent us here with
 * `?reason=session_ended`. A server render can't clear cookies; this signs the
 * app out locally and reloads /login without `reason`. Unlike LogoutCompletion
 * it leaves silent SSO enabled, so a user whose IdP session is alive gets
 * straight back in (the silent-sso cookie guards against a loop).
 */
export function SessionEndedCompletion() {
  const t = useTranslations("auth");
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    (async () => {
      try {
        await signOut({ redirect: false });
      } catch (error) {
        console.error("[session-ended][client] signOut threw", error);
        reportError(error, { segment: "(auth)/login:session-ended" });
      } finally {
        const url = new URL(window.location.href);
        url.searchParams.delete("reason");
        window.location.replace(url.toString());
      }
    })();
  }, []);

  return (
    <IGRPTemplateLoading
      text={t("signingOut")}
      appCode={process.env.NEXT_PUBLIC_IGRP_APP_CODE}
    />
  );
}
