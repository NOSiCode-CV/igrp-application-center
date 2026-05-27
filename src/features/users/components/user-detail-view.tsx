"use client";

import { notFound } from "next/navigation";
import { useUser } from "@/features/users/use-users";
import { UserDetailsHeader } from "./user-details-header";
import { UserDetailsTabs } from "./user-details-tabs";

export function UserDetailView({ id }: { id: string }) {
  const { data: user, isLoading } = useUser(id);
  if (isLoading) return null; // route loading.tsx / hydrated cache covers first paint
  if (!user) {
    notFound();
  }
  return (
    <div className="flex flex-col gap-6 p-6">
      <UserDetailsHeader user={user} />
      <UserDetailsTabs user={user} />
    </div>
  );
}
