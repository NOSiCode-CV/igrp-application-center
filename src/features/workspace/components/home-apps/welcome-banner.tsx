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

/** Roles/departments beyond this collapse into a "+N more" chip, so the banner
 *  keeps a fixed height however many a user accumulates. */
const MAX_VISIBLE_BADGES = 3;

function firstName(full?: string): string {
  return full?.trim().split(/\s+/)[0] ?? "";
}

/** Counts apps whose `lastAccess` falls inside the last 7 days. */
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
  uppercase = false,
}: {
  label: string;
  items: { code: string; name?: string }[];
  activeCode?: string;
  uppercase?: boolean;
}) {
  if (items.length === 0) return null;

  const visible = items.slice(0, MAX_VISIBLE_BADGES);
  const overflow = items.length - visible.length;

  return (
    <>
      <span className="text-[10.5px] font-semibold uppercase tracking-[0.09em] text-ring">
        {label}
      </span>
      <div className="flex flex-wrap items-center gap-1.5">
        {visible.map((item) => {
          const isActive = activeCode !== undefined && item.code === activeCode;
          return (
            <span
              key={item.code}
              className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                uppercase ? "uppercase tracking-wide" : ""
              } ${
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
    </>
  );
}

export function WelcomeBanner() {
  const { data: user } = useCurrentUser();
  const { data: activeRole } = useCurrentUserActiveRole();
  const { data: roles = [] } = useGetCurrentUserRoles();
  const { data: departments = [] } = useCurrentUserDepartments();
  const { data: apps = [] } = useCurrentUserApplications();
  const { data: recent = [] } = useGetCurrentUserRecentApplications();

  // Resolved after mount so the server and client never disagree on the hour.
  const [greeting, setGreeting] = useState<string | null>(null);
  useEffect(() => {
    setGreeting(getGreeting());
  }, []);

  const name = firstName(user?.name);
  const recentCount = openedThisWeek(recent);

  return (
    <div className="rounded-xl border border-border bg-card p-5 flex flex-col lg:flex-row lg:items-center gap-5">
      <div className="flex-1 min-w-0 flex items-center gap-4">
        <div className="relative shrink-0">
          <div className="size-13 rounded-full bg-primary-subtle flex items-center justify-center text-primary-subtle-foreground font-bold text-lg select-none">
            {(user?.name ?? "U").charAt(0).toUpperCase()}
          </div>
          <span className="absolute bottom-px right-px size-3 rounded-full bg-success ring-2 ring-card" />
        </div>

        <div className="min-w-0 flex flex-col gap-2">
          <h1 className="font-semibold text-[22px] tracking-tight text-foreground">
            {/* No dangling comma before the name resolves. */}
            {greeting ?? "Welcome"}
            {name ? `, ${name}` : ""}
          </h1>

          <div className="grid grid-cols-[auto_1fr] items-center gap-x-3 gap-y-1.5">
            <BadgeList
              label="Roles:"
              items={roles}
              activeCode={activeRole?.roleCode}
              uppercase
            />
            <BadgeList label="Departments:" items={departments} />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-7 shrink-0 lg:border-l lg:border-border lg:pl-6">
        <div className="flex flex-col gap-1">
          <span className="text-2xl font-semibold leading-none tracking-tight text-foreground">
            {apps.length}
          </span>
          <span className="text-[10.5px] font-semibold uppercase tracking-[0.09em] text-ring">
            Available to you
          </span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-2xl font-semibold leading-none tracking-tight text-primary">
            {recentCount}
          </span>
          <span className="text-[10.5px] font-semibold uppercase tracking-[0.09em] text-ring">
            Opened this week
          </span>
        </div>
      </div>
    </div>
  );
}
