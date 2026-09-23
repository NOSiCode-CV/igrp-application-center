"use client";

import { Button } from "@igrp/igrp-framework-react-design-system";
import {
  AlertTriangle,
  ArrowLeft,
  Clock,
  LogOut,
  type LucideIcon,
  MailX,
} from "lucide-react";
import { useTranslations } from "next-intl";

import { InviteStepHeader } from "./invite-step-header";

export type InviteErrorKind = "invalid" | "mismatch" | "expired";
interface InviteErrorStateProps {
  kind: InviteErrorKind;
  description?: string;
  onBackHome: () => void;
  onSignOut?: () => void;
}

const ICONS: Record<InviteErrorKind, LucideIcon> = {
  invalid: AlertTriangle,
  mismatch: MailX,
  expired: Clock,
};

export function InviteErrorState({
  kind,
  description,
  onBackHome,
  onSignOut,
}: InviteErrorStateProps) {
  const t = useTranslations("users.invite.accept");
  const tc = useTranslations("common.actions");

  return (
    <div className="flex flex-col gap-8">
      <InviteStepHeader
        icon={ICONS[kind]}
        eyebrow={t(`errorStates.${kind}.eyebrow`)}
        title={t(`errorStates.${kind}.title`)}
        description={description ?? t(`errorStates.${kind}.description`)}
        tone="destructive"
      />
      <div className="flex flex-col gap-3">
        {kind !== "mismatch" ? (
          <Button variant="outline" size="lg" onClick={onBackHome}>
            <ArrowLeft data-icon="inline-start" />
            {tc("backHome")}
          </Button>
        ) : null}
        {onSignOut ? (
          <Button size="lg" onClick={onSignOut} variant="destructive">
            <LogOut data-icon="inline-start" />
            {t("useAnotherAccount")}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
