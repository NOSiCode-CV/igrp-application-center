"use client";

import { useState } from "react";

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  cn,
  IGRPButton,
  IGRPIcon,
  Input,
  Label,
  useIGRPToast,
} from "@igrp/igrp-framework-react-design-system";
import { useTranslations } from "next-intl";

import { useDeleteMenu } from "@/features/applications/use-applications";
import { useServerErrorMessage } from "@/i18n/server-error";

interface MenuNodeSummary {
  code: string;
  name: string;
  type: string;
}

export interface MenuDeleteTarget extends MenuNodeSummary {
  children: MenuNodeSummary[];
}

interface MenuDeleteDialogProps {
  appCode: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  menuToDelete: MenuDeleteTarget;
}

const TYPE_ICON: Record<string, string> = {
  GROUP: "FolderTree",
  FOLDER: "Folder",
  MENU_PAGE: "FileText",
  EXTERNAL_PAGE: "ExternalLink",
};

const TYPE_SUFFIX = { GROUP: "Group", FOLDER: "Folder" } as const;

const VISIBLE_CHILDREN = 4;

export function MenuDeleteDialog({
  appCode,
  open,
  onOpenChange,
  menuToDelete,
}: MenuDeleteDialogProps) {
  const t = useTranslations("menus.delete");
  const serverError = useServerErrorMessage();
  const tc = useTranslations("common.actions");
  const tt = useTranslations("menus.types");
  const [confirmation, setConfirmation] = useState("");
  const { igrpToast } = useIGRPToast();
  const { mutateAsync: deleteMenuAsync, isPending } = useDeleteMenu();

  const { children } = menuToDelete;
  const suffix =
    TYPE_SUFFIX[menuToDelete.type as keyof typeof TYPE_SUFFIX] ?? "Page";
  const needsTypedName = children.length > 0;
  const isConfirmed =
    !needsTypedName || confirmation.trim() === menuToDelete.name;
  const hidden = children.length - VISIBLE_CHILDREN;

  function handleOpenChange(next: boolean) {
    if (isPending) return;
    if (!next) setConfirmation("");
    onOpenChange(next);
  }

  async function confirmDelete() {
    if (!isConfirmed || isPending) return;
    try {
      const result = await deleteMenuAsync({
        appCode,
        menuCode: menuToDelete.code,
      });
      if (!result.success) {
        throw new Error(result.error);
      }

      igrpToast({
        type: "success",
        title: t("successTitle"),
        description: t("success", { name: menuToDelete.name }),
      });
      setConfirmation("");
      onOpenChange(false);
    } catch (error) {
      igrpToast({
        type: "error",
        title: t("errorTitle"),
        description:
          error instanceof Error ? serverError(error.message) : String(error),
        duration: 6000,
      });
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t(`title${suffix}`)}</AlertDialogTitle>
          <AlertDialogDescription className="text-pretty">
            {t("description")}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2.5">
          <div className="flex items-center gap-2.5">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-destructive/10 text-destructive">
              <IGRPIcon
                iconName={TYPE_ICON[menuToDelete.type] ?? "FileText"}
                className="size-4"
              />
            </span>
            <span className="min-w-0 flex-1 truncate text-sm font-semibold">
              {menuToDelete.name}
            </span>
            <span className="shrink-0 text-xs text-muted-foreground">
              {tt(suffix.toLowerCase() as "group" | "folder" | "page")}
            </span>
          </div>

          {needsTypedName && (
            <ul
              aria-label={t("contents", { count: children.length })}
              className="mt-2 ml-3.5 flex flex-col gap-1.5 border-l border-destructive/30 pl-4"
            >
              {children.slice(0, VISIBLE_CHILDREN).map((child) => (
                <li
                  key={child.code}
                  className="flex items-center gap-2 text-sm text-muted-foreground"
                >
                  <IGRPIcon
                    iconName={TYPE_ICON[child.type] ?? "FileText"}
                    className="size-3.5 shrink-0"
                  />
                  <span className="truncate">{child.name}</span>
                </li>
              ))}
              {hidden > 0 && (
                <li className="text-xs text-muted-foreground">
                  {t("more", { count: hidden })}
                </li>
              )}
            </ul>
          )}
        </div>

        {needsTypedName && (
          <div className="flex flex-col gap-2">
            <Label htmlFor="menu-delete-confirmation" className="font-normal">
              {t.rich("nameLabel", {
                name: menuToDelete.name,
                highlight: (chunks) => (
                  <strong className="font-semibold">{chunks}</strong>
                ),
              })}
            </Label>
            <Input
              id="menu-delete-confirmation"
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") confirmDelete();
              }}
              placeholder={menuToDelete.name}
              autoComplete="off"
              spellCheck={false}
              disabled={isPending}
              aria-invalid={confirmation !== "" && !isConfirmed}
            />
          </div>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>
            {tc("cancel")}
          </AlertDialogCancel>
          <IGRPButton
            variant="destructive"
            onClick={confirmDelete}
            disabled={!isConfirmed || isPending}
            showIcon
            iconName={isPending ? "LoaderCircle" : "Trash2"}
            className={cn(isPending && "[&_svg]:animate-spin")}
            iconPlacement="end"
          >
            {isPending ? t("deleting") : t(`confirm${suffix}`)}
          </IGRPButton>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
