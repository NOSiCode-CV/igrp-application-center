"use client";

import {
  Badge,
  Button,
  Separator,
} from "@igrp/igrp-framework-react-design-system";
import { Building2, Check, Loader2, Mail, Shield, X } from "lucide-react";

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

// The SDK's `getUserInvitationByToken` returns `InvitationDTO`, but its runtime
// shape (department-as-array, embedded roles) doesn't match the declared types.
export function toInvitationLike(dto: unknown): InvitationLike {
  return dto as InvitationLike;
}

export function InviteResponseStep({
  invitation,
  isSubmitting,
  onAccept,
  onReject,
}: InviteResponseStepProps) {
  const departments = toArray(invitation.department);
  const roles = invitation.roles ?? [];

  return (
    <div className="flex flex-col gap-8">
      <InviteStepHeader
        icon={Mail}
        eyebrow="Convite"
        title="Aceitar acesso"
        description="Revise os detalhes antes de confirmar."
      />

      <dl className="flex flex-col gap-5 rounded-2xl border border-border/60 bg-muted/30 p-5">
        <InvitationRow icon={Mail} label="Email">
          <span className="font-medium text-foreground">
            {invitation.email}
          </span>
        </InvitationRow>

        {departments.length > 0 ? (
          <>
            <Separator />
            <InvitationRow icon={Building2} label="Departamento">
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
            <InvitationRow icon={Shield} label="Perfis">
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

      <div className="grid grid-cols-2 gap-3">
        <Button
          variant="outline"
          size="lg"
          onClick={onReject}
          disabled={isSubmitting}
        >
          <X data-icon="inline-start" />
          Rejeitar
        </Button>
        <Button size="lg" onClick={onAccept} disabled={isSubmitting}>
          {isSubmitting ? (
            <Loader2 data-icon="inline-start" className="animate-spin" />
          ) : (
            <Check data-icon="inline-start" />
          )}
          {isSubmitting ? "A processar..." : "Aceitar"}
        </Button>
      </div>
    </div>
  );
}

function InvitationRow({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof Mail;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon
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
