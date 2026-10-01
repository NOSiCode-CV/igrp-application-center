"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";

import { signIn } from "@igrp/framework-next-auth/client";
import { IGRPTemplateLoading } from "@igrp/framework-next-ui";

import { reportError } from "@/lib/report-error";

// Uma chave por app: apps no mesmo host partilham a origem e o sessionStorage.
const ATTEMPT_KEY = `igrp:auto-signin-at:${
  process.env.NEXT_PUBLIC_BASE_PATH ||
  process.env.NEXT_PUBLIC_IGRP_APP_CODE ||
  "/"
}`;
// Tem de ser maior do que uma volta completa app → IdP → app → /login.
const LOOP_WINDOW_MS = 10_000;

function readLastAttempt(): number {
  try {
    return Number(sessionStorage.getItem(ATTEMPT_KEY)) || 0;
  } catch {
    return 0;
  }
}

function writeAttempt(): void {
  try {
    sessionStorage.setItem(ATTEMPT_KEY, String(Date.now()));
  } catch {
    // Storage blocked (private mode) — no loop guard, still sign in.
  }
}

/**
 * Auto sign-in on /login: starts the OIDC flow straight away so a user with a
 * live IdP SSO session (e.g. coming from another IGRP app on the same host)
 * gets back in without clicking "Entrar". Falls back to the manual form when
 * the user lands on /login again right after an attempt (loop guard).
 */
export function AutoSignIn({
  providerId,
  callbackUrl,
  fallback,
}: {
  providerId: string;
  callbackUrl: string;
  fallback: ReactNode;
}) {
  const startedRef = useRef(false);
  const [showFallback, setShowFallback] = useState(false);

  useEffect(() => {
    // Strict Mode re-fires effects in dev; the redirect must start once.
    if (startedRef.current) return;
    startedRef.current = true;

    if (Date.now() - readLastAttempt() < LOOP_WINDOW_MS) {
      console.warn(
        "[login][auto-signin] returned to /login right after an auto sign-in — showing the manual form to avoid a redirect loop",
      );
      setShowFallback(true);
      return;
    }

    writeAttempt();
    signIn(providerId, { callbackUrl }).catch((error: unknown) => {
      console.error("[login][auto-signin] signIn failed", error);
      reportError(error, { segment: "(auth)/login:auto-sign-in" });
      setShowFallback(true);
    });
  }, [providerId, callbackUrl]);

  if (showFallback) return <>{fallback}</>;

  return (
    <IGRPTemplateLoading
      text="A iniciar sessão..."
      appCode={process.env.NEXT_PUBLIC_IGRP_APP_CODE}
    />
  );
}
