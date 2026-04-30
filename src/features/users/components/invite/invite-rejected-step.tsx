"use client";

import { IGRPButton, IGRPIcon } from "@igrp/igrp-framework-react-design-system";

interface InviteRejectedStepProps {
  onBackHome: () => void;
}

export function InviteRejectedStep({ onBackHome }: InviteRejectedStepProps) {
  return (
    <div className="space-y-6 text-center animate-in zoom-in duration-300">
      <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <IGRPIcon iconName="X" className="h-10 w-10" aria-hidden="true" />
      </div>
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">Convite Rejeitado</h2>
        <p className="text-sm text-muted-foreground">
          Você optou por não aceitar o acesso a este módulo.
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
