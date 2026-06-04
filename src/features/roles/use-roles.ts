import type { RoleDTO } from "@igrp/platform-access-management-client-ts";
import { useQuery } from "@tanstack/react-query";

import { getRoleByCode, getRoleById } from "@/actions/roles";

export const useRoleByCode = (name: string) => {
  return useQuery<RoleDTO>({
    queryKey: ["roleByCode", name.toLowerCase()] as const,
    queryFn: async () => {
      const result = await getRoleByCode(name);
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    enabled: !!name,
    retry: false,
    throwOnError: true,
  });
};

export const useRoleById = (id: number) => {
  return useQuery<RoleDTO>({
    queryKey: ["roleById", id] as const,
    queryFn: async () => {
      const result = await getRoleById(id);
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    enabled: !!id,
    retry: false,
    throwOnError: true,
  });
};
