"use client";

import { useEffect, useMemo, useState } from "react";

import { useIGRPFormat } from "@igrp/framework-next/i18n/client";
import {
  Button,
  IGRPButton,
  IGRPCalendarRange,
  IGRPCombobox,
  IGRPIcon,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@igrp/igrp-framework-react-design-system";
import { useTranslations } from "next-intl";

import {
  isRangePreset,
  localDateToYmd,
  todayYmd,
  ymdToLocalDate,
} from "../lib/platform-time";
import type { DateRangeSelection } from "../lib/report-query";

/** The zone the platform default (`IGRP_TIME_ZONE`) names "Cabo Verde time". */
const CAPE_VERDE_TIME_ZONE = "Atlantic/Cape_Verde";

type DraftRange = { from?: Date; to?: Date } | undefined;

function todayDraft(timeZone: string | undefined): DraftRange {
  const today = ymdToLocalDate(todayYmd(new Date(), timeZone));
  return { from: today, to: today };
}

/* Dates are required by every Report (guide §3), so there is no "all time".
   Picking days in the calendar only edits a draft: nothing is fetched until
   "OK", so choosing a range doesn't fire one search per click. A range
   calendar cannot produce from > to, so the inverted-range 400 (§9.3) is
   unreachable from here. */
export function ReportDateRange({
  range,
  onChange,
}: {
  range: DateRangeSelection;
  onChange: (range: DateRangeSelection) => void;
}) {
  const t = useTranslations("audit.period");
  const { formatDate, timeZone } = useIGRPFormat();
  const presetOptions = useMemo(
    () => [
      { label: t("last24h"), value: "24h" },
      { label: t("last7d"), value: "7d" },
      { label: t("last30d"), value: "30d" },
      { label: t("custom"), value: "custom" },
    ],
    [t],
  );
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<DraftRange>();
  /* "Personalizado" chosen but not yet applied: the URL still holds the old
     preset until "OK". Cleared once the URL catches up. */
  const [pendingCustom, setPendingCustom] = useState(false);

  useEffect(() => {
    if (range.preset === "custom") setPendingCustom(false);
  }, [range.preset]);

  const isCustom = range.preset === "custom" || pendingCustom;

  const draftFromRange = (): DraftRange =>
    range.preset === "custom"
      ? { from: ymdToLocalDate(range.from), to: ymdToLocalDate(range.to) }
      : todayDraft(timeZone);

  const handlePreset = (value: string | string[]) => {
    if (value === "custom") {
      if (range.preset === "custom") return;
      setPendingCustom(true);
      setDraft(todayDraft(timeZone));
      setOpen(true);
    } else if (isRangePreset(value)) {
      setPendingCustom(false);
      setOpen(false);
      onChange({ preset: value });
    }
    // "" (the current option picked again) keeps the current range.
  };

  const handleOpenChange = (next: boolean) => {
    if (next) {
      setDraft(draftFromRange());
      setOpen(true);
      return;
    }
    // Dismissed without "OK": drop the draft; a pending "Personalizado"
    // goes back to the preset still in the URL.
    setOpen(false);
    setPendingCustom(false);
  };

  const apply = () => {
    if (!draft?.from || !draft.to) return;
    onChange({
      preset: "custom",
      from: localDateToYmd(draft.from),
      to: localDateToYmd(draft.to),
    });
    setOpen(false);
  };

  const triggerText =
    range.preset === "custom"
      ? `${formatDate(range.from)} – ${formatDate(range.to)}`
      : t("pickDates");

  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-end">
      {/* IGRPCombobox wraps itself in a `w-full` div and puts `className` on
          the trigger, so the width goes here or it fills the row and pushes
          the date button and time zone to the far edge. */}
      <div className="w-full md:w-72 md:shrink-0">
        <IGRPCombobox
          id="report-range"
          showSearch={false}
          label={t("label")}
          variant="single"
          options={presetOptions}
          value={isCustom ? "custom" : range.preset}
          selectLabel={t("noResults")}
          onChange={handlePreset}
        />
      </div>
      {isCustom && (
        <Popover open={open} onOpenChange={handleOpenChange}>
          <PopoverTrigger asChild>
            <Button variant="outline">
              <IGRPIcon iconName="CalendarDays" aria-hidden="true" />
              {triggerText}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <IGRPCalendarRange
              date={
                draft?.from ? { from: draft.from, to: draft.to } : undefined
              }
              disableAfter={ymdToLocalDate(todayYmd(new Date(), timeZone))}
              onDateChange={(next) =>
                setDraft(next ? { from: next.from, to: next.to } : undefined)
              }
            />
            <div className="flex justify-end gap-2 px-3 pb-3">
              <IGRPButton
                size="icon"
                variant="secondary"
                iconName="Eraser"
                aria-label={t("clear")}
                title={t("clear")}
                onClick={() => setDraft(undefined)}
              />
              <IGRPButton
                size="icon"
                iconName="Check"
                aria-label={t("apply")}
                title={t("apply")}
                className="bg-success text-success-foreground hover:bg-success/90"
                disabled={!draft?.from || !draft.to}
                onClick={apply}
              />
            </div>
          </PopoverContent>
        </Popover>
      )}
      <p className="text-xs text-muted-foreground md:pb-2">
        {timeZone === CAPE_VERDE_TIME_ZONE ? t("capeVerdeTime") : timeZone}
      </p>
    </div>
  );
}
