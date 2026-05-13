import { InviteCardShell } from "@/features/users/components/invite/invite-card-shell";
import { InvitePendingState } from "@/features/users/components/invite/invite-pending-state";

export default function InvitePendingPage() {
  return (
    <InviteCardShell>
      <InvitePendingState />
    </InviteCardShell>
  );
}
