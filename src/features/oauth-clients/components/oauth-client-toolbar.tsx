"use client";

import Link from "next/link";

import {
  Button,
  IGRPButton,
  IGRPCombobox,
  IGRPIcon,
  type IGRPOptionsProps,
} from "@igrp/igrp-framework-react-design-system";

import { FacetedFilter } from "@/components/data-table/faceted-filter";
import { SearchInput } from "@/components/data-table/search-input";
import { ROUTES, STATUS_OPTIONS } from "@/lib/constants";

import { CLIENT_KIND_LABEL } from "../lib/oauth-client-utils";

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

const KIND_OPTIONS = [
  { value: "web", label: CLIENT_KIND_LABEL.web },
  { value: "machine", label: CLIENT_KIND_LABEL.machine },
];

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
          label="Pesquisar clientes"
          placeholder="Pesquisar por nome ou client ID…"
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
              placeholder="Aplicação"
              searchText="Pesquisar aplicações…"
              selectLabel="Nenhuma aplicação encontrada."
              disabled={disabled}
            />
          </div>
          <FacetedFilter
            label="Tipo"
            options={KIND_OPTIONS}
            value={filters.kind}
            onChange={(v) => set("kind", v)}
            counts={counts.kind}
            disabled={disabled}
          />
          <FacetedFilter
            label="Estado"
            options={STATUS_OPTIONS}
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
              Limpar
            </IGRPButton>
          )}
        </div>
      </div>
      <Button asChild className="shrink-0">
        <Link href={ROUTES.OAUTH_CLIENT_NEW}>
          <IGRPIcon iconName="Plus" aria-hidden="true" />
          Registar cliente
        </Link>
      </Button>
    </div>
  );
}
