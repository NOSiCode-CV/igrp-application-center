"use client";

import {
  Button,
  IGRPIcon,
  type IGRPIconProps,
} from "@igrp/igrp-framework-react-design-system";

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
    title: string;
    description: string;
  }
> = {
  invalid: {
    icon: "TriangleAlert",
    eyebrow: "Erro",
    title: "Convite inválido",
    description:
      "Não foi possível encontrar este convite. O link pode estar incorreto.",
  },
  mismatch: {
    icon: "MailX",
    eyebrow: "Conta diferente",
    title: "Convite não corresponde",
    description:
      "Este convite não foi enviado para a conta com que iniciou sessão.",
  },
  expired: {
    icon: "Clock",
    eyebrow: "Expirado",
    title: "Convite expirado",
    description:
      "Este convite já expirou. Solicite um novo convite ao administrador.",
  },
};

export function InviteErrorState({
  kind,
  description,
  onBackHome,
  onSignOut,
}: InviteErrorStateProps) {
  const copy = COPY[kind];

  return (
    <div className="flex flex-col gap-8">
      <InviteStepHeader
        icon={copy.icon}
        eyebrow={copy.eyebrow}
        title={copy.title}
        description={description ?? copy.description}
        tone="destructive"
      />
      <div className="flex flex-col gap-3">
        {kind !== "mismatch" ? (
          <Button variant="outline" size="lg" onClick={onBackHome}>
            <IGRPIcon iconName="ArrowLeft" data-icon="inline-start" />
            Voltar ao início
          </Button>
        ) : null}
        {onSignOut ? (
          <Button size="lg" onClick={onSignOut} variant="destructive">
            <IGRPIcon iconName="LogOut" data-icon="inline-start" />
            Usar outra conta
          </Button>
        ) : null}
      </div>
    </div>
  );
}
