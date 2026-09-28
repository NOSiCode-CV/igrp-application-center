"use client";

import {
  Button,
  IGRPCalendarRange,
  IGRPIcon,
  IGRPSelect,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@igrp/igrp-framework-react-design-system";

import {
  formatYmd,
  isRangePreset,
  localDateToYmd,
  PLATFORM_TIME_ZONE_LABEL,
  todayYmd,
  ymdToLocalDate,
} from "../lib/platform-time";
import type { DateRangeSelection } from "../lib/report-query";

const PRESET_OPTIONS = [
  { label: "Últimas 24 horas", value: "24h" },
  { label: "Últimos 7 dias", value: "7d" },
  { label: "Últimos 30 dias", value: "30d" },
  { label: "Personalizado", value: "custom" },
];

/* Dates are required by every Report (guide §3), so there is no "all time".
   A range calendar cannot produce from > to, so the inverted-range 400
   (§9.3) is unreachable from here. */
export function ReportDateRange({
  range,
  onChange,
}: {
  range: DateRangeSelection;
  onChange: (range: DateRangeSelection) => void;
}) {
  const handlePreset = (value: string) => {
    if (value === "custom") {
      const today = todayYmd(new Date());
      onChange({ preset: "custom", from: today, to: today });
    } else if (isRangePreset(value)) {
      onChange({ preset: value });
    }
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-end gap-3">
      <IGRPSelect
        id="report-range"
        label="Período"
        options={PRESET_OPTIONS}
        value={range.preset}
        onValueChange={handlePreset}
      />
      {range.preset === "custom" && (
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline">
              <IGRPIcon iconName="CalendarDays" aria-hidden="true" />
              {`${formatYmd(range.from)} – ${formatYmd(range.to)}`}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <IGRPCalendarRange
              date={{
                from: ymdToLocalDate(range.from),
                to: ymdToLocalDate(range.to),
              }}
              disableAfter={ymdToLocalDate(todayYmd(new Date()))}
              onDateChange={(next) => {
                if (next?.from && next.to) {
                  onChange({
                    preset: "custom",
                    from: localDateToYmd(next.from),
                    to: localDateToYmd(next.to),
                  });
                }
              }}
            />
          </PopoverContent>
        </Popover>
      )}
      <p className="text-xs text-muted-foreground sm:pb-2">
        {PLATFORM_TIME_ZONE_LABEL}
      </p>
    </div>
  );
}
