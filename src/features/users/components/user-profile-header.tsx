"use client";

import {
  Card,
  CardContent,
  IGRPButton,
} from "@igrp/igrp-framework-react-design-system";
import type { IGRPUserDTO } from "@igrp/platform-access-management-client-ts";
import { UserProfileAvatar } from "./user-profile-avatar";
import { UserProfileEditableName } from "./user-profile-editable-name";

export interface UserProfileHeaderProps {
  user: IGRPUserDTO;
  isActive: boolean;
  avatarUrl: string | null;
  isResolvingAvatar: boolean;
  isUploadingAvatar: boolean;
  onToggleStatus: () => void;
  onUploadAvatar: (file: File) => Promise<void>;
  onSaveName: (next: string) => Promise<void>;
}

export function UserProfileHeader(props: UserProfileHeaderProps) {
  const {
    user,
    isActive,
    avatarUrl,
    isResolvingAvatar,
    isUploadingAvatar,
    onToggleStatus,
    onUploadAvatar,
    onSaveName,
  } = props;

  return (
    <Card className="py-2 border-0 shadow-sm">
      <CardContent className="px-4 py-1">
        <div className="flex items-center mb-2 justify-end gap-2">
          <IGRPButton
            showIcon
            variant={isActive ? "destructive" : "default"}
            iconName={isActive ? "Ban" : "Check"}
            size="sm"
            className="cursor-pointer"
            onClick={onToggleStatus}
          >
            {isActive ? "Desativar" : "Ativar"}
          </IGRPButton>
        </div>
        <div className="flex items-center gap-6">
          <UserProfileAvatar
            user={user}
            resolvedUrl={avatarUrl}
            isResolvingUrl={isResolvingAvatar}
            isUploading={isUploadingAvatar}
            onUpload={onUploadAvatar}
          />
          <div className="flex-1">
            <UserProfileEditableName
              name={user.name || user.username || ""}
              fallback="N/A"
              onSave={onSaveName}
            />
            <p className="text-muted-foreground">{user.email}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
