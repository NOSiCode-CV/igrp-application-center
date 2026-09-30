"use client";

import { useIGRPToast } from "@igrp/igrp-framework-react-design-system";
import type {
  IGRPUserDTO,
  Status,
} from "@igrp/platform-access-management-client-ts";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";

import { validateImageUpload } from "@/features/files/file-validation";
import { useUploadPublicFiles } from "@/features/files/use-files";
import { currentUserKeys } from "@/features/users/query-keys";
import { useUpdateUser } from "@/features/users/use-users";

type UpdateRes = Awaited<
  ReturnType<ReturnType<typeof useUpdateUser>["mutateAsync"]>
>;

function handle(
  res: UpdateRes,
  okTitle: string,
  errTitle: string,
  igrpToast: ReturnType<typeof useIGRPToast>["igrpToast"],
) {
  if (res.success) {
    igrpToast({ type: "success", title: okTitle, duration: 4000 });
    return;
  }
  igrpToast({
    type: "error",
    title: errTitle,
    description: res.error,
    duration: 4000,
  });
  throw new Error(res.error);
}

export function useUserProfileActions(user: IGRPUserDTO) {
  const { mutateAsync: updateUser, isPending: isUpdating } = useUpdateUser();
  const uploadFile = useUploadPublicFiles();
  const { igrpToast } = useIGRPToast();
  const t = useTranslations("users");
  const queryClient = useQueryClient();

  const latestUser = () =>
    queryClient.getQueryData<IGRPUserDTO>(currentUserKeys.detail()) ?? user;

  const saveName = async (next: string) => {
    const current = latestUser();
    const res = await updateUser({
      id: current.id,
      user: { ...current, name: next },
    });
    handle(
      res,
      t("nameEditor.toasts.updated"),
      t("nameEditor.toasts.updateFailed"),
      igrpToast,
    );
  };

  const uploadImageField = async (
    file: File,
    field: "picture" | "signature",
    labels: {
      folder: string;
      loadError: string;
      ok: string;
      saveError: string;
    },
  ): Promise<string> => {
    const validationError = validateImageUpload(file);
    if (validationError) {
      igrpToast({
        type: "error",
        title: labels.loadError,
        description: validationError,
        duration: 4000,
      });
      throw new Error(validationError);
    }

    let path: string;
    try {
      path = await uploadFile.mutateAsync({
        file,
        options: { folder: labels.folder },
      });
    } catch (err) {
      igrpToast({
        type: "error",
        title: labels.loadError,
        description: (err as Error).message,
        duration: 4000,
      });
      throw err;
    }

    const current = latestUser();
    const res = await updateUser({
      id: current.id,
      user: { ...current, [field]: path },
    });
    handle(res, labels.ok, labels.saveError, igrpToast);
    return path;
  };

  const uploadAvatar = async (file: File): Promise<void> => {
    await uploadImageField(file, "picture", {
      folder: `users/${user.id}/avatar`,
      loadError: t("profile.avatar.loadFailed"),
      ok: t("profile.avatar.updated"),
      saveError: t("profile.avatar.updateFailed"),
    });
  };

  const uploadSignature = (file: File) =>
    uploadImageField(file, "signature", {
      folder: `users/${user.id}/signature`,
      loadError: t("signature.toasts.loadFailed"),
      ok: t("signature.toasts.updated"),
      saveError: t("signature.toasts.updateFailed"),
    });

  const setStatus = async (next: Status) => {
    const current = latestUser();
    const res = await updateUser({
      id: current.id,
      user: { ...current, status: next },
    });
    const okTitle =
      next === "ACTIVE"
        ? t("profile.toasts.activated")
        : t("profile.toasts.deactivated");
    handle(res, okTitle, t("profile.toasts.statusChangeFailed"), igrpToast);
  };

  return {
    saveName,
    uploadAvatar,
    uploadSignature,
    setStatus,
    isUploadingAvatar: uploadFile.isPending,
    isUploadingSignature: uploadFile.isPending,
    isUpdating,
  };
}
