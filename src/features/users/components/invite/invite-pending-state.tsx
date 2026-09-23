"use client";

import { useRouter } from "next/navigation";

import { Button } from "@igrp/igrp-framework-react-design-system";
import { LogOut, Mail } from "lucide-react";
import { useTranslations } from "next-intl";

import { InviteStepHeader } from "./invite-step-header";

export function InvitePendingState() {
  const router = useRouter();
  const t = useTranslations("users.invite.accept.pendingState");

  return (
    <div className="flex flex-col gap-8">
      <InviteStepHeader
        icon={Mail}
        eyebrow={t("eyebrow")}
        title={t("title")}
        description={t("description")}
      />
      <Button
        variant="outline"
        size="lg"
        onClick={() => router.push("/logout")}
      >
        <LogOut data-icon="inline-start" />
        {t("signOut")}
      </Button>
    </div>
  );
}
