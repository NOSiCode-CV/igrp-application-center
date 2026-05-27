"use client";

import { Card, CardContent } from "@igrp/igrp-framework-react-design-system";
import type { IGRPUserDTO } from "@igrp/platform-access-management-client-ts";
import { UserProfileAvatar } from "./user-profile-avatar";
import { UserProfileEditableName } from "./user-profile-editable-name";

export interface UserProfileHeaderProps {
  user: IGRPUserDTO;
  avatarUrl: string | null;
  isResolvingAvatar: boolean;
  isUploadingAvatar: boolean;
  onUploadAvatar: (file: File) => Promise<void>;
  onSaveName: (next: string) => Promise<void>;
  actions?: React.ReactNode;
}

export function UserProfileHeader(props: UserProfileHeaderProps) {
  const {
    user,
    avatarUrl,
    isResolvingAvatar,
    isUploadingAvatar,
    onUploadAvatar,
    onSaveName,
    actions,
  } = props;

  return (
    <Card className="py-2 border-0 shadow-sm">
      <CardContent className="px-4 py-1">
        <div className="flex items-center gap-6">
          <UserProfileAvatar
            user={user}
            resolvedUrl={avatarUrl}
            isResolvingUrl={isResolvingAvatar}
            isUploading={isUploadingAvatar}
            onUpload={onUploadAvatar}
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <UserProfileEditableName
                name={user.name || user.username || ""}
                fallback="N/A"
                onSave={onSaveName}
              />
              {actions ? <div className="ml-auto">{actions}</div> : null}
            </div>
            <p className="text-muted-foreground">{user.email}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
