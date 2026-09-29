import { Suspense } from "react";

import { getTranslations } from "next-intl/server";

import {
  AcceptInvitePage,
  LoadingState,
} from "@/features/users/components/invite/accept-invite-page";
import { InviteCardShell } from "@/features/users/components/invite/invite-card-shell";

export default async function Page() {
  const t = await getTranslations("users.invite.accept.loading");
  return (
    <Suspense
      fallback={
        <InviteCardShell>
          <LoadingState label={t("validatingInvite")} />
        </InviteCardShell>
      }
    >
      <AcceptInvitePage />
    </Suspense>
  );
}
