"use client";

import type { IGRPUserDTO } from "@igrp/platform-access-management-client-ts";
import { useState } from "react";
import { AppCenterLoading } from "@/components/loading";
import { AppCenterNotFound } from "@/components/not-found";
import { useFiles } from "@/features/files/use-files";
import { useUserProfileActions } from "@/features/users/hooks/use-user-profile-actions";
import { useCurrentUser } from "@/features/users/use-users";
import { UserProfileActionsMenu } from "./user-profile-actions-menu";
import { UserProfileHeader } from "./user-profile-header";
import { UserProfileStatusDialog } from "./user-profile-status-dialog";
import { UserProfileTabs } from "./user-profile-tabs";

export function UserProfile() {
  const { data: user, isLoading, error } = useCurrentUser();
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
  return <UserProfileView user={user} />;
}

function UserProfileView({ user }: { user: IGRPUserDTO }) {
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const { data: avatarFile, isLoading: isLoadingAvatar } = useFiles(
    user.picture ?? "",
  );
  const { saveName, uploadAvatar, setStatus, isUploadingAvatar, isUpdating } =
    useUserProfileActions(user);
  const isActive = user.status === "ACTIVE";

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
          <UserProfileActionsMenu
            isActive={isActive}
            isPending={isUpdating}
            onToggleStatus={() => setShowStatusDialog(true)}
          />
        }
      />
      <UserProfileTabs user={user} />
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
