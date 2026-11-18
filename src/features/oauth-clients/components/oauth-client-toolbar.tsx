"use client";

import Link from "next/link";
import { useMemo } from "react";

import {
  Button,
  IGRPButton,
  IGRPCombobox,
  IGRPIcon,
  type IGRPOptionsProps,
} from "@igrp/igrp-framework-react-design-system";
import { useTranslations } from "next-intl";

import { FacetedFilter } from "@/components/data-table/faceted-filter";
import { SearchInput } from "@/components/data-table/search-input";
import { useStatusOptions } from "@/i18n/status";
import { ROUTES } from "@/lib/constants";

export interface OAuthClientFilters {
  search: string;
  kind: string[];
  /** Application code, "—" for clients without one, "" for all. */
  application: string;
  status: string[];
}

export const EMPTY_OAUTH_CLIENT_FILTERS: OAuthClientFilters = {
  search: "",
  kind: [],
  application: "",
  status: [],
};

type FacetKey = "kind" | "status";

interface OAuthClientToolbarProps {
  filters: OAuthClientFilters;
  onFiltersChange: (next: OAuthClientFilters) => void;
  applicationOptions: IGRPOptionsProps[];
  /** How many clients carry each option, per facet. */
  counts: Record<FacetKey, Record<string, number>>;
  disabled?: boolean;
}

export function OAuthClientToolbar({
  filters,
  onFiltersChange,
  applicationOptions,
  counts,
  disabled = false,
}: OAuthClientToolbarProps) {
  const t = useTranslations("oauthClients");
  const tc = useTranslations("common.actions");
  const statusOptions = useStatusOptions();
  const kindOptions = useMemo(
    () => [
      { value: "web", label: t("kind.web") },
      { value: "machine", label: t("kind.machine") },
    ],
    [t],
  );
  const isFiltered =
    filters.search !== "" ||
    filters.kind.length > 0 ||
    filters.application !== "" ||
    filters.status.length > 0;

  const set = <K extends keyof OAuthClientFilters>(
    key: K,
    value: OAuthClientFilters[K],
  ) => onFiltersChange({ ...filters, [key]: value });

  return (
    <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
      <div className="flex w-full flex-col gap-2 md:flex-row md:items-start">
        <SearchInput
          value={filters.search}
          onChange={(v) => set("search", v)}
          label={t("toolbar.searchLabel")}
          placeholder={t("toolbar.searchPlaceholder")}
          disabled={disabled}
        />
        <div className="flex flex-wrap items-start gap-2">
          {/* Outside a form IGRPCombobox wraps itself in a `w-full` div and
              puts `className` on the trigger, so the width goes here or the
              filter takes a whole row of its own. */}
          <div className="w-60">
            <IGRPCombobox
              variant="single"
              showSearch
              options={applicationOptions}
              value={filters.application}
              onChange={(v) =>
                set("application", typeof v === "string" ? v : "")
              }
              placeholder={t("toolbar.application")}
              searchText={t("toolbar.applicationSearch")}
              selectLabel={t("toolbar.applicationEmpty")}
              disabled={disabled}
            />
          </div>
          <FacetedFilter
            label={t("toolbar.kind")}
            options={kindOptions}
            value={filters.kind}
            onChange={(v) => set("kind", v)}
            counts={counts.kind}
            disabled={disabled}
          />
          <FacetedFilter
            label={t("toolbar.status")}
            options={statusOptions}
            value={filters.status}
            onChange={(v) => set("status", v)}
            counts={counts.status}
            disabled={disabled}
          />
          {isFiltered && !disabled && (
            <IGRPButton
              variant="ghost"
              showIcon
              iconName="X"
              onClick={() => onFiltersChange(EMPTY_OAUTH_CLIENT_FILTERS)}
            >
              {tc("clear")}
            </IGRPButton>
          )}
        </div>
      </div>
      <Button asChild className="shrink-0">
        <Link href={ROUTES.OAUTH_CLIENT_NEW}>
          <IGRPIcon iconName="Plus" aria-hidden="true" />
          {t("toolbar.register")}
        </Link>
      </Button>
    </div>
  );
}
