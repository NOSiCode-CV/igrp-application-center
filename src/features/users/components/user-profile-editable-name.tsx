"use client";

import {
  IGRPButton,
  IGRPIcon,
  IGRPInputText,
} from "@igrp/igrp-framework-react-design-system";
import { useState } from "react";

export interface UserProfileEditableNameProps {
  name: string;
  fallback?: string;
  onSave: (next: string) => Promise<void>;
}

export function UserProfileEditableName({
  name,
  fallback,
  onSave,
}: UserProfileEditableNameProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(name);

  const startEditing = () => {
    setDraft(name);
    setEditing(true);
  };

  const commit = async () => {
    const next = draft.trim();
    if (!next || next === name) {
      setEditing(false);
      return;
    }
    await onSave(next);
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="flex items-center gap-2 mb-1">
        <IGRPInputText
          value={draft}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setDraft(e.target.value)
          }
          onKeyDown={(e: React.KeyboardEvent) => {
            if (e.key === "Enter") void commit();
            if (e.key === "Escape") setEditing(false);
          }}
          className="text-2xl font-bold tracking-tight h-10"
          autoFocus
        />
        <IGRPButton
          size="sm"
          variant="ghost"
          onClick={() => void commit()}
          aria-label="Guardar nome"
        >
          <IGRPIcon iconName="Check" className="w-4 h-4" />
        </IGRPButton>
        <IGRPButton
          size="sm"
          variant="ghost"
          onClick={() => setEditing(false)}
          aria-label="Cancelar edição"
        >
          <IGRPIcon iconName="X" className="w-4 h-4" />
        </IGRPButton>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 mb-1 group">
      <h1 className="text-2xl font-bold tracking-tight">
        {name || fallback || "N/A"}
      </h1>
      <IGRPButton
        size="sm"
        variant="ghost"
        onClick={startEditing}
        aria-label="Editar nome"
      >
        <IGRPIcon iconName="Pencil" className="w-4 h-4" />
      </IGRPButton>
    </div>
  );
}
