"use client";

import { IGRPIcon } from "@igrp/igrp-framework-react-design-system";

export function InvitePendingState() {
  return (
    <div className="space-y-6 text-center animate-in zoom-in duration-300">
      <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-primary">
        <IGRPIcon iconName="Mail" className="h-10 w-10" />
      </div>
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">Convite pendente</h2>
        <p className="text-sm text-muted-foreground px-4">
          Você tem um convite pendente. Verifique o seu email para encontrar o
          link de convite e continuar.
        </p>
      </div>
    </div>
  );
}
