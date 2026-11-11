"use client";

import { useEffect, useRef, useState } from "react";

import { signOut } from "@igrp/framework-next-auth/client";
import { IGRPTemplateLoading } from "@igrp/framework-next-ui";
import { IGRPButton } from "@igrp/igrp-framework-react-design-system";
import { useTranslations } from "next-intl";

import { reportError } from "@/lib/report-error";

/**
 * Access Management answered 401, so the framework sent us here with
 * `?reason=session_ended`. A server render can't clear cookies; this signs the
 * app out locally and reloads /login without `reason`. Unlike LogoutCompletion
 * it leaves silent SSO enabled, so a user whose IdP session is alive gets
 * straight back in (the silent-sso cookie guards against a loop).
 *
 * `needsConfirm` is set by the server page for arrivals that started on another
 * site (CSRF, finding F3): the sign-out then waits for a click.
 */
export function SessionEndedCompletion({
  needsConfirm,
}: {
  needsConfirm: boolean;
}) {
  const t = useTranslations("auth");
  const startedRef = useRef(false);
  const [confirmed, setConfirmed] = useState(false);
  const awaitingConfirm = needsConfirm && !confirmed;

  useEffect(() => {
    if (awaitingConfirm || startedRef.current) return;
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
  }, [awaitingConfirm]);

  if (awaitingConfirm) {
    return (
      <div className="flex min-h-svh items-center justify-center p-4">
        <IGRPButton
          showIcon
          iconName="LogOut"
          onClick={() => setConfirmed(true)}
        >
          {t("signOut")}
        </IGRPButton>
      </div>
    );
  }

  return (
    <IGRPTemplateLoading
      text={t("signingOut")}
      appCode={process.env.NEXT_PUBLIC_IGRP_APP_CODE}
    />
  );
}
