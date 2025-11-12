import type {
  MenuEntryDTO,
  UpdateDepartmentRequest,
} from "@igrp/platform-access-management-client-ts";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  addApplicationsToDepartment,
  addMenusToDepartment,
  createDepartment,
  deleteDepartment,
  getAvailableApplications,
  getAvailableMenus,
  getDepartmentByCode,
  getDepartments,
  removeApplicationsFromDepartment,
  removeMenusFromDepartment,
  updateDepartment,
} from "@/actions/departaments";
import type { DepartmentArgs } from "./dept-schemas";
import { ApplicationArgs } from "../applications/app-schemas";

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
    queryFn: () => getDepartmentByCode(code || ""),
    enabled: !!code,
  });
};

export const useDepartmentAvailableApps = (code?: string) => {
  return useQuery<ApplicationArgs[]>({
    queryKey: ["department-available-menus-for-roles", code],
    queryFn: () => getAvailableApplications(code!),
    enabled: !!code,
  });
};

export const useAddApplicationsToDepartment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      code,
      appCodes,
    }: {
      code: string;
      appCodes: string[];
    }) => addApplicationsToDepartment(code, appCodes),
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({ queryKey: ["departments"] });

      await queryClient.invalidateQueries({
        queryKey: ["applications", { departmentCode: variables.code }],
      });

      await queryClient.invalidateQueries({
        queryKey: ["department-available-apps", variables.code],
      });

       await queryClient.invalidateQueries({
        queryKey: ["department-available-menus", variables.code],
      });

      await queryClient.invalidateQueries({
        queryKey: ["department-menus", variables.code],
      });

      await queryClient.refetchQueries({
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

export const useRemoveApplicationsFromDepartment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      code,
      appCodes,
    }: {
      code: string;
      appCodes: string[];
    }) => removeApplicationsFromDepartment(code, appCodes),
    onSuccess: async (_, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["applications", { departmentCode: variables.code }],
        }),
        queryClient.invalidateQueries({
          queryKey: ["department-available-apps", variables.code],
        }),
        queryClient.invalidateQueries({ 
          queryKey: ["departments"] 
        }),
      ]);
      queryClient.invalidateQueries({
          queryKey: ["department-available-menus", variables.code],
        }),
        queryClient.invalidateQueries({
          queryKey: ["department-menus", variables.code],
        }),

      await Promise.all([
        queryClient.refetchQueries({
          queryKey: ["applications", { departmentCode: variables.code }],
          type: 'active',
        }),
        queryClient.refetchQueries({
          queryKey: ["department-available-apps", variables.code],
          type: 'active',
        }),
      ]);
    },
  });
};

export const useDepartmentAvailableMenus = (code?: string) => {
  return useQuery<MenuEntryDTO[]>({
    queryKey: ["department-available-menus", code],
    queryFn: () => getAvailableMenus(code!),
    enabled: !!code,
  });
};

export const useAddMenusToDepartment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      code,
      menuCodes,
    }: {
      code: string;
      menuCodes: string[];
    }) => addMenusToDepartment(code, menuCodes),
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({ queryKey: ["departments"] });

      await queryClient.invalidateQueries({
        queryKey: ["department-menus", variables.code],
      });

      await queryClient.invalidateQueries({
        queryKey: ["department-available-menus", variables.code],
      });

      await queryClient.refetchQueries({
        queryKey: ["departments"],
        exact: true,
      });
    },
  });
};

export const useRemoveMenusFromDepartment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      code,
      menuCodes,
    }: {
      code: string;
      menuCodes: string[];
    }) => removeMenusFromDepartment(code, menuCodes),
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({ queryKey: ["departments"] });

      await queryClient.invalidateQueries({
        queryKey: ["department-menus", variables.code],
      });

      await queryClient.invalidateQueries({
        queryKey: ["department-available-menus", variables.code],
      });

      await queryClient.refetchQueries({
        queryKey: ["departments"],
        exact: true,
      });
    },
  });
};
