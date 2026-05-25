"use client";

import { IGRPButton, IGRPIcon } from "@igrp/igrp-framework-react-design-system";

export type InviteErrorKind = "invalid" | "mismatch" | "expired";

interface InviteErrorStateProps {
  kind: InviteErrorKind;
  description?: string;
  onBackHome: () => void;
}

const COPY: Record<InviteErrorKind, { title: string; description: string }> = {
  invalid: {
    title: "Convite inválido",
    description:
      "Não foi possível encontrar este convite. O link pode estar incorreto.",
  },
  mismatch: {
    title: "Convite não corresponde",
    description:
      "Este convite não foi enviado para a conta com que iniciou sessão.",
  },
  expired: {
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
  const { title, description: defaultDescription } = COPY[kind];

  return (
    <div className="space-y-6 text-center animate-in zoom-in duration-300">
      <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <IGRPIcon iconName="AlertTriangle" className="h-10 w-10" />
      </div>
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">{title}</h2>
        <p className="text-sm text-muted-foreground px-4">
          {description ?? defaultDescription}
        </p>
      </div>
      <IGRPButton
        variant="outline"
        onClick={onBackHome}
        showIcon
        iconName="ArrowLeft"
        iconPlacement="start"
      >
        Voltar ao início
      </IGRPButton>
    </div>
  );
}
