import type { ApplicationFilters } from "@igrp/platform-access-management-client-ts";

export const applicationsKeys = {
  all: ["applications"] as const,
  list: (filters?: ApplicationFilters) =>
    filters
      ? (["applications", "list", filters] as const)
      : (["applications", "list"] as const),
  detail: (code: string) => ["applications", "detail", code] as const,
};

export const menusKeys = {
  all: ["menus"] as const,
  byApplication: (appCode: string) =>
    ["menus", "application", appCode] as const,
  roles: (appCode: string, menuCode: string) =>
    ["menu-roles", appCode, menuCode] as const,
};
