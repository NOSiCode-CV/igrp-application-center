"use client";

import {
  IGRPButton,
  Input,
  Label,
  useIGRPToast,
} from "@igrp/igrp-framework-react-design-system";
import { useEffect, useState } from "react";
import { useUpdateUserMetadata, useUserMetadata } from "../use-users";

interface MetadataRow {
  key: string;
  value: string;
}

interface UserMetadataPanelProps {
  userId: number;
}

function metadataToRows(metadata?: Record<string, unknown>): MetadataRow[] {
  if (!metadata) return [];
  return Object.entries(metadata).map(([key, value]) => ({
    key,
    value: String(value),
  }));
}

export function UserMetadataPanel({ userId }: UserMetadataPanelProps) {
  const { data } = useUserMetadata(userId);
  const updateMutation = useUpdateUserMetadata();
  const { igrpToast } = useIGRPToast();

  const [rows, setRows] = useState<MetadataRow[]>(() =>
    metadataToRows(data?.metadata),
  );

  useEffect(() => {
    if (data?.metadata) {
      setRows(metadataToRows(data.metadata));
    }
  }, [data]);

  const addRow = () => setRows((prev) => [...prev, { key: "", value: "" }]);

  const removeRow = (index: number) =>
    setRows((prev) => prev.filter((_, i) => i !== index));

  const updateRow = (index: number, field: "key" | "value", val: string) =>
    setRows((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [field]: val } : row)),
    );

  const handleSave = async () => {
    const metadata = Object.fromEntries(
      rows.filter((r) => r.key.trim()).map((r) => [r.key.trim(), r.value]),
    );
    const result = await updateMutation.mutateAsync({ id: userId, metadata });
    if (result.success) {
      igrpToast({ type: "success", title: "Metadados atualizados" });
    } else {
      igrpToast({ type: "error", title: "Erro ao atualizar metadados" });
    }
  };

  return (
    <div className="flex flex-col gap-3 p-4">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium text-muted-foreground">
          Metadados
        </Label>
        <IGRPButton size="sm" variant="outline" onClick={addRow}>
          + Add field
        </IGRPButton>
      </div>

      {rows.map((row, i) => (
        <div key={i} className="flex items-center gap-2">
          <Input
            placeholder="chave"
            value={row.key}
            onChange={(e) => updateRow(i, "key", e.target.value)}
          />
          <Input
            placeholder="valor"
            value={row.value}
            onChange={(e) => updateRow(i, "value", e.target.value)}
          />
          <IGRPButton
            size="sm"
            variant="ghost"
            aria-label="remover"
            onClick={() => removeRow(i)}
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
          Save
        </IGRPButton>
      </div>
    </div>
  );
}
