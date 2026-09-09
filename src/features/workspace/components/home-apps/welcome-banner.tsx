"use client";

import { useEffect, useState } from "react";

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
    <div className="flex items-center">
      <span className="text-[10px] font-semibold uppercase">
        {label}
      </span>
      <div className="flex flex-wrap items-center gap-1.5">
        {visible.map((item) => {
          const isActive = activeCode !== undefined && item.code === activeCode;
          return (
            <span
              key={item.code}
              className={`rounded-full border px-2 py-0.5 text-xs ${
                isActive
                  ? "border-primary-subtle bg-primary-subtle text-primary-subtle-foreground"
                  : "border-border bg-muted text-secondary-foreground"
              }`}
              title={isActive ? "Active role" : undefined}
            >
              {item.name ?? item.code}
            </span>
          );
        })}
        {overflow > 0 && (
          <span className="px-1.5 py-0.5 text-xs font-medium text-muted-foreground">
            +{overflow} more
          </span>
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
  const { data: apps = [] } = useCurrentUserApplications();
  const { data: recent = [] } = useGetCurrentUserRecentApplications();

  const [greeting, setGreeting] = useState<string | null>(null);
  useEffect(() => {
    setGreeting(getGreeting());
  }, []);

  const name = firstName(user?.name);
  const recentCount = openedThisWeek(recent);

  return (
    <div className="rounded-xl border border-border bg-card p-5 flex flex-col lg:flex-row lg:items-center gap-5">
      <div className="flex-1 min-w-0 flex gap-4">
        <div className="relative shrink-0">
          <div className="size-13 rounded-full bg-primary-subtle flex items-center justify-center text-primary-subtle-foreground font-bold text-lg select-none">
            {(user?.name ?? "U").charAt(0).toUpperCase()}
          </div>
          <span className="absolute inset-0 size-3 rounded-full bg-success ring-2 ring-card" />
        </div>

        <div className="min-w-0 flex flex-col">
          <h1 className="font-semibold text-base tracking-tight text-foreground">
            {greeting ?? "Welcome"}
            {name ? `, ${name}` : ""}
          </h1>

          <div className="grid items-center">
            <BadgeList
              label="Roles:"
              items={roles}
              activeCode={activeRole?.roleCode}
            />
            <BadgeList 
              label="Departments:"
              items={departments} 
            />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-7 shrink-0 lg:border-l lg:border-border lg:pl-6">
        <div className="flex flex-col gap-1">
          <span className="text-2xl font-semibold leading-none tracking-tight text-foreground">
            {apps.length}
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-[0.09em] text-ring">
            Available to you
          </span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-2xl font-semibold leading-none tracking-tight text-primary">
            {recentCount}
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-[0.09em] text-ring">
            Opened this week
          </span>
        </div>
      </div>
    </div>
  );
}
