"use client";

import { notFound } from "next/navigation";

import { useUser } from "@/features/users/use-users";

import { UserDetailSkeleton } from "./user-detail-skeleton";
import { UserDetailsHeader } from "./user-details-header";
import { UserDetailsTabs } from "./user-details-tabs";

export function UserDetailView({ id }: { id: string }) {
  const { data: user, isLoading } = useUser(id);
  if (isLoading) return <UserDetailSkeleton />;
  if (!user) {
    notFound();
  }
  return (
    <div className="flex flex-col gap-6">
      <UserDetailsHeader user={user} />
      <UserDetailsTabs user={user} />
    </div>
  );
}
