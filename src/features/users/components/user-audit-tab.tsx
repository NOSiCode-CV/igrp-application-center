"use client";

import { useState } from "react";

import {
  Badge,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@igrp/igrp-framework-react-design-system";

import { useUserAuditLogs } from "../use-users";

const EVENT_BADGE_VARIANT: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  LOGIN_SUCCESS: "default",
  LOGOUT: "secondary",
  LOGIN_FAILURE: "destructive",
  ROLE_CHANGED: "outline",
};

interface UserAuditLogTabProps {
  userId: string;
}

export function UserAuditLogTab({ userId }: UserAuditLogTabProps) {
  const [page, setPage] = useState(0);
  const { data, isLoading } = useUserAuditLogs(userId, {
    page,
    size: 10,
  });

  if (isLoading) return null;
  if (!data || data.empty) {
    return (
      <p className="p-4 text-sm text-muted-foreground">
        Sem registos de auditoria.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3 p-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Data / hora</TableHead>
            <TableHead>Evento</TableHead>
            <TableHead>Categoria</TableHead>
            <TableHead>IP</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.content.map((log) => (
            <TableRow key={log.id}>
              <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                {log.timestamp
                  ? new Date(log.timestamp).toLocaleString("pt-CV")
                  : "—"}
              </TableCell>
              <TableCell>
                <Badge
                  variant={
                    EVENT_BADGE_VARIANT[log.eventType ?? ""] ?? "secondary"
                  }
                >
                  {log.eventType ?? "—"}
                </Badge>
              </TableCell>
              <TableCell className="text-xs">{log.category ?? "—"}</TableCell>
              <TableCell className="text-xs font-mono">
                {log.ipAddress ?? "—"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {data.totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            Página {page + 1} de {data.totalPages}
          </span>
          <div className="flex gap-2">
            <button
              disabled={data.first}
              onClick={() => setPage((p) => p - 1)}
              className="disabled:opacity-40"
            >
              ← Anterior
            </button>
            <button
              disabled={data.last}
              onClick={() => setPage((p) => p + 1)}
              className="disabled:opacity-40"
            >
              Seguinte →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
