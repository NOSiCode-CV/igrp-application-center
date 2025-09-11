import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { UpdateApplicationRequest } from '@igrp/platform-access-management-client-ts';
import { IGRPApplicationArgs } from '@igrp/framework-next-types';

import {
  createApplication,
  // deleteApplication,
  // getAppImage,
  getApplicationByCode,
  getApplications,
  updateApplication,
} from '@/actions/applications';

export const useApplications = () => {
  return useQuery<IGRPApplicationArgs[]>({
    queryKey: ['applications'],
    queryFn: () => getApplications(),
  });
};

export const useApplicationByCode = (code: string) => {
  return useQuery<IGRPApplicationArgs>({
    queryKey: ['applications', code],
    queryFn: () => getApplicationByCode(code),
  });
};

export const useCreateApplication = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createApplication,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
    },
  });
};

export const useUpdateApplication = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ code, data }: { code: string; data: UpdateApplicationRequest }) =>
      updateApplication(code, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
    },
  });
};

// export const useDeleteApplication = () => {
//   const queryClient = useQueryClient();

//   return useMutation({
//     mutationFn: deleteApplication,
//     onSuccess: () => {
//       queryClient.invalidateQueries({ queryKey: ['applications'] });
//     },
//   });
// };

// export const useGetAppImage = (appId: number) => {
//   return useQuery<string>({
//     queryKey: ['applications', appId],
//     queryFn: () => getAppImage(appId),
//     enabled: !!appId,
//   });
// };
