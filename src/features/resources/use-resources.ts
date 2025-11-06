import { useQuery } from "@tanstack/react-query";

import { getResources } from "@/actions/resources";
import {
  ResourceDTO,
  ResourceFilters,
} from "@igrp/platform-access-management-client-ts";

export const useResources = (filters?: ResourceFilters) => {
  return useQuery<ResourceDTO[]>({
    queryKey: ["resources", filters],
    queryFn: () => getResources(filters),
  });
};
