"use client";

import { Button, IGRPIcon } from "@igrp/igrp-framework-react-design-system";
import { useTranslations } from "next-intl";

import { InviteStepHeader } from "./invite-step-header";

interface InviteRejectedStepProps {
  onBackHome: () => void;
}

export function InviteRejectedStep({ onBackHome }: InviteRejectedStepProps) {
  const t = useTranslations("users.invite.accept.rejectedStep");
  const tc = useTranslations("common.actions");
  return (
    <div className="flex flex-col gap-8">
      <InviteStepHeader
        icon="Ban"
        eyebrow={t("eyebrow")}
        title={t("title")}
        description={t("description")}
        tone="neutral"
      />
      <Button variant="outline" size="lg" onClick={onBackHome}>
        <IGRPIcon iconName="ArrowLeft" data-icon="inline-start" />
        {tc("backHome")}
      </Button>
    </div>
  );
}
