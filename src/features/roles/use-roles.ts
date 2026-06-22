import type { RoleDTO } from "@igrp/platform-access-management-client-ts";
import { useQuery } from "@tanstack/react-query";

import { getRoleByCode, getRoleById } from "@/actions/roles";
import { unwrap } from "@/actions/types";

export const useRoleByCode = (name: string) => {
  return useQuery<RoleDTO>({
    queryKey: ["roleByCode", name.toLowerCase()] as const,
    queryFn: async () => unwrap(await getRoleByCode(name)),
    enabled: !!name,
    throwOnError: true,
  });
};

export const useRoleById = (id: number) => {
  return useQuery<RoleDTO>({
    queryKey: ["roleById", id] as const,
    queryFn: async () => unwrap(await getRoleById(id)),
    enabled: !!id,
    throwOnError: true,
  });
};
