"use client";

import { Card, CardContent } from "@igrp/igrp-framework-react-design-system";
import type { IGRPUserDTO } from "@igrp/platform-access-management-client-ts";
import { UserAvatarUploader } from "./user-avatar-uploader";
import { UserNameEditor } from "./user-name-editor";
import { UserStatusToggle } from "./user-status-toggle";

interface UserDetailsHeaderProps {
  user: IGRPUserDTO;
}

export function UserDetailsHeader({ user }: UserDetailsHeaderProps) {
  return (
    <div className="relative">
      <div className="absolute inset-0 rounded-xl -z-10" />
      <Card className="py-2 border-0 shadow-sm">
        <CardContent className="px-4 py-1">
          <div className="flex items-center mb-2 justify-end">
            <UserStatusToggle user={user} />
          </div>
          <div className="flex items-center gap-6">
            <UserAvatarUploader user={user} />
            <div className="flex-1">
              <UserNameEditor user={user} />
              <p className="text-muted-foreground">{user.email}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
