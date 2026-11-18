"use client";

import {
  Button,
  cn,
  IGRPIcon,
  Input,
} from "@igrp/igrp-framework-react-design-system";
import { useTranslations } from "next-intl";

import type { DepartmentWithChildren } from "../dept-tree-utils";
import { DepartmentEmptyState } from "./dept-empty-state";
import DepartmentTreeItem from "./dept-tree-item";

interface Props {
  filtered: DepartmentWithChildren[];
  searchTerm: string;
  onSearchChange(value: string): void;
  onCreate(): void;
  isFiltering: boolean;
  counts: { active: number; inactive: number };
}

export function DepartmentSidebarContent({
  filtered,
  searchTerm,
  onSearchChange,
  onCreate,
  isFiltering,
  counts,
}: Props) {
  const t = useTranslations("departments");
  return (
    <div className="flex flex-col h-full min-w-0">
      <div className="flex flex-col min-w-0">
        <h2 className="text-xl font-bold tracking-tight truncate">
          {t("sidebar.title")}
        </h2>
        <p className="text-muted-foreground text-sm mb-4">
          {counts.inactive > 0
            ? t("sidebar.summaryWithInactive", {
                active: counts.active,
                inactive: counts.inactive,
              })
            : t("sidebar.summary", { count: counts.active })}
        </p>
        <Button onClick={onCreate} className="w-full sm:w-auto">
          <IGRPIcon
            iconName="Plus"
            aria-hidden
            className="size-4"
            strokeWidth={2}
          />
          {t("actions.newDepartment")}
        </Button>
      </div>

      <div className="mt-4">
        <div className="relative">
          <IGRPIcon
            iconName="Search"
            aria-hidden
            className="absolute left-3 top-1/2 transform -translate-y-1/2 size-4 text-muted-foreground"
          />
          <Input
            type="search"
            aria-label={t("sidebar.searchLabel")}
            autoComplete="off"
            placeholder={t("sidebar.searchPlaceholder")}
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-background pl-8 pr-8"
          />
          {isFiltering && (
            <>
              <IGRPIcon
                iconName="LoaderCircle"
                aria-hidden
                className="absolute right-3 top-1/2 transform -translate-y-1/2 size-4 text-muted-foreground animate-spin motion-reduce:animate-none"
              />
              <span role="status" aria-live="polite" className="sr-only">
                {t("sidebar.filtering")}
              </span>
            </>
          )}
        </div>
      </div>

      <div
        className={cn(
          "flex-1 mt-3 overflow-y-auto min-h-[200px] transition-opacity motion-reduce:transition-none",
          isFiltering ? "opacity-70" : "opacity-100",
        )}
      >
        {filtered.length === 0 ? (
          <DepartmentEmptyState
            variant={searchTerm ? "sidebar-no-results" : "sidebar-empty"}
          />
        ) : (
          filtered.map((dept) => (
            <DepartmentTreeItem key={dept.code} dept={dept} />
          ))
        )}
      </div>
    </div>
  );
}
