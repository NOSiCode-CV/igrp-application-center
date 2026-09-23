"use client";

import { useEffect, useState } from "react";

import {
  IGRPButton,
  Input,
  Label,
  useIGRPToast,
} from "@igrp/igrp-framework-react-design-system";
import { nanoid } from "nanoid";
import { useTranslations } from "next-intl";

import { useUpdateUserMetadata, useUserMetadata } from "../use-users";

interface MetadataRow {
  id: string;
  key: string;
  value: string;
}

interface UserMetadataPanelProps {
  userId: string;
}

function metadataToRows(metadata?: Record<string, unknown>): MetadataRow[] {
  if (!metadata) return [];
  return Object.entries(metadata).map(([key, value]) => ({
    id: nanoid(),
    key,
    value: String(value),
  }));
}

export function UserMetadataPanel({ userId }: UserMetadataPanelProps) {
  const { data } = useUserMetadata(userId);
  const updateMutation = useUpdateUserMetadata();
  const { igrpToast } = useIGRPToast();
  const t = useTranslations("users.metadata");

  const [rows, setRows] = useState<MetadataRow[]>(() =>
    metadataToRows(data?.metadata),
  );

  useEffect(() => {
    if (data?.metadata) {
      setRows(metadataToRows(data.metadata));
    }
  }, [data]);

  const addRow = () =>
    setRows((prev) => [...prev, { id: nanoid(), key: "", value: "" }]);

  const removeRow = (id: string) =>
    setRows((prev) => prev.filter((row) => row.id !== id));

  const updateRow = (id: string, field: "key" | "value", val: string) =>
    setRows((prev) =>
      prev.map((row) => (row.id === id ? { ...row, [field]: val } : row)),
    );

  const handleSave = async () => {
    const metadata = Object.fromEntries(
      rows.filter((r) => r.key.trim()).map((r) => [r.key.trim(), r.value]),
    );
    const result = await updateMutation.mutateAsync({ id: userId, metadata });
    if (result.success) {
      igrpToast({ type: "success", title: t("toasts.updated") });
    } else {
      igrpToast({ type: "error", title: t("toasts.updateFailed") });
    }
  };

  return (
    <div className="flex flex-col gap-3 p-4">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium text-muted-foreground">
          {t("title")}
        </Label>
        <IGRPButton size="sm" variant="outline" onClick={addRow}>
          {t("addField")}
        </IGRPButton>
      </div>

      {rows.map((row) => (
        <div key={row.id} className="flex items-center gap-2">
          <Input
            placeholder={t("keyPlaceholder")}
            value={row.key}
            onChange={(e) => updateRow(row.id, "key", e.target.value)}
          />
          <Input
            placeholder={t("valuePlaceholder")}
            value={row.value}
            onChange={(e) => updateRow(row.id, "value", e.target.value)}
          />
          <IGRPButton
            size="sm"
            variant="ghost"
            aria-label={t("remove")}
            onClick={() => removeRow(row.id)}
          >
            ✕
          </IGRPButton>
        </div>
      ))}

      <div className="flex justify-end">
        <IGRPButton
          size="sm"
          onClick={handleSave}
          disabled={updateMutation.isPending}
        >
          {t("save")}
        </IGRPButton>
      </div>
    </div>
  );
}
