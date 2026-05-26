"use client";

import {
  Card,
  CardContent,
  cn,
  IGRPButton,
  IGRPIcon,
  IGRPInputText,
  IGRPUserAvatar,
  useIGRPToast,
} from "@igrp/igrp-framework-react-design-system";
import type { IGRPUserDTO } from "@igrp/platform-access-management-client-ts";
import { useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { useFiles } from "@/features/files/use-files";
import { useUpdateUser } from "@/features/users/use-users";
import { getInitials } from "@/lib/utils";
import { UserStatusToggle } from "./user-status-toggle";

interface UserDetailsHeaderProps {
  user: IGRPUserDTO;
}

export function UserDetailsHeader({ user }: UserDetailsHeaderProps) {
  const { mutateAsync: updateUser } = useUpdateUser();
  const { igrpToast } = useIGRPToast();
  const queryClient = useQueryClient();
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState("");

  const { data: avatarUrl, isLoading: isLoadingFile } = useFiles(
    user?.picture || "",
  );

  const currentAvatarUrl = avatarUrl?.url || null;

  const handleSaveName = async () => {
    if (!editedName.trim() || editedName === user.name) {
      setIsEditingName(false);
      return;
    }

    try {
      const res = await updateUser({
        id: user.id,
        user: {
          ...user,
          name: editedName.trim(),
        },
      });

      if (!res.success) {
        throw new Error(res.error);
      }

      await queryClient.invalidateQueries({
        queryKey: ["user"],
      });
      setIsEditingName(false);
      igrpToast({
        type: "success",
        title: "Nome atualizado com sucesso",
        duration: 4000,
      });
    } catch (err) {
      igrpToast({
        type: "error",
        title: "Erro ao atualizar nome",
        description: (err as Error).message,
        duration: 4000,
      });
    }
  };

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
              {isEditingName ? (
                <div className="flex items-center gap-2 mb-1">
                  <IGRPInputText
                    value={editedName}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setEditedName(e.target.value)
                    }
                    onKeyDown={(e: React.KeyboardEvent) => {
                      if (e.key === "Enter") handleSaveName();
                      if (e.key === "Escape") setIsEditingName(false);
                    }}
                    className="text-2xl font-bold tracking-tight h-10"
                    autoFocus
                  />
                  <IGRPButton
                    size="sm"
                    variant="ghost"
                    onClick={handleSaveName}
                  >
                    <IGRPIcon iconName="Check" className="w-4 h-4" />
                  </IGRPButton>
                  <IGRPButton
                    size="sm"
                    variant="ghost"
                    onClick={() => setIsEditingName(false)}
                  >
                    <IGRPIcon iconName="X" className="w-4 h-4" />
                  </IGRPButton>
                </div>
              ) : (
                <div className="flex items-center gap-2 mb-1 group">
                  <h1 className="text-2xl font-bold tracking-tight">
                    {user.name || "N/A"}
                  </h1>
                  <IGRPButton
                    size="sm"
                    variant="ghost"
                    className="opacity-100 transition-opacity"
                    onClick={() => {
                      setEditedName(user.name || "");
                      setIsEditingName(true);
                    }}
                  >
                    <IGRPIcon iconName="Pencil" className="w-4 h-4" />
                  </IGRPButton>
                </div>
              )}
              <p className="text-muted-foreground">{user.email}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
