"use client";

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  IGRPButton,
  Input,
  Label,
  useIGRPToast,
} from "@igrp/igrp-framework-react-design-system";
import { useState } from "react";
import { useKillUserSession, useUserSession } from "../use-users";

interface UserSessionsTabProps {
  username: string | undefined;
}

export function UserSessionsTab({ username }: UserSessionsTabProps) {
  const { data: session, isLoading } = useUserSession(username);
  const killMutation = useKillUserSession();
  const { igrpToast } = useIGRPToast();

  const [killDialogOpen, setKillDialogOpen] = useState(false);
  const [reason, setReason] = useState("");

  if (!username) {
    return (
      <p className="p-4 text-sm text-muted-foreground">
        Identificador externo não disponível para este utilizador.
      </p>
    );
  }

  if (isLoading) return null;

  if (!session) {
    return (
      <p className="p-4 text-sm text-muted-foreground">Sem sessões ativas.</p>
    );
  }

  const handleKill = async () => {
    const result = await killMutation.mutateAsync({
      sessionId: session.sessionId,
      reason,
      userExternalId: username,
    });
    if (result.success) {
      igrpToast({ type: "success", title: "Sessão terminada", duration: 4000 });
      setKillDialogOpen(false);
      setReason("");
    } else {
      igrpToast({
        type: "error",
        title: "Erro ao terminar sessão",
        duration: 4000,
      });
    }
  };

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Sessão Ativa</h3>
      </div>

      <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
        <span className="text-muted-foreground">ID da sessão</span>
        <span className="font-mono">{session.sessionId.slice(0, 8)}…</span>

        <span className="text-muted-foreground">Iniciada em</span>
        <span>
          {session.startedAt
            ? new Date(session.startedAt).toLocaleString("pt-CV")
            : "—"}
        </span>

        <span className="text-muted-foreground">Último acesso</span>
        <span>
          {session.lastSeenAt
            ? new Date(session.lastSeenAt).toLocaleString("pt-CV")
            : "—"}
        </span>

        <span className="text-muted-foreground">IP</span>
        <span>{session.clientIp ?? "—"}</span>
      </div>

      <div className="flex justify-end">
        <IGRPButton
          size="sm"
          variant="destructive"
          onClick={() => setKillDialogOpen(true)}
        >
          Terminar sessão
        </IGRPButton>
      </div>

      <AlertDialog open={killDialogOpen} onOpenChange={setKillDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Terminar sessão</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação irá encerrar a sessão ativa do utilizador imediatamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex flex-col gap-2 py-2">
            <Label>Motivo</Label>
            <Input
              placeholder="Indique o motivo..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
          <AlertDialogFooter>
            <IGRPButton
              variant="outline"
              onClick={() => setKillDialogOpen(false)}
            >
              Cancelar
            </IGRPButton>
            <IGRPButton
              variant="destructive"
              disabled={!reason.trim() || killMutation.isPending}
              onClick={handleKill}
            >
              Confirmar
            </IGRPButton>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
