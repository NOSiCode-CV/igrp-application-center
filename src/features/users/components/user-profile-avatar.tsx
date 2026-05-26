"use client";

import {
  cn,
  IGRPIcon,
  IGRPUserAvatar,
} from "@igrp/igrp-framework-react-design-system";
import type { IGRPUserDTO } from "@igrp/platform-access-management-client-ts";
import { useEffect, useRef, useState } from "react";
import { getInitials } from "@/lib/utils";

export interface UserProfileAvatarProps {
  user: IGRPUserDTO;
  resolvedUrl: string | null;
  isResolvingUrl: boolean;
  isUploading: boolean;
  onUpload: (file: File) => Promise<void>;
}

export function UserProfileAvatar({
  user,
  resolvedUrl,
  isResolvingUrl,
  isUploading,
  onUpload,
}: UserProfileAvatarProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [localPreview, setLocalPreview] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (localPreview) URL.revokeObjectURL(localPreview);
    };
  }, [localPreview]);

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const preview = URL.createObjectURL(file);
    setLocalPreview(preview);
    try {
      await onUpload(file);
    } catch {
      // Errors are surfaced via toast inside onUpload; swallow here so the
      // change handler does not produce an unhandled rejection.
    } finally {
      URL.revokeObjectURL(preview);
      setLocalPreview(null);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const currentUrl = localPreview ?? resolvedUrl;
  const spinning = isResolvingUrl || isUploading;

  return (
    <button
      type="button"
      aria-label="Alterar avatar"
      className="relative group cursor-pointer p-0 border-0 bg-transparent"
      onClick={() => inputRef.current?.click()}
    >
      <IGRPUserAvatar
        alt={user.name}
        image={currentUrl}
        fallbackContent={
          isResolvingUrl ? (
            <div className="flex items-center justify-center w-full h-full bg-muted/50 animate-pulse">
              <IGRPIcon
                iconName="LoaderCircle"
                className="w-8 h-8 text-muted-foreground animate-spin"
              />
            </div>
          ) : (
            getInitials(user.name || user.username || user.email || "")
          )
        }
        className="relative size-28 bg-background border-4 border-background shadow-lg transition-transform duration-300 group-hover:scale-105"
        fallbackClass="text-3xl"
      />

      <div className="absolute -bottom-1 -right-1 bg-background rounded-full p-2 shadow-md border border-border group-hover:border-primary transition-colors">
        <IGRPIcon
          iconName={spinning ? "LoaderCircle" : "Camera"}
          className={cn(
            "w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors",
            spinning && "animate-spin",
          )}
        />
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        aria-label="Alterar avatar"
        onChange={handleChange}
        className="hidden"
        disabled={isUploading}
      />
    </button>
  );
}
