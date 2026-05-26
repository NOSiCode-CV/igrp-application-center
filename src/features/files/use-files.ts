import type { UploadFileOptions } from "@igrp/platform-access-management-client-ts";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  getFileUrl,
  uploadPrivateFile,
  uploadPublicFile,
} from "@/actions/file";

export const useFiles = (
  path: string,
  options?: { enabled?: boolean },
) => {
  return useQuery({
    queryKey: ["files", path ?? ""],
    queryFn: async ({ queryKey: [, p] }) => {
      const result = await getFileUrl(p);
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    enabled: (options?.enabled ?? true) && !!path,
  });
};

export const useUploadPublicFiles = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      file,
      options,
    }: {
      file: File | Blob;
      options: UploadFileOptions;
    }) => {
      const result = await uploadPublicFile(file, options);
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["public-files-public"],
      });
      await queryClient.refetchQueries({ queryKey: ["public-files-public"] });
    },
  });
};

export const useUploadPrivateFiles = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      file,
      options,
    }: {
      file: File | Blob;
      options: UploadFileOptions;
    }) => {
      const result = await uploadPrivateFile(file, options);
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["public-files-private"],
      });
      await queryClient.refetchQueries({ queryKey: ["public-files-private"] });
    },
  });
};
