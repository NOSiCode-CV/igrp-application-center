"use client";

import { Fragment } from "react";

import type { SettingsReportRowDTO } from "@igrp/platform-access-management-client-ts";
import { useTranslations } from "next-intl";

import { parseSettingsDiff } from "../lib/settings-diff";

/* For ASSOCIATE / DISASSOCIATE of a Permission, the row's entity is the
   Permission and `relatedEntity` is the Role (guide §9.6). */
export function SettingsChangeDetail({ row }: { row: SettingsReportRowDTO }) {
  const t = useTranslations("audit.detail");
  const changes = parseSettingsDiff(row.previousValue, row.newValue);
  const hasRaw = Boolean(row.previousValue || row.newValue);

  return (
    <div className="flex flex-col gap-3 px-4 py-3 text-sm">
      {row.ipAddress && (
        <p>
          <span className="text-muted-foreground">{t("ip")} </span>
          <span className="tabular-nums">{row.ipAddress}</span>
        </p>
      )}
      {row.relatedEntity && (
        <p>
          <span className="text-muted-foreground">{t("relatedEntity")} </span>
          {row.relatedEntity}
        </p>
      )}
      {changes ? (
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
          {changes.map((c) => (
            <Fragment key={c.field}>
              <dt className="font-medium">{c.field}</dt>
              <dd className="break-all">
                <span className="sr-only">{t("before")} </span>
                <span className="text-muted-foreground line-through">
                  {c.previous ?? "—"}
                </span>
                <span aria-hidden="true"> → </span>
                <span className="sr-only">{t("after")} </span>
                <span>{c.next ?? "—"}</span>
              </dd>
            </Fragment>
          ))}
        </dl>
      ) : hasRaw ? (
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
          <dt className="font-medium">{t("previous")}</dt>
          <dd className="break-all">{row.previousValue ?? "—"}</dd>
          <dt className="font-medium">{t("next")}</dt>
          <dd className="break-all">{row.newValue ?? "—"}</dd>
        </dl>
      ) : null}
    </div>
  );
}
