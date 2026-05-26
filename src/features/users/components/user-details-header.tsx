"use client";

import {
  Card,
  CardContent,
  cn,
  IGRPIcon,
  IGRPUserAvatar,
} from "@igrp/igrp-framework-react-design-system";
import type { IGRPUserDTO } from "@igrp/platform-access-management-client-ts";
import { useRef } from "react";
import { useFiles } from "@/features/files/use-files";
import { getInitials } from "@/lib/utils";
import { UserNameEditor } from "./user-name-editor";
import { UserStatusToggle } from "./user-status-toggle";

interface UserDetailsHeaderProps {
  user: IGRPUserDTO;
}

export function UserDetailsHeader({ user }: UserDetailsHeaderProps) {
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const { data: avatarUrl, isLoading: isLoadingFile } = useFiles(
    user?.picture || "",
  );

  const currentAvatarUrl = avatarUrl?.url || null;

  return (
    <div className="relative">
      <div className="absolute inset-0 rounded-xl -z-10" />

      <Card className="py-2 border-0 shadow-sm">
        <CardContent className="px-4 py-1">
          <div className="flex items-center mb-2 justify-end">
            <UserStatusToggle user={user} />
          </div>
          <div className="flex items-center gap-6">
            <button
              type="button"
              className="relative group cursor-pointer p-0 border-0 bg-transparent"
              onClick={() => avatarInputRef.current?.click()}
            >
              <div className="absolute -inset-1 rounded-full blur opacity-75 group-hover:opacity-100 transition" />

              <IGRPUserAvatar
                alt={user?.name}
                image={currentAvatarUrl}
                fallbackContent={
                  isLoadingFile ? (
                    <div className="flex items-center justify-center w-full h-full bg-muted/50 animate-pulse">
                      <IGRPIcon
                        iconName="LoaderCircle"
                        className="w-8 h-8 text-muted-foreground animate-spin"
                      />
                    </div>
                  ) : (
                    getInitials(user?.name || user?.email || "")
                  )
                }
                className="relative size-28 bg-background border-4 border-background shadow-lg transition-transform duration-300 group-hover:scale-105"
                fallbackClass="text-3xl"
              />

              <div className="absolute -bottom-1 -right-1 bg-background rounded-full p-2 shadow-md border border-border group-hover:border-primary transition-colors">
                <IGRPIcon
                  iconName={isLoadingFile ? "LoaderCircle" : "Camera"}
                  className={cn(
                    "w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors",
                  )}
                />
              </div>
            </button>

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
