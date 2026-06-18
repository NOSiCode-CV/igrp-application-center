"use client";

import { Button } from "@igrp/igrp-framework-react-design-system";
import { ArrowLeft, Ban } from "lucide-react";

import { InviteStepHeader } from "./invite-step-header";

interface InviteRejectedStepProps {
  onBackHome: () => void;
}

export function InviteRejectedStep({ onBackHome }: InviteRejectedStepProps) {
  return (
    <div className="flex flex-col gap-8">
      <InviteStepHeader
        icon={Ban}
        eyebrow="Rejeitado"
        title="Convite rejeitado"
        description="Optou por não aceitar o acesso a este módulo."
        tone="neutral"
      />
      <Button variant="outline" size="lg" onClick={onBackHome}>
        <ArrowLeft data-icon="inline-start" />
        Voltar ao início
      </Button>
    </div>
  );
}
