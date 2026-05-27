"use client";

import {
  IGRPButton,
  IGRPIcon,
  IGRPInputText,
  useIGRPToast,
} from "@igrp/igrp-framework-react-design-system";
import type { IGRPUserDTO } from "@igrp/platform-access-management-client-ts";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useUpdateUser } from "@/features/users/use-users";

interface UserNameEditorProps {
  user: IGRPUserDTO;
}

export function UserNameEditor({ user }: UserNameEditorProps) {
  const { mutateAsync: updateUser } = useUpdateUser();
  const { igrpToast } = useIGRPToast();
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
      await queryClient.invalidateQueries({ queryKey: ["user", user.id] });
      await queryClient.invalidateQueries({ queryKey: ["users"] });
      setEditing(false);
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
          aria-label="Guardar nome"
        >
          <IGRPIcon iconName="Check" className="size-4" />
        </IGRPButton>
        <IGRPButton
          size="sm"
          variant="ghost"
          onClick={() => setEditing(false)}
          aria-label="Cancelar edição"
        >
          <IGRPIcon iconName="X" className="size-4" />
        </IGRPButton>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 mb-1 group">
      <h1 className="text-2xl font-bold tracking-tight">
        {user.name || "N/A"}
      </h1>
      <IGRPButton
        size="sm"
        variant="ghost"
        className="opacity-100 transition-opacity"
        onClick={open}
        aria-label="Editar nome"
      >
        <IGRPIcon iconName="Pencil" className="size-4" />
      </IGRPButton>
    </div>
  );
}
