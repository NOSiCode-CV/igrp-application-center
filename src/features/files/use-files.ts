import type { UploadFileOptions } from "@igrp/platform-access-management-client-ts";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  getFileUrl,
  uploadPrivateFile,
  uploadPublicFile,
} from "@/actions/file";

export const useFiles = (path: string) => {
  return useQuery({
    queryKey: ["files", path ?? ""],
    queryFn: ({ queryKey: [, p] }) => getFileUrl(p),
    enabled: !!path,
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
    }) => uploadPublicFile(file, options),
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
    }) => uploadPrivateFile(file, options),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["public-files-private"],
      });
      await queryClient.refetchQueries({ queryKey: ["public-files-private"] });
    },
  });
};
