"use client";

import { useState } from "react";

import {
  IGRPButton,
  IGRPIcon,
  IGRPInputText,
} from "@igrp/igrp-framework-react-design-system";

export interface UserProfileEditableNameProps {
  name: string;
  fallback?: string;
  maxLength?: number;
  onSave: (next: string) => Promise<void>;
}

export function UserProfileEditableName({
  name,
  fallback,
  maxLength = 120,
  onSave,
}: UserProfileEditableNameProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(name);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startEditing = () => {
    setDraft(name);
    setError(null);
    setEditing(true);
  };

  const cancel = () => {
    if (saving) return;
    setError(null);
    setEditing(false);
  };

  const commit = async () => {
    if (saving) return;
    const next = draft.trim();
    if (!next || next === name.trim()) {
      setEditing(false);
      setError(null);
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await onSave(next);
      setEditing(false);
    } catch (err) {
      setError((err as Error).message || "Erro ao guardar");
      throw err;
    } finally {
      setSaving(false);
    }
  };

  if (editing) {
    return (
      <div className="flex flex-col gap-1 mb-1">
        <div className="flex items-center gap-2">
          <IGRPInputText
            value={draft}
            maxLength={maxLength}
            disabled={saving}
            aria-invalid={!!error}
            aria-describedby={error ? "user-profile-name-error" : undefined}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setDraft(e.target.value)
            }
            onKeyDown={(e: React.KeyboardEvent) => {
              if (e.key === "Enter") void commit().catch(() => {});
              if (e.key === "Escape") cancel();
            }}
            className="text-2xl font-bold tracking-tight h-12"
            autoFocus
          />
          <IGRPButton
            size="sm"
            variant="ghost"
            onClick={() => void commit().catch(() => {})}
            disabled={saving}
            aria-label="Guardar nome"
          >
            <IGRPIcon
              iconName={saving ? "LoaderCircle" : "Check"}
              className={saving ? "size-4 animate-spin" : "size-4"}
            />
          </IGRPButton>
          <IGRPButton
            size="sm"
            variant="ghost"
            onClick={cancel}
            disabled={saving}
            aria-label="Cancelar edição"
          >
            <IGRPIcon iconName="X" className="size-4" />
          </IGRPButton>
        </div>
        {error ? (
          <p
            id="user-profile-name-error"
            role="alert"
            aria-live="polite"
            className="text-sm text-destructive"
          >
            {error}
          </p>
        ) : null}
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
        <IGRPIcon iconName="Pencil" className="size-4" />
      </IGRPButton>
    </div>
  );
}
