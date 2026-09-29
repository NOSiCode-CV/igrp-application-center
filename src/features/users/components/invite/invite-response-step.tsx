"use client";

import { useState } from "react";

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Badge,
  Button,
  IGRPIcon,
  type IGRPIconProps,
  Separator,
} from "@igrp/igrp-framework-react-design-system";
import { useTranslations } from "next-intl";

import { InviteStepHeader } from "./invite-step-header";

interface CodeDescriptionLike {
  code?: string;
  description?: string;
}

export interface InvitationLike {
  email: string;
  department?: CodeDescriptionLike[] | CodeDescriptionLike | null;
  roles?: CodeDescriptionLike[] | null;
}

interface InviteResponseStepProps {
  invitation: InvitationLike;
  isSubmitting: boolean;
  onAccept: () => void;
  onReject: () => void;
}

function toArray(
  value: CodeDescriptionLike[] | CodeDescriptionLike | null | undefined,
): CodeDescriptionLike[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

export function toInvitationLike(dto: unknown): InvitationLike {
  const record = (dto ?? {}) as Record<string, unknown>;
  return {
    email: typeof record.email === "string" ? record.email : "",
    department: record.department as InvitationLike["department"],
    roles: record.roles as InvitationLike["roles"],
  };
}

export function InviteResponseStep({
  invitation,
  isSubmitting,
  onAccept,
  onReject,
}: InviteResponseStepProps) {
  const t = useTranslations("users.invite.accept.responseStep");
  const tc = useTranslations("common.actions");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const departments = toArray(invitation.department);
  const roles = invitation.roles ?? [];

  return (
    <>
      <div className="flex flex-col gap-8">
        <InviteStepHeader
          icon="Mail"
          eyebrow={t("eyebrow")}
          title={t("title")}
          description={t("description")}
        />

        <dl className="flex flex-col gap-5 rounded-2xl border border-border/60 bg-muted/30 p-5">
          <InvitationRow icon="Mail" label={t("email")}>
            <span className="font-medium text-foreground">
              {invitation.email}
            </span>
          </InvitationRow>

          {departments.length > 0 ? (
            <>
              <Separator />
              <InvitationRow icon="Building2" label={t("department")}>
                <div className="flex flex-wrap gap-1.5">
                  {departments.map((dept) => (
                    <Badge
                      key={dept.code ?? dept.description}
                      variant="secondary"
                    >
                      {dept.description || dept.code}
                    </Badge>
                  ))}
                </div>
              </InvitationRow>
            </>
          ) : null}

          {roles.length > 0 ? (
            <>
              <Separator />
              <InvitationRow icon="Shield" label={t("roles")}>
                <div className="flex flex-wrap gap-1.5">
                  {roles.map((role) => (
                    <Badge
                      key={role.code ?? role.description}
                      variant="secondary"
                    >
                      {role.description || role.code}
                    </Badge>
                  ))}
                </div>
              </InvitationRow>
            </>
          ) : null}
        </dl>

        <div className="flex flex-col gap-3">
          <Button
            size="lg"
            className="w-full"
            onClick={onAccept}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <IGRPIcon
                iconName="LoaderCircle"
                data-icon="inline-start"
                className="animate-spin"
              />
            ) : (
              <IGRPIcon iconName="Check" data-icon="inline-start" />
            )}
            {isSubmitting ? t("processing") : t("accept")}
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="w-full"
            onClick={() => setConfirmOpen(true)}
            disabled={isSubmitting}
          >
            <IGRPIcon iconName="X" data-icon="inline-start" />
            {t("reject")}
          </Button>
        </div>
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("rejectConfirm.title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("rejectConfirm.description")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmOpen(false)}
              disabled={isSubmitting}
            >
              {tc("cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                setConfirmOpen(false);
                onReject();
              }}
              disabled={isSubmitting}
            >
              {t("rejectConfirm.confirm")}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function InvitationRow({
  icon,
  label,
  children,
}: {
  icon: IGRPIconProps["iconName"];
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <IGRPIcon
        iconName={icon}
        aria-hidden="true"
        className="mt-0.5 size-4 shrink-0 text-muted-foreground"
        strokeWidth={1.75}
      />
      <div className="flex min-w-0 flex-col gap-1.5">
        <dt className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
          {label}
        </dt>
        <dd className="text-sm">{children}</dd>
      </div>
    </div>
  );
}
