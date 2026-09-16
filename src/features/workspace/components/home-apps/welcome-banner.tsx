"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { Separator } from "@igrp/igrp-framework-react-design-system";
import { Check } from "lucide-react";

import {
  useCurrentUser,
  useCurrentUserActiveRole,
  useCurrentUserApplications,
  useCurrentUserDepartments,
  useGetCurrentUserRecentApplications,
  useGetCurrentUserRoles,
} from "@/features/users/use-users";

import { getGreeting } from "../../lib/task-utils";

const MAX_VISIBLE_BADGES = 3;

function firstName(full?: string): string {
  return full?.trim().split(/\s+/)[0] ?? "";
}

function openedThisWeek(
  apps: { lastAccess?: string | null }[],
  now = new Date(),
): number {
  const weekAgo = now.getTime() - 7 * 86_400_000;
  return apps.filter((a) => {
    if (!a.lastAccess) return false;
    const t = new Date(a.lastAccess).getTime();
    return !Number.isNaN(t) && t >= weekAgo;
  }).length;
}

function BadgeList({
  label,
  items,
  activeCode,
}: {
  label: string;
  items: { code: string; name?: string }[];
  activeCode?: string;
}) {
  if (items.length === 0) return null;

  const visible = items.slice(0, MAX_VISIBLE_BADGES);
  const overflow = items.length - visible.length;

  return (
    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
      <span className="shrink-0 text-[10px] font-semibold uppercase">
        {label}
      </span>
      <div className="flex min-w-0 flex-wrap items-center gap-1.5">
        {visible.map((item) => {
          const isActive = activeCode !== undefined && item.code === activeCode;
          return (
            <span
              key={item.code}
              className={`flex max-w-full items-center gap-1 rounded-full border px-2 py-0.5 text-xs ${
                isActive
                  ? "border-primary-subtle bg-primary-subtle text-primary-subtle-foreground"
                  : "border-border bg-muted text-secondary-foreground"
              }`}
            >
              {isActive && <Check size={11} className="shrink-0" />}
              <span className="truncate">{item.name ?? item.code}</span>
              {isActive && <span className="sr-only">(perfil ativo)</span>}
            </span>
          );
        })}
        {overflow > 0 && (
          /* Was a dead <span>: the hidden entries could not be seen anywhere
             on this surface. The profile page lists them in full. */
          <Link
            href="/profile"
            className="rounded-sm px-1.5 py-0.5 text-xs font-medium text-muted-foreground underline-offset-2 hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            +{overflow} mais
          </Link>
        )}
      </div>
    </div>
  );
}

export function WelcomeBanner() {
  const { data: user } = useCurrentUser();
  const { data: activeRole } = useCurrentUserActiveRole();
  const { data: roles = [] } = useGetCurrentUserRoles();
  const { data: departments = [] } = useCurrentUserDepartments();
  const { data: apps = [], isError: appsFailed } = useCurrentUserApplications();
  const { data: recent = [], isError: recentFailed } =
    useGetCurrentUserRecentApplications();

  const [greeting, setGreeting] = useState<string | null>(null);
  useEffect(() => {
    setGreeting(getGreeting());
  }, []);

  const name = firstName(user?.name);
  const recentCount = openedThisWeek(recent);

  /* A failed request and a genuine zero are not the same fact. Printing "0"
     for a request that never came back states something false about the
     user's access; an em dash says "unknown" without raising an alarm, since
     the catalogue below already carries the error and the retry. */
  const appsCount = appsFailed ? "—" : apps.length;
  const weekCount = recentFailed ? "—" : recentCount;

  return (
    <div className="rounded-xl border border-border bg-card p-5 flex flex-col lg:flex-row lg:items-center gap-5">
      <div className="flex-1 min-w-0 flex gap-4">
        {/* `self-start` keeps the avatar level with the greeting instead of
            stretching down the badge column. */}
        <div className="shrink-0 self-start">
          <div className="size-13 rounded-full bg-primary-subtle flex items-center justify-center text-primary-subtle-foreground font-bold text-lg select-none">
            {(user?.name ?? "U").charAt(0).toUpperCase()}
          </div>
        </div>

        <div className="min-w-0 flex flex-col">
          {/* Not an <h1>: a greeting is not what this page is. The heading
              lives in HomeAppsTab so screen readers announce "Aplicações". */}
          <p className="font-semibold text-base tracking-tight text-foreground">
            {greeting ?? "Bem-vindo"}
            {name ? `, ${name}` : ""}
          </p>

          <div className="mt-1 flex flex-col gap-1.5">
            <BadgeList
              label="Perfis:"
              items={roles}
              activeCode={activeRole?.roleCode}
            />
            <BadgeList label="Departamentos:" items={departments} />
          </div>
        </div>
      </div>

      <Separator className="shrink-0 lg:hidden" />

      <div className="flex shrink-0 flex-wrap items-center gap-x-10 gap-y-4 lg:gap-x-7 lg:border-l lg:border-border lg:pl-6">
        <div className="flex flex-col gap-1">
          <span className="text-base font-semibold leading-none tracking-tight text-foreground">
            {appsCount}
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-[0.09em] text-muted-foreground">
            Disponíveis para si
          </span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-base font-semibold leading-none tracking-tight text-primary">
            {weekCount}
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-[0.09em] text-muted-foreground">
            Abertas esta semana
          </span>
        </div>
      </div>
    </div>
  );
}
