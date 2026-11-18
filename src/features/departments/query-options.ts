import { queryOptions } from "@tanstack/react-query";

import { getDepartments } from "@/actions/departments";
import { unwrap } from "@/actions/types";

import { departmentKeys } from "./query-keys";

export const departmentListOptions = () =>
  queryOptions({
    queryKey: departmentKeys.list(),
    queryFn: async () => unwrap(await getDepartments()),
  });
