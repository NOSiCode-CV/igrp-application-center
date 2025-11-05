import type { IGRPMenuCRUDArgs } from "@igrp/framework-next-types";
import type {
  MenuFilters,
  UpdateMenuRequest,
} from "@igrp/platform-access-management-client-ts";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { addDepartamentsToMenu, addRolesToMenu, createMenu, deleteMenu, getMenus, getMenusByDepartment, removeDepartamentsFromMenu, removeRolesFromMenu, updateMenu } from "@/actions/menus";

export const useMenus = (params?: MenuFilters) => {
  const key = ["menus", params?.applicationCode ?? null] as const;

  return useQuery<IGRPMenuCRUDArgs[]>({
    queryKey: key,
    queryFn: () => getMenus(params),
    enabled: !!params?.applicationCode,
  });
};

export const useCreateMenu = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createMenu,
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
    mutationFn: ({ code, data }: { code: string; data: UpdateMenuRequest }) =>
      updateMenu(code, data),
    onSuccess: (updatedMenu, { code }) => {
      queryClient.invalidateQueries({ queryKey: ["menus"] });
      queryClient.invalidateQueries({ queryKey: ["menus", code] });
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
    mutationFn: deleteMenu,
    onSuccess: (_, deletedCode) => {
      queryClient.invalidateQueries({ queryKey: ["menus"] });
      queryClient.removeQueries({ queryKey: ["menus", deletedCode] });
      queryClient.invalidateQueries({ queryKey: ["menus", "application"] });
      queryClient.invalidateQueries({ queryKey: ["menus", "parent"] });
    },
  });
};

export function useAddRolesToMenu() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ menuCode, roleCodes }: any) => addRolesToMenu(menuCode, roleCodes),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ["department-menus"] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ["app-menus"] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ["menu", variables.menuCode] 
      });
    },
    onError: (error) => {
      console.error("[useAddRolesToMenu] Erro ao adicionar roles:", error);
    },
  });
}

export function useRemoveRolesFromMenu() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ menuCode, roleCodes }: any) =>
      removeRolesFromMenu(menuCode, roleCodes),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ["department-menus"] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ["app-menus"] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ["menu", variables.menuCode] 
      });
    },
    onError: (error) => {
      console.error("[useRemoveRolesFromMenu] Erro ao remover roles:", error);
    },
  });
}

export const useAddDepartmentsToMenu = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ menuCode, departmentIds }: { menuCode: string; departmentIds: string[] }) =>
      addDepartamentsToMenu(menuCode, departmentIds),
    onSuccess: (_, { menuCode }) => {
      queryClient.invalidateQueries({ queryKey: ["menus"] });
      queryClient.invalidateQueries({ queryKey: ["menus", menuCode] });
    },
  });
};

export const useRemoveDepartmentsFromMenu = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ menuCode, departmentIds }: { menuCode: string; departmentIds: string[] }) =>
      removeDepartamentsFromMenu(menuCode, departmentIds),
    onSuccess: (_, { menuCode }) => {
      queryClient.invalidateQueries({ queryKey: ["menus"] });
      queryClient.invalidateQueries({ queryKey: ["menus", menuCode] });
    },
  });
};

export const useDepartmentMenus = (departmentCode?: string) => {
  return useQuery<IGRPMenuCRUDArgs[]>({
    queryKey: ["department-menus", departmentCode],
    queryFn: () => getMenusByDepartment(departmentCode!),
    enabled: !!departmentCode,
  });
};