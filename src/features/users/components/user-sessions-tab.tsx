"use client";

import { useState } from "react";

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
import { useTranslations } from "next-intl";

import { AppCenterLoading } from "@/components/loading";
import { useFormat } from "@/i18n/format";
import { DATE_TIME_WITH_SECONDS } from "@/lib/utilities";

import { useKillUserSession, useUserSession } from "../use-users";

interface UserSessionsTabProps {
  username: string;
}

export function UserSessionsTab({ username }: UserSessionsTabProps) {
  const { data: session, isLoading } = useUserSession(username);
  const killMutation = useKillUserSession();

  const { igrpToast } = useIGRPToast();
  const t = useTranslations("users.sessions");
  const tc = useTranslations("common.actions");

  const { formatDateTime } = useFormat();

  const [killDialogOpen, setKillDialogOpen] = useState(false);
  const [reason, setReason] = useState("");

  if (!username) {
    return (
      <p className="p-4 text-sm text-muted-foreground">{t("noExternalId")}</p>
    );
  }

  if (isLoading) {
    return (
      <AppCenterLoading description="A carregar sessões do utilizador..." />
    );
  }

  if (!session) {
    return <p className="p-4 text-sm text-muted-foreground">{t("empty")}</p>;
  }

  const handleKill = async () => {
    const result = await killMutation.mutateAsync({
      sessionId: session.sessionId,
      reason,
      userExternalId: username,
    });
    if (result.success) {
      igrpToast({ type: "success", title: t("toasts.killed"), duration: 4000 });
      setKillDialogOpen(false);
      setReason("");
    } else {
      igrpToast({
        type: "error",
        title: t("toasts.killFailed"),
        duration: 4000,
      });
    }
  };

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">{t("title")}</h3>
      </div>

      <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
        <span className="text-muted-foreground">{t("fields.sessionId")}</span>
        <span className="font-mono">{session.sessionId.slice(0, 8)}…</span>

        <span className="text-muted-foreground">{t("fields.startedAt")}</span>
        <span>
          {session.startedAt
            ? formatDateTime(session.startedAt, DATE_TIME_WITH_SECONDS)
            : "—"}
        </span>

        <span className="text-muted-foreground">{t("fields.lastSeenAt")}</span>
        <span>
          {session.lastSeenAt
            ? formatDateTime(session.lastSeenAt, DATE_TIME_WITH_SECONDS)
            : "—"}
        </span>

        <span className="text-muted-foreground">{t("fields.ip")}</span>
        <span>{session.clientIp ?? "—"}</span>
      </div>

      <div className="flex justify-end">
        <IGRPButton
          size="sm"
          variant="destructive"
          onClick={() => setKillDialogOpen(true)}
        >
          {t("kill")}
        </IGRPButton>
      </div>

      <AlertDialog open={killDialogOpen} onOpenChange={setKillDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("killDialog.title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("killDialog.description")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex flex-col gap-2 py-2">
            <Label>{t("killDialog.reason")}</Label>
            <Input
              placeholder={t("killDialog.reasonPlaceholder")}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
          <AlertDialogFooter>
            <IGRPButton
              variant="outline"
              onClick={() => setKillDialogOpen(false)}
            >
              {tc("cancel")}
            </IGRPButton>
            <IGRPButton
              variant="destructive"
              disabled={!reason.trim() || killMutation.isPending}
              onClick={handleKill}
            >
              {t("killDialog.confirm")}
            </IGRPButton>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
