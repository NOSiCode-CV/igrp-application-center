"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect } from "react";

import { InviteCardShell } from "@/features/users/components/invite/invite-card-shell";
import { InviteErrorState } from "@/features/users/components/invite/invite-error-state";
import {
  classifyInviteError,
  type InviteErrorClass,
} from "@/features/users/components/invite/invite-flow-state";
import { reportError } from "@/lib/report-error";

const KIND_BY_CLASS: Record<
  InviteErrorClass,
  "expired" | "mismatch" | "invalid"
> = {
  expired: "expired",
  mismatch: "mismatch",
  other: "invalid",
};

export default function InviteSegmentError({
  error,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    reportError(error, { segment: "(invite)" });
  }, [error]);

  // Wrong account: route through /logout so the IdP SSO session is actually
  // terminated (a plain next-auth signOut clears only the local session, and
  // the IdP would silently re-authenticate the same wrong account on return,
  // trapping the user). After the full logout + fresh login the user lands on
  // the app home and re-opens the invite link as the correct account.
  const handleSignOut = useCallback(() => {
    router.push("/logout");
  }, [router]);

  const kind = KIND_BY_CLASS[classifyInviteError(error?.message)];

  return (
    <InviteCardShell>
      <InviteErrorState
        kind={kind}
        onBackHome={() => router.push("/")}
        onSignOut={handleSignOut}
      />
    </InviteCardShell>
  );
}
