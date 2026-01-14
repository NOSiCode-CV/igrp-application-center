import { useQuery } from "@tanstack/react-query";
import { getRoleByCode, getRoleById } from "@/actions/roles";
import { RoleDTO } from "@igrp/platform-access-management-client-ts";

export const useRoleByCode = (name: string) => {
  return useQuery<RoleDTO>({
    queryKey: ["roleByCode", name.toLowerCase()] as const,
    queryFn: () => getRoleByCode(name),
    enabled: !!name,
    retry: false,
    throwOnError: true,
  });
};

export const useRoleById = (id: number) => {
  return useQuery<RoleDTO>({
    queryKey: ["roleByCode", id] as const,
    queryFn: () => getRoleById(id),
    enabled: !!id,
    retry: false,
    throwOnError: true,
  });
};
