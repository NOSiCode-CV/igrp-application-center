import type { ApplicationFilters } from "@igrp/platform-access-management-client-ts";
import { queryOptions } from "@tanstack/react-query";

import { getApplicationByCode, getApplications } from "@/actions/applications";
import { unwrap } from "@/actions/types";

import { applicationsKeys } from "./query-keys";

export const applicationsListOptions = (filters?: ApplicationFilters) =>
  queryOptions({
    queryKey: applicationsKeys.list(filters),
    queryFn: async () => unwrap(await getApplications(filters)),
  });

export const applicationByCodeOptions = (code: string) =>
  queryOptions({
    queryKey: applicationsKeys.detail(code),
    queryFn: async () => unwrap(await getApplicationByCode(code)),
    enabled: !!code,
  });
