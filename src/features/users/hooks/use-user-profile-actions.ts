"use client";

import { useIGRPToast } from "@igrp/igrp-framework-react-design-system";
import type {
  IGRPUserDTO,
  Status,
} from "@igrp/platform-access-management-client-ts";
import { useQueryClient } from "@tanstack/react-query";

import { validateImageUpload } from "@/features/files/file-validation";
import { useUploadPublicFiles } from "@/features/files/use-files";
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
  const queryClient = useQueryClient();

  // Merge onto the freshest cached user so concurrent edits in other tabs
  // (e.g. the signature upload) are not clobbered by a stale snapshot.
  const latestUser = () =>
    queryClient.getQueryData<IGRPUserDTO>(["current-user"]) ?? user;

  const saveName = async (next: string) => {
    const current = latestUser();
    const res = await updateUser({
      id: current.id,
      user: { ...current, name: next },
    });
    handle(
      res,
      "Nome atualizado com sucesso",
      "Erro ao atualizar nome",
      igrpToast,
    );
  };

  // Shared upload→attach→toast flow for image fields (avatar, signature).
  // Validates client-side, uploads, then merges the path onto the freshest
  // cached user. Returns the stored path so callers can preview it.
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
      loadError: "Erro ao carregar avatar",
      ok: "Avatar atualizado com sucesso",
      saveError: "Erro ao atualizar avatar",
    });
  };

  const uploadSignature = (file: File) =>
    uploadImageField(file, "signature", {
      folder: `users/${user.id}/signature`,
      loadError: "Erro ao carregar assinatura",
      ok: "Assinatura atualizada com sucesso",
      saveError: "Erro ao atualizar assinatura",
    });

  const setStatus = async (next: Status) => {
    const current = latestUser();
    const res = await updateUser({
      id: current.id,
      user: { ...current, status: next },
    });
    const okTitle = `Utilizador ${next === "ACTIVE" ? "ativado" : "desativado"} com sucesso`;
    handle(res, okTitle, "Erro ao alterar estado", igrpToast);
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
