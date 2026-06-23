import type { IGRPMenuItemArgs } from "@igrp/framework-next-types";
import type {
  ApplicationFilters,
  CreateMenuRequest,
  UpdateApplicationRequest,
  UpdateMenuRequest,
} from "@igrp/platform-access-management-client-ts";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  addRolesToMenu,
  createApplication,
  createMenu,
  deleteMenu,
  getMenus,
  removeRolesFromMenu,
  updateApplication,
  updateMenu,
} from "@/actions/applications";
import { unwrap } from "@/actions/types";

import { applicationsKeys, menusKeys } from "./query-keys";
import {
  applicationByCodeOptions,
  applicationsListOptions,
} from "./query-options";

export const useApplications = (filters?: ApplicationFilters) => {
  return useQuery({
    ...applicationsListOptions(filters),
    placeholderData: keepPreviousData,
  });
};

export const useApplicationByCode = (code: string) => {
  return useQuery(applicationByCodeOptions(code));
};

export const useCreateApplication = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createApplication,
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: applicationsKeys.all });
      }
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
    onSuccess: (result, { code }) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: applicationsKeys.all });
        queryClient.invalidateQueries({
          queryKey: applicationsKeys.detail(code),
        });
      }
    },
  });
};

export const useMenus = (code: string) => {
  return useQuery<IGRPMenuItemArgs[], Error>({
    queryKey: menusKeys.byApplication(code),
    queryFn: async () => unwrap(await getMenus(code)),
    enabled: !!code,
  });
};

export const useCreateMenu = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      appCode,
      menu,
    }: {
      appCode: string;
      menu: CreateMenuRequest;
    }) => createMenu(appCode, menu),
    onSuccess: (result, { appCode }) => {
      if (result.success) {
        queryClient.invalidateQueries({
          queryKey: menusKeys.byApplication(appCode),
        });
      }
    },
  });
};

export const useUpdateMenu = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      appCode,
      menuCode,
      data,
    }: {
      appCode: string;
      menuCode: string;
      data: UpdateMenuRequest;
    }) => updateMenu(appCode, menuCode, data),
    onSuccess: (result, { appCode }) => {
      if (result.success) {
        queryClient.invalidateQueries({
          queryKey: menusKeys.byApplication(appCode),
        });
      }
    },
  });
};

export const useDeleteMenu = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      appCode,
      menuCode,
    }: {
      appCode: string;
      menuCode: string;
    }) => deleteMenu(appCode, menuCode),
    onSuccess: (result, { appCode, menuCode }) => {
      if (result.success) {
        queryClient.invalidateQueries({
          queryKey: menusKeys.byApplication(appCode),
        });
        queryClient.removeQueries({
          queryKey: menusKeys.roles(appCode, menuCode),
        });
      }
    },
  });
};

export const useAddRolesToMenu = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      appCode,
      menuCode,
      departmentCode,
      roleNames,
    }: {
      appCode: string;
      menuCode: string;
      departmentCode: string;
      roleNames: string[];
    }) => addRolesToMenu(appCode, menuCode, departmentCode, roleNames),
    onMutate: async (variables) => {
      const key = menusKeys.roles(variables.appCode, variables.menuCode);
      await queryClient.cancelQueries({ queryKey: key });
      const previousRoles = queryClient.getQueryData(key);
      queryClient.setQueryData<{ code: string }[]>(key, (old) => [
        ...(old ?? []),
        ...variables.roleNames.map((code) => ({ code })),
      ]);
      return { previousRoles };
    },
    onError: (_err, variables, context) => {
      if (context?.previousRoles) {
        queryClient.setQueryData(
          menusKeys.roles(variables.appCode, variables.menuCode),
          context.previousRoles,
        );
      }
    },
    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({
        queryKey: menusKeys.roles(variables.appCode, variables.menuCode),
      });
    },
  });
};

export const useRemoveRolesFromMenu = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      appCode,
      menuCode,
      departmentCode,
      roleNames,
    }: {
      appCode: string;
      menuCode: string;
      departmentCode: string;
      roleNames: string[];
    }) => removeRolesFromMenu(appCode, menuCode, departmentCode, roleNames),
    onMutate: async (variables) => {
      const key = menusKeys.roles(variables.appCode, variables.menuCode);
      await queryClient.cancelQueries({ queryKey: key });
      const previousRoles = queryClient.getQueryData(key);
      queryClient.setQueryData<{ code: string }[]>(key, (old) =>
        old?.filter((role) => !variables.roleNames.includes(role.code)),
      );
      return { previousRoles };
    },
    onError: (_err, variables, context) => {
      if (context?.previousRoles) {
        queryClient.setQueryData(
          menusKeys.roles(variables.appCode, variables.menuCode),
          context.previousRoles,
        );
      }
    },
    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({
        queryKey: menusKeys.roles(variables.appCode, variables.menuCode),
      });
    },
  });
};
