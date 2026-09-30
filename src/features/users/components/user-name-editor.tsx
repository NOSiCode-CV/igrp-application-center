"use client";

import { useState } from "react";

import {
  IGRPButton,
  IGRPIcon,
  IGRPInputText,
  useIGRPToast,
} from "@igrp/igrp-framework-react-design-system";
import type { IGRPUserDTO } from "@igrp/platform-access-management-client-ts";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";

import { userKeys } from "@/features/users/query-keys";
import { useUpdateUser } from "@/features/users/use-users";

interface UserNameEditorProps {
  user: IGRPUserDTO;
}

export function UserNameEditor({ user }: UserNameEditorProps) {
  const { mutateAsync: updateUser } = useUpdateUser();
  const { igrpToast } = useIGRPToast();
  const t = useTranslations("users");
  const queryClient = useQueryClient();

  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState("");

  const open = () => {
    setValue(user.name || "");
    setEditing(true);
  };

  const save = async () => {
    const trimmed = value.trim();
    if (!trimmed || trimmed === user.name) {
      setEditing(false);
      return;
    }
    try {
      const res = await updateUser({
        id: user.id,
        user: { ...user, name: trimmed },
      });
      if (!res.success) throw new Error(res.error);
      await queryClient.invalidateQueries({
        queryKey: userKeys.detail(user.id),
      });
      await queryClient.invalidateQueries({ queryKey: userKeys.all });
      setEditing(false);
      igrpToast({
        type: "success",
        title: t("nameEditor.toasts.updated"),
        duration: 6000,
      });
    } catch (err) {
      igrpToast({
        type: "error",
        title: t("nameEditor.toasts.updateFailed"),
        description: (err as Error).message,
        duration: 6000,
      });
    }
  };

  if (editing) {
    return (
      <div className="flex items-center gap-2 mb-1">
        <IGRPInputText
          value={value}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setValue(e.target.value)
          }
          onKeyDown={(e: React.KeyboardEvent) => {
            if (e.key === "Enter") save();
            if (e.key === "Escape") setEditing(false);
          }}
          className="text-2xl font-bold tracking-tight h-10"
          autoFocus
        />
        <IGRPButton
          size="sm"
          variant="ghost"
          onClick={save}
          aria-label={t("nameEditor.save")}
        >
          <IGRPIcon iconName="Check" className="size-4" />
        </IGRPButton>
        <IGRPButton
          size="sm"
          variant="ghost"
          onClick={() => setEditing(false)}
          aria-label={t("nameEditor.cancel")}
        >
          <IGRPIcon iconName="X" className="size-4" />
        </IGRPButton>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 mb-1 group">
      <h1 className="text-2xl font-bold tracking-tight">
        {user.name || t("notAvailable")}
      </h1>
      <IGRPButton
        size="sm"
        variant="ghost"
        className="opacity-100 transition-opacity"
        onClick={open}
        aria-label={t("nameEditor.edit")}
      >
        <IGRPIcon iconName="Pencil" className="size-4" />
      </IGRPButton>
    </div>
  );
}
