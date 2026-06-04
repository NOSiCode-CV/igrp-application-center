"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

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

  const kind = KIND_BY_CLASS[classifyInviteError(error?.message)];

  return (
    <InviteCardShell>
      <InviteErrorState kind={kind} onBackHome={() => router.push("/")} />
    </InviteCardShell>
  );
}
