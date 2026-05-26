"use client";

import { useIGRPToast } from "@igrp/igrp-framework-react-design-system";
import type {
  IGRPUserDTO,
  Status,
} from "@igrp/platform-access-management-client-ts";
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
  const { mutateAsync: updateUser } = useUpdateUser();
  const uploadFile = useUploadPublicFiles();
  const { igrpToast } = useIGRPToast();

  const saveName = async (next: string) => {
    const res = await updateUser({
      id: user.id,
      user: { ...user, name: next },
    });
    handle(
      res,
      "Nome atualizado com sucesso",
      "Erro ao atualizar nome",
      igrpToast,
    );
  };

  const uploadAvatar = async (file: File) => {
    const path = await uploadFile.mutateAsync({
      file,
      options: { folder: `users/${user.id}/avatar` },
    });
    const res = await updateUser({
      id: user.id,
      user: { ...user, picture: path },
    });
    handle(
      res,
      "Avatar atualizado com sucesso",
      "Erro ao atualizar avatar",
      igrpToast,
    );
  };

  const setStatus = async (next: Status) => {
    const res = await updateUser({
      id: user.id,
      user: { ...user, status: next },
    });
    const okTitle = `Utilizador ${next === "ACTIVE" ? "ativado" : "desativado"} com sucesso`;
    handle(res, okTitle, "Erro ao alterar estado", igrpToast);
  };

  return {
    saveName,
    uploadAvatar,
    setStatus,
    isUploadingAvatar: uploadFile.isPending,
  };
}
