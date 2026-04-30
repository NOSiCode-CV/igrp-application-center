"use client";

import {
  Badge,
  IGRPButton,
  IGRPIcon,
} from "@igrp/igrp-framework-react-design-system";

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

export function InviteResponseStep({
  invitation,
  isSubmitting,
  onAccept,
  onReject,
}: InviteResponseStepProps) {
  const departments = toArray(invitation.department);
  const roles = invitation.roles ?? [];

  return (
    <div className="space-y-8 animate-in fade-in zoom-in duration-500">
      <div className="space-y-4 text-center">
        <div className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-muted text-muted-foreground shadow-xl">
          <IGRPIcon iconName="Mail" className="h-8 w-8" aria-hidden="true" />
        </div>
        <h2 className="text-2xl font-bold">Aceitar convite</h2>
      </div>

      <div className="space-y-6 rounded-2xl border bg-muted/40 p-6">
        <div className="flex items-start gap-4">
          <IGRPIcon
            iconName="Mail"
            className="mt-0.5 h-5 w-5 text-muted-foreground"
            aria-hidden="true"
          />
          <div className="space-y-1">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Email
            </p>
            <p className="font-medium">{invitation.email}</p>
          </div>
        </div>

        {departments.length > 0 ? (
          <>
            <div className="h-px w-full bg-border" />
            <div className="flex items-start gap-4">
              <IGRPIcon
                iconName="Building"
                className="mt-0.5 h-5 w-5 text-muted-foreground"
                aria-hidden="true"
              />
              <div className="space-y-3">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Departamento
                </p>
                <div className="flex flex-wrap gap-2">
                  {departments.map((dept) => (
                    <Badge
                      key={dept.code ?? dept.description}
                      variant="outline"
                    >
                      {dept.description || dept.code}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </>
        ) : null}

        {roles.length > 0 ? (
          <>
            <div className="h-px w-full bg-border" />
            <div className="flex items-start gap-4">
              <IGRPIcon
                iconName="Shield"
                className="mt-0.5 h-5 w-5 text-muted-foreground"
                aria-hidden="true"
              />
              <div className="space-y-3">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Perfis
                </p>
                <div className="flex flex-wrap gap-2">
                  {roles.map((role) => (
                    <Badge
                      key={role.code ?? role.description}
                      variant="outline"
                    >
                      {role.description || role.code}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </>
        ) : null}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <IGRPButton
          variant="destructive"
          onClick={onReject}
          disabled={isSubmitting}
          showIcon
          iconName="X"
          iconPlacement="start"
          className="h-14 rounded-xl"
        >
          Rejeitar
        </IGRPButton>
        <IGRPButton
          onClick={onAccept}
          disabled={isSubmitting}
          showIcon
          iconName="Check"
          iconPlacement="start"
          className="h-14 rounded-xl"
        >
          {isSubmitting ? "A processar..." : "Aceitar"}
        </IGRPButton>
      </div>
    </div>
  );
}
