import { UploadFileOptions } from '@igrp/platform-access-management-client-ts';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { getFileUrl, uploadPublicFile } from '@/actions/file';

export const useFiles = (path: string) => {
  return useQuery({
    queryKey: ['files', path ?? ''],
    queryFn: ({ queryKey: [, p] }) => getFileUrl(p),
    enabled: !!path,
  });
};

export const useUploadFiles = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ file, options }: { file: File | Blob; options: UploadFileOptions }) =>
      uploadPublicFile(file, options),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['public-files'] });
      await queryClient.refetchQueries({ queryKey: ['public-files'] });
    },
  });
};
