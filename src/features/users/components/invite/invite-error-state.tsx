"use client";

import { Button } from "@igrp/igrp-framework-react-design-system";
import type { LucideIcon } from "lucide-react";
import { AlertTriangle, ArrowLeft, Clock, MailX } from "lucide-react";
import { InviteStepHeader } from "./invite-step-header";

export type InviteErrorKind = "invalid" | "mismatch" | "expired";

interface InviteErrorStateProps {
  kind: InviteErrorKind;
  description?: string;
  onBackHome: () => void;
}

const COPY: Record<
  InviteErrorKind,
  { icon: LucideIcon; eyebrow: string; title: string; description: string }
> = {
  invalid: {
    icon: AlertTriangle,
    eyebrow: "Erro",
    title: "Convite inválido",
    description:
      "Não foi possível encontrar este convite. O link pode estar incorreto.",
  },
  mismatch: {
    icon: MailX,
    eyebrow: "Conta diferente",
    title: "Convite não corresponde",
    description:
      "Este convite não foi enviado para a conta com que iniciou sessão.",
  },
  expired: {
    icon: Clock,
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
      <Button variant="outline" size="lg" onClick={onBackHome}>
        <ArrowLeft data-icon="inline-start" />
        Voltar ao início
      </Button>
    </div>
  );
}
