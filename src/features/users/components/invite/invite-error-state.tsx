"use client";

import { IGRPButton, IGRPIcon } from "@igrp/igrp-framework-react-design-system";

interface InviteErrorStateProps {
  kind: "invalid" | "mismatch";
  onBackHome: () => void;
}

const COPY = {
  invalid: {
    title: "Convite inválido",
    description:
      "Não foi possível encontrar este convite. O link pode estar incorreto ou ter expirado.",
  },
  mismatch: {
    title: "Convite não corresponde",
    description: "Este convite não foi enviado para sua conta.",
  },
} as const;

export function InviteErrorState({ kind, onBackHome }: InviteErrorStateProps) {
  const { title, description } = COPY[kind];

  return (
    <div className="space-y-6 text-center animate-in zoom-in duration-300">
      <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <IGRPIcon iconName="AlertTriangle" className="h-10 w-10" />
      </div>
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">{title}</h2>
        <p className="text-sm text-muted-foreground px-4">{description}</p>
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
