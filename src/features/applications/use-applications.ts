import type {
  ApplicationDTO,
  ApplicationFilters,
  CreateMenuRequest,
  UpdateApplicationRequest,
  UpdateMenuRequest,
} from "@igrp/platform-access-management-client-ts";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  addRolesToMenu,
  createApplication,
  createMenu,
  deleteMenu,
  getApplicationByCode,
  getApplications,
  getMenus,
  removeRolesFromMenu,
  updateApplication,
  updateMenu,
} from "@/actions/applications";
import { IGRPMenuItemArgs } from "@igrp/framework-next-types";

export const useApplications = (filters?: ApplicationFilters) => {
  return useQuery<ApplicationDTO[]>({
    queryKey: ["applications", filters],
    queryFn: () => getApplications(filters),
  });
};

export const useApplicationByCode = (code: string) => {
  return useQuery<ApplicationDTO>({
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

// MENU
export const useMenus = (code?: string) => {
  const key = ["menus", code ?? null] as const;

  return useQuery<IGRPMenuItemArgs[]>({
    queryKey: key,
    queryFn: () => getMenus(code!),
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
    onSuccess: (newMenu) => {
      queryClient.invalidateQueries({ queryKey: ["menus"] });
      if (newMenu.applicationCode) {
        queryClient.invalidateQueries({
          queryKey: ["menus", "application", newMenu.applicationCode],
        });
      }
      if (newMenu.parentCode) {
        queryClient.invalidateQueries({
          queryKey: ["menus", "parent", newMenu.parentCode],
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
    onSuccess: (updatedMenu, { menuCode }) => {
      queryClient.invalidateQueries({ queryKey: ["menus"] });
      queryClient.invalidateQueries({ queryKey: ["menus", menuCode] });
      if (updatedMenu.applicationCode) {
        queryClient.invalidateQueries({
          queryKey: ["menus", "application", updatedMenu.applicationCode],
        });
      }
      if (updatedMenu.parentCode) {
        queryClient.invalidateQueries({
          queryKey: ["menus", "parent", updatedMenu.parentCode],
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
    onSuccess: (_, deletedCode) => {
      queryClient.invalidateQueries({ queryKey: ["menus"] });
      queryClient.removeQueries({ queryKey: ["menus", deletedCode] });
      queryClient.invalidateQueries({ queryKey: ["menus", "application"] });
      queryClient.invalidateQueries({ queryKey: ["menus", "parent"] });
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
      await queryClient.cancelQueries({
        queryKey: ["menu-roles", variables.appCode, variables.menuCode],
      });

      const previousRoles = queryClient.getQueryData([
        "menu-roles",
        variables.appCode,
        variables.menuCode,
      ]);

      queryClient.setQueryData(
        ["menu-roles", variables.appCode, variables.menuCode],
        (old: any) => [
          ...(old || []),
          ...variables.roleNames.map((code) => ({ code })),
        ],
      );

      return { previousRoles };
    },

    onError: (err, variables, context) => {
      if (context?.previousRoles) {
        queryClient.setQueryData(
          ["menu-roles", variables.appCode, variables.menuCode],
          context.previousRoles,
        );
      }
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
      await queryClient.cancelQueries({
        queryKey: ["menu-roles", variables.appCode, variables.menuCode],
      });

      const previousRoles = queryClient.getQueryData([
        "menu-roles",
        variables.appCode,
        variables.menuCode,
      ]);

      queryClient.setQueryData(
        ["menu-roles", variables.appCode, variables.menuCode],
        (old: any) =>
          old?.filter((role: any) => !variables.roleNames.includes(role.code)),
      );

      return { previousRoles };
    },

    onError: (err, variables, context) => {
      if (context?.previousRoles) {
        queryClient.setQueryData(
          ["menu-roles", variables.appCode, variables.menuCode],
          context.previousRoles,
        );
      }
    },
  });
};
