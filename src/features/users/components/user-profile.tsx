"use client";

import { useState } from "react";

import type { IGRPUserDTO } from "@igrp/platform-access-management-client-ts";

import { AppCenterLoading } from "@/components/loading";
import { AppCenterNotFound } from "@/components/not-found";
import { useFiles } from "@/features/files/use-files";
import { useUserProfileActions } from "@/features/users/hooks/use-user-profile-actions";
import { useCurrentUser } from "@/features/users/use-users";

import { UserProfileHeader } from "./user-profile-header";
import { UserProfileStatusButton } from "./user-profile-status-button";
import { UserProfileStatusDialog } from "./user-profile-status-dialog";
import { UserProfileTabs } from "./user-profile-tabs";

export function UserProfile() {
  const { data: user, isLoading, error } = useCurrentUser();
  if (error) throw error;
  if (isLoading)
    return <AppCenterLoading description="Carregando utilizador…" />;
  if (!user)
    return (
      <AppCenterNotFound
        iconName="User"
        title="Nenhum utilizador encontrado."
      />
    );
  return <UserProfileView user={user} />;
}

function UserProfileView({ user }: { user: IGRPUserDTO }) {
  const { data: currentUser } = useCurrentUser();
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const { data: avatarFile, isLoading: isLoadingAvatar } = useFiles(
    user.picture ?? "",
  );
  const { saveName, uploadAvatar, setStatus, isUploadingAvatar, isUpdating } =
    useUserProfileActions(user);
  const isActive = user.status === "ACTIVE";
  // You cannot change your own status from your own profile.
  const isSelf = currentUser?.id === user.id;

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <UserProfileHeader
        user={user}
        avatarUrl={avatarFile?.url ?? null}
        isResolvingAvatar={isLoadingAvatar}
        isUploadingAvatar={isUploadingAvatar}
        onUploadAvatar={uploadAvatar}
        onSaveName={saveName}
        actions={
          isSelf ? undefined : (
            <UserProfileStatusButton
              isActive={isActive}
              isPending={isUpdating}
              onToggleStatus={() => setShowStatusDialog(true)}
            />
          )
        }
      />
      <UserProfileTabs user={user} />
      {!isSelf ? (
        <UserProfileStatusDialog
          open={showStatusDialog}
          isActive={isActive}
          userName={user.name}
          onOpenChange={setShowStatusDialog}
          onConfirm={async (next) => {
            await setStatus(next);
            setShowStatusDialog(false);
          }}
        />
      ) : null}
    </div>
  );
}
