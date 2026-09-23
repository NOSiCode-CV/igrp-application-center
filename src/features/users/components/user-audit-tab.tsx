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
import { useTranslations } from "next-intl";

import { useFormat } from "@/i18n/format";

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

/** Same fields `toLocaleString()` rendered: date + time with seconds. */
const DATE_TIME_WITH_SECONDS: Intl.DateTimeFormatOptions = {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
};

interface UserAuditLogTabProps {
  userId: string;
}

export function UserAuditLogTab({ userId }: UserAuditLogTabProps) {
  const t = useTranslations("users.audit");
  const { formatDateTime } = useFormat();
  const [page, setPage] = useState(0);
  const { data, isLoading } = useUserAuditLogs(userId, {
    page,
    size: 10,
  });

  if (isLoading) return null;
  if (!data || data.empty) {
    return <p className="p-4 text-sm text-muted-foreground">{t("empty")}</p>;
  }

  return (
    <div className="flex flex-col gap-3 p-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("columns.timestamp")}</TableHead>
            <TableHead>{t("columns.event")}</TableHead>
            <TableHead>{t("columns.category")}</TableHead>
            <TableHead>{t("columns.ip")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.content.map((log) => (
            <TableRow key={log.id}>
              <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                {log.timestamp
                  ? formatDateTime(log.timestamp, DATE_TIME_WITH_SECONDS)
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
            {t("pagination.pageOf", {
              page: page + 1,
              total: data.totalPages,
            })}
          </span>
          <div className="flex gap-2">
            <button
              disabled={data.first}
              onClick={() => setPage((p) => p - 1)}
              className="disabled:opacity-40"
            >
              {t("pagination.previous")}
            </button>
            <button
              disabled={data.last}
              onClick={() => setPage((p) => p + 1)}
              className="disabled:opacity-40"
            >
              {t("pagination.next")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
