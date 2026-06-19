import { Suspense } from "react";

import {
  AcceptInvitePage,
  LoadingState,
} from "@/features/users/components/invite/accept-invite-page";
import { InviteCardShell } from "@/features/users/components/invite/invite-card-shell";

export default function Page() {
  return (
    <Suspense
      fallback={
        <InviteCardShell>
          <LoadingState label="A validar convite…" />
        </InviteCardShell>
      }
    >
      <AcceptInvitePage />
    </Suspense>
  );
}
