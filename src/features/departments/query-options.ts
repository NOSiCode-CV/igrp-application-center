import { queryOptions } from "@tanstack/react-query";

import { getDepartmentByCode, getDepartments } from "@/actions/departments";
import { unwrap } from "@/actions/types";

import { departmentKeys } from "./query-keys";

export const departmentListOptions = () =>
  queryOptions({
    queryKey: departmentKeys.list(),
    queryFn: async () => unwrap(await getDepartments()),
  });

export const departmentByCodeOptions = (code?: string) =>
  queryOptions({
    queryKey: departmentKeys.detail(code),
    queryFn: async () => unwrap(await getDepartmentByCode(code ?? "")),
    enabled: !!code,
  });
