import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo } from "react";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { HttpStatusError } from "@/lib/errors";

import {
  parseReportQuery,
  type ReportQuery,
  serializeReportQuery,
} from "./lib/report-query";
import { accessReportOptions, settingsReportOptions } from "./query-options";

/** The screen's state, read from and written to the URL. */
export function useReportQuery() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const query = useMemo(
    () => parseReportQuery(new URLSearchParams(searchParams.toString())),
    [searchParams],
  );

  const setQuery = useCallback(
    (next: ReportQuery) => {
      router.replace(`?${serializeReportQuery(next).toString()}`, {
        scroll: false,
      });
    },
    [router],
  );

  return [query, setQuery] as const;
}

export const useAccessReport = (q: ReportQuery) =>
  useQuery({ ...accessReportOptions(q), placeholderData: keepPreviousData });

export const useSettingsReport = (q: ReportQuery) =>
  useQuery({ ...settingsReportOptions(q), placeholderData: keepPreviousData });

/* The API ends sessions well before tokens expire (guide §9.1). A 401 from a
   report is a dead session, not a bad filter: follow the app's expiry path. */
export function useRedirectOnUnauthorized(error: unknown) {
  const router = useRouter();
  useEffect(() => {
    if (error instanceof HttpStatusError && error.status === 401) {
      router.replace("/logout");
    }
  }, [error, router]);
}
