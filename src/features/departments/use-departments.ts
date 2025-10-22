import type { UpdateDepartmentRequest } from "@igrp/platform-access-management-client-ts";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createDepartment,
  deleteDepartment,
  getDepartmentByCode,
  getDepartments,
  updateDepartment,
} from "@/actions/departaments";
import type { DepartmentArgs } from "./dept-schemas";

export const useDepartments = () => {
  return useQuery<DepartmentArgs[]>({
    queryKey: ["departments"],
    queryFn: () => getDepartments(),
  });
};

export const useCreateDepartment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createDepartment,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["departments"],
        exact: true,
      });
      await queryClient.refetchQueries({
        queryKey: ["departments"],
        exact: true,
      });
    },
  });
};

export const useUpdateDepartment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      code,
      data,
    }: {
      code: string;
      data: UpdateDepartmentRequest;
    }) => updateDepartment(code, data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["departments"] });
      await queryClient.refetchQueries({
        queryKey: ["departments"],
        exact: true,
      });
    },
  });
};

export const useDeleteDepartment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (code: string) => deleteDepartment(code),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["departments"] });
      await queryClient.refetchQueries({
        queryKey: ["departments"],
        exact: true,
      });
    },
  });
};

export const useDepartmentByCode = (code?: string) => {
  return useQuery<DepartmentArgs>({
    queryKey: ["department-by-code", code],
    queryFn: () => getDepartmentByCode(code!),
    enabled: !!code,
  });
};
