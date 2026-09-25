"use client";

import { useRouter } from "next/navigation";

import { Button, IGRPIcon } from "@igrp/igrp-framework-react-design-system";

import { InviteStepHeader } from "./invite-step-header";

export function InvitePendingState() {
  const router = useRouter();

  return (
    <div className="flex flex-col gap-8">
      <InviteStepHeader
        icon="Mail"
        eyebrow="Pendente"
        title="Convite pendente"
        description="Tem um convite pendente. Verifique o seu email para encontrar o link e continuar."
      />
      <Button
        variant="outline"
        size="lg"
        onClick={() => router.push("/logout")}
      >
        <IGRPIcon iconName="LogOut" data-icon="inline-start" />
        Terminar sessão
      </Button>
    </div>
  );
}
