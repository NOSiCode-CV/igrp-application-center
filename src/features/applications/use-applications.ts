// import type { IGRPApplicationArgs } from "@igrp/framework-next-types";
import type {
  ApplicationFilters,
  UpdateApplicationRequest,
} from "@igrp/platform-access-management-client-ts";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  addDepartmentsToApplication,
  createApplication,
  getApplicationByCode,
  getApplications,
  getAvailableMenus,
  removeDepartmentsFromApplication,
  updateApplication,
} from "@/actions/applications";
import type { ApplicationArgs } from "./app-schemas";
import { MenuArgs } from "../menus/menu-schemas";

export const useApplications = (filters?: ApplicationFilters) => {
  return useQuery<ApplicationArgs[]>({
    queryKey: ["applications", filters],
    queryFn: () => getApplications(filters),
  });
};

export const useApplicationByCode = (code: string) => {
  return useQuery<ApplicationArgs>({
    queryKey: ["applications", code],
    queryFn: () => getApplicationByCode(code),
  });
};

export const useCreateApplication = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createApplication,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["applications"] });
    },
  });
};

export const useUpdateApplication = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      code,
      data,
    }: {
      code: string;
      data: UpdateApplicationRequest;
    }) => updateApplication(code, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["applications"] });
    },
  });
};

export const useApplicationAvailableMenus = (code?: string) => {
  return useQuery<MenuArgs[]>({
    queryKey: ["application-available-menus", code],
    queryFn: () => getAvailableMenus(code!),
    enabled: !!code,
  });
};

export const useAddDepartmentsToApplication = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      appCode,
      departmentIds,
    }: {
      appCode: string;
      departmentIds: string[];
    }) => addDepartmentsToApplication(appCode, departmentIds),
    onSuccess: (_, { appCode }) => {
      queryClient.invalidateQueries({ queryKey: ["applications"] });
      queryClient.invalidateQueries({ queryKey: ["applications", appCode] });
    },
  });
};

export const useRemoveDepartmentsFromApplication = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      appCode,
      departmentIds,
    }: {
      appCode: string;
      departmentIds: string[];
    }) => removeDepartmentsFromApplication(appCode, departmentIds),
    onSuccess: (_, { appCode }) => {
      queryClient.invalidateQueries({ queryKey: ["applications"] });
      queryClient.invalidateQueries({ queryKey: ["applications", appCode] });
    },
  });
};
