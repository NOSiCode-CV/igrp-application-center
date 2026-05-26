"use client";

import type { IGRPUserDTO } from "@igrp/platform-access-management-client-ts";
import { useState } from "react";
import { AppCenterLoading } from "@/components/loading";
import { AppCenterNotFound } from "@/components/not-found";
import { useFiles } from "@/features/files/use-files";
import { useUserProfileActions } from "@/features/users/hooks/use-user-profile-actions";
import { useCurrentUser } from "@/features/users/use-users";
import { UserProfileHeader } from "./user-profile-header";
import { UserProfileStatusDialog } from "./user-profile-status-dialog";
import { UserProfileTabs } from "./user-profile-tabs";

export function UserProfile() {
  const { data: user, isLoading, error, refetch } = useCurrentUser();
  if (error) throw error;
  if (isLoading)
    return <AppCenterLoading description="Carregando utilizador..." />;
  if (!user)
    return (
      <AppCenterNotFound
        iconName="User"
        title="Nenhum utilizador encontrado."
      />
    );
  return <UserProfileView user={user} onUserChange={refetch} />;
}

function UserProfileView({
  user,
  onUserChange,
}: {
  user: IGRPUserDTO;
  onUserChange: () => Promise<unknown> | undefined;
}) {
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const { data: avatarFile, isLoading: isLoadingAvatar } = useFiles(
    user.picture ?? "",
  );
  const { saveName, uploadAvatar, setStatus, isUploadingAvatar } =
    useUserProfileActions(user);
  const isActive = user.status === "ACTIVE";

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <UserProfileHeader
        user={user}
        isActive={isActive}
        avatarUrl={avatarFile?.url ?? null}
        isResolvingAvatar={isLoadingAvatar}
        isUploadingAvatar={isUploadingAvatar}
        onToggleStatus={() => setShowStatusDialog(true)}
        onUploadAvatar={uploadAvatar}
        onSaveName={saveName}
      />
      <UserProfileTabs user={user} onUserChange={onUserChange} />
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
    </div>
  );
}
