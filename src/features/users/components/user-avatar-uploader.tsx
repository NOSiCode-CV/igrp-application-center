"use client";

import {
  cn,
  IGRPIcon,
  IGRPUserAvatar,
  useIGRPToast,
} from "@igrp/igrp-framework-react-design-system";
import type { IGRPUserDTO } from "@igrp/platform-access-management-client-ts";
import { useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { useFiles, useUploadPublicFiles } from "@/features/files/use-files";
import { useUpdateUser } from "@/features/users/use-users";
import { getInitials } from "@/lib/utils";

interface UserAvatarUploaderProps {
  user: IGRPUserDTO;
}

export function UserAvatarUploader({ user }: UserAvatarUploaderProps) {
  const { data: avatarUrl, isLoading: isLoadingFile } = useFiles(
    user?.picture || "",
  );
  const { mutateAsync: updateUser } = useUpdateUser();
  const uploadFile = useUploadPublicFiles();
  const queryClient = useQueryClient();
  const { igrpToast } = useIGRPToast();

  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setUploading] = useState(false);

  const currentAvatarUrl = avatarUrl?.url || null;

  const handlePick = () => inputRef.current?.click();

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    try {
      const uploadedPath = await uploadFile.mutateAsync({
        file,
        options: { folder: `users/${user.id}/avatar` },
      });
      if (!uploadedPath) throw new Error("Upload sem caminho");
      const res = await updateUser({
        id: user.id,
        user: { ...user, picture: uploadedPath },
      });
      if (!res.success) throw new Error(res.error);
      await queryClient.invalidateQueries({ queryKey: ["user", user.id] });
      igrpToast({ type: "success", title: "Foto atualizada", duration: 4000 });
    } catch (err) {
      igrpToast({
        type: "error",
        title: "Erro ao atualizar foto",
        description: (err as Error).message,
        duration: 4000,
      });
    } finally {
      setUploading(false);
    }
  };

  const busy = isLoadingFile || isUploading;

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFile}
      />
      <button
        type="button"
        className="relative group cursor-pointer p-0 border-0 bg-transparent"
        onClick={handlePick}
      >
        <div className="absolute -inset-1 rounded-full blur opacity-75 group-hover:opacity-100 transition" />
        <IGRPUserAvatar
          alt={user?.name}
          image={currentAvatarUrl}
          fallbackContent={
            busy ? (
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
            iconName={busy ? "LoaderCircle" : "Camera"}
            className={cn(
              "w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors",
              busy && "animate-spin",
            )}
          />
        </div>
      </button>
    </>
  );
}
