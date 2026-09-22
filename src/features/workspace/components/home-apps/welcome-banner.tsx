"use client";

import { useEffect, useState } from "react";

import { Badge } from "@igrp/igrp-framework-react-design-system";

import {
  useCurrentUser,
  useCurrentUserActiveRole,
  useCurrentUserDepartments,
  useGetCurrentUserRoles,
} from "@/features/users/use-users";

import { getGreeting } from "../../lib/task-utils";

function firstName(full?: string): string {
  return full?.trim().split(/\s+/)[0] ?? "";
}

type ContextPart = { label: string; value: string; className: string };

function ContextLine({ parts }: { parts: ContextPart[] }) {
  if (parts.length === 0) return null;

  return (
    <div className="mt-1.5 flex min-w-0 flex-wrap items-center gap-1.5">
      {parts.map((part) => (
        <Badge key={part.label} className={`max-w-full ${part.className}`}>
          <span className="sr-only">{part.label}: </span>
          <span className="truncate">{part.value}</span>
        </Badge>
      ))}
    </div>
  );
}

export function WelcomeBanner() {
  const { data: user } = useCurrentUser();
  const { data: activeRole } = useCurrentUserActiveRole();
  const { data: roles = [] } = useGetCurrentUserRoles();
  const { data: departments = [] } = useCurrentUserDepartments();

  const [greeting, setGreeting] = useState<string | null>(null);
  useEffect(() => {
    setGreeting(getGreeting());
  }, []);

  const name = firstName(user?.name);

  const contextParts = [
    {
      label: "Departamento",
      value:
        departments.find((d) => d.code === activeRole?.departmentCode)?.name ??
        activeRole?.departmentCode,
      className: "border-border bg-muted text-secondary-foreground",
    },
    {
      label: "Perfil ativo",
      value:
        roles.find((r) => r.code === activeRole?.roleCode)?.name ??
        activeRole?.roleCode,
      className:
        "border-primary-subtle bg-primary-subtle text-primary-subtle-foreground",
    },
  ].filter((part): part is ContextPart => Boolean(part.value));

  return (
    <div className="rounded-xl border border-border bg-card p-4 flex min-w-0 gap-4">
      <div className="shrink-0 self-start">
        <div className="size-13 rounded-full bg-primary-subtle flex items-center justify-center text-primary-subtle-foreground font-bold text-lg select-none">
          {(user?.name ?? "U").charAt(0).toUpperCase()}
        </div>
      </div>

      <div className="min-w-0 flex flex-col">
        <p className="font-semibold text-base tracking-tight text-foreground">
          {greeting ?? "Bem-vindo"}
          {name ? `, ${name}` : ""}
        </p>

        <ContextLine parts={contextParts} />
      </div>
    </div>
  );
}
