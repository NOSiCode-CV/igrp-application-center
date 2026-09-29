"use client";

import {
  Button,
  IGRPIcon,
  type IGRPIconProps,
} from "@igrp/igrp-framework-react-design-system";
import { useTranslations } from "next-intl";

import { InviteStepHeader } from "./invite-step-header";

export type InviteErrorKind = "invalid" | "mismatch" | "expired";
interface InviteErrorStateProps {
  kind: InviteErrorKind;
  description?: string;
  onBackHome: () => void;
  onSignOut?: () => void;
}

const COPY: Record<
  InviteErrorKind,
  {
    icon: IGRPIconProps["iconName"];
    eyebrow: string;
  }
> = {
  invalid: {
    icon: "TriangleAlert",
    eyebrow: "Erro",   
  },
  mismatch: {
    icon: "MailX",
    eyebrow: "Conta diferente",   
  },
  expired: {
    icon: "Clock",
    eyebrow: "Expirado",   
  },
};

export function InviteErrorState({
  kind,
  description,
  onBackHome,
  onSignOut,
}: InviteErrorStateProps) {
  const copy = COPY[kind];

  const t = useTranslations("users.invite.accept");
  const tc = useTranslations("common.actions");

  return (
    <div className="flex flex-col gap-8">
      <InviteStepHeader
        icon={copy.icon}
        eyebrow={t(`errorStates.${kind}.eyebrow`)}
        title={t(`errorStates.${kind}.title`)}
        description={description ?? t(`errorStates.${kind}.description`)}
        tone="destructive"
      />
      <div className="flex flex-col gap-3">
        {kind !== "mismatch" ? (
          <Button variant="outline" size="lg" onClick={onBackHome}>
            <IGRPIcon iconName="ArrowLeft" data-icon="inline-start" />
            {tc("backHome")}
          </Button>
        ) : null}
        {onSignOut ? (
          <Button size="lg" onClick={onSignOut} variant="destructive">
            <IGRPIcon iconName="LogOut" data-icon="inline-start" />
            {t("useAnotherAccount")}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
