import { useQuery } from '@tanstack/react-query';
import { getCurrentUser, getUsers } from '@/actions/user';
import { IGRPUserDTO } from '@igrp/platform-access-management-client-ts';

export const useUsers = () => {
  return useQuery<IGRPUserDTO[]>({
    queryKey: ['users'],
    queryFn: () => getUsers(),
  });
};

export const useCurrentUser = () => {
  return useQuery<IGRPUserDTO>({
    queryKey: ['current-user'],
    queryFn: async () => getCurrentUser(),
  });
};

// export const useDeleteUser = () => {
//   const queryClient = useQueryClient();

//   return useMutation({
//     mutationFn: async (username: string) => deleteUser(username),
//     onSuccess: () => {
//       queryClient.invalidateQueries({ queryKey: ['users'] });
//     },
//   });
// };

// export const useApps = () => {
//   return useQuery<OptionsProps[]>({
//     queryKey: ['user-apps'],
//     queryFn: () => getApps(),
//   });
// };

// export const useRoles = (appCode?: string, departmentCode?: string) => {
//   return useQuery<string[]>({
//     queryKey: ['user-roles', appCode, departmentCode],
//     queryFn: () => getRoles(appCode, departmentCode),
//     enabled: !!appCode && !!departmentCode,
//   });
// };

// export function useInviteUser() {
//   const queryClient = useQueryClient();

//   return useMutation({
//     mutationFn: (params: InviteUserProps) => inviteUser(params),
//     onSuccess: () => {
//       queryClient.invalidateQueries({ queryKey: ['users'] });
//     },
//   });
// }

// export function useRolesFromUser(id?: string) {
//   return useQuery<string[]>({
//     queryKey: ['user-roles-from', id],
//     queryFn: () => getRolesFromUser(id),
//     enabled: !!id,
//   });
// }

// export function useUpdateUser() {
//   const queryClient = useQueryClient();

//   return useMutation({
//     mutationFn: async (formData: FormData) => updateUserProfile(formData),
//     onSuccess: () => {
//       queryClient.invalidateQueries({ queryKey: ['current-user', 'users'] });
//     },
//   });
// }

// export const useUserImage = () => {
//   return useQuery<UserPropsImage>({
//     queryKey: ['current-user-img'],
//     queryFn: () => getUserImage(),
//   });
// };

// export const useUserSignature = () => {
//   return useQuery<UserPropsImage>({
//     queryKey: ['current-user-sig'],
//     queryFn: () => getUserSignature(),
//   });
// };
