"use client";

import { Button } from "@igrp/igrp-framework-react-design-system";
import { ArrowLeft, Ban } from "lucide-react";
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
        icon={Ban}
        eyebrow={t("eyebrow")}
        title={t("title")}
        description={t("description")}
        tone="neutral"
      />
      <Button variant="outline" size="lg" onClick={onBackHome}>
        <ArrowLeft data-icon="inline-start" />
        {tc("backHome")}
      </Button>
    </div>
  );
}
