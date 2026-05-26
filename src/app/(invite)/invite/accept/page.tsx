import { Suspense } from "react";
import { AcceptInvitePage } from "@/features/users/components/invite/accept-invite-page";
import { InviteCardShell } from "@/features/users/components/invite/invite-card-shell";

export default function Page() {
  return (
    <Suspense fallback={<InviteCardShell>{null}</InviteCardShell>}>
      <AcceptInvitePage />
    </Suspense>
  );
}
