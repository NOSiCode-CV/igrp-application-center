"use client";

import { Fragment, useEffect, useState } from "react";

import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import type { IGRPMenuItemArgs } from "@igrp/framework-next-types";
import {
  IGRPButton,
  IGRPIcon,
  Separator,
  useIGRPToast,
} from "@igrp/igrp-framework-react-design-system";
import type {
  ApplicationDTO,
  MenuType,
  Status,
} from "@igrp/platform-access-management-client-ts";
import { useTranslations } from "next-intl";

import { AppCenterLoading } from "@/components/loading";
import { isSystemApp } from "@/features/applications/app-utils";
import {
  useMenus,
  useUpdateMenu,
} from "@/features/applications/use-applications";
import { resolveMenuDrop } from "@/features/menus/menu-hierarchy";
import { statusSchema } from "@/schemas/global";

import { MenuDeleteDialog, type MenuDeleteTarget } from "./menu-delete-dialog";
import { MenuFormDialog } from "./menu-form-dialog";
import { SortableMenuItem } from "./menu-sortable-item";
import { MenuTreeContext } from "./menu-tree-context";

export function MenuList({ app }: { app: ApplicationDTO }) {
  const t = useTranslations("menus");
  const { code } = app;
  const { data: appMenus, isLoading, error: errorGetMenus } = useMenus(code);
  const [menus, setMenus] = useState<IGRPMenuItemArgs[]>([]);
  const [openFormDialog, setOpenFormDialog] = useState(false);
  const [openTypeFormDialog, setOpenTypeFormDialog] = useState<
    "edit" | "view" | undefined
  >();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedMenu, setSelectedMenu] = useState<
    IGRPMenuItemArgs | undefined
  >();
  const [menuToDelete, setMenuToDelete] = useState<MenuDeleteTarget | null>(
    null,
  );

  const { igrpToast } = useIGRPToast();
  const updateMenuMutation = useUpdateMenu();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  useEffect(() => {
    if (appMenus) {
      const sorted = [...appMenus].sort(
        (
          a: IGRPMenuItemArgs & { sortOrder?: number },
          b: IGRPMenuItemArgs & { sortOrder?: number },
        ) => {
          const aOrder = a.position ?? a.sortOrder ?? 0;
          const bOrder = b.position ?? b.sortOrder ?? 0;
          return aOrder - bOrder;
        },
      );
      setMenus(sorted);
    }
  }, [appMenus]);

  if (isLoading) return <AppCenterLoading description={t("list.loading")} />;

  if (errorGetMenus) {
    return (
      <div className="rounded-md border py-6">
        <p className="text-center">{t("list.loadError")}</p>
        <p className="text-center">{errorGetMenus.message}</p>
      </div>
    );
  }

  function handleView(menu: IGRPMenuItemArgs) {
    setSelectedMenu(menu);
    setOpenFormDialog(true);
    setOpenTypeFormDialog("view");
  }

  const handleEdit = (menu: IGRPMenuItemArgs) => {
    setSelectedMenu(menu);
    setOpenFormDialog(true);
    setOpenTypeFormDialog("edit");
  };

  const handleDelete = (code: string, name: string) => {
    const menu = menus.find((m) => m.code === code);
    const children = menus
      .filter(
        (m) => m.parentCode === code && m.status !== statusSchema.enum.DELETED,
      )
      .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
      .map((m) => ({ code: m.code, name: m.name, type: m.type }));
    setMenuToDelete({ code, name, type: menu?.type ?? "MENU_PAGE", children });
    setDeleteDialogOpen(true);
  };

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;

    const liveMenus = menus.filter(
      (m) => m.status !== statusSchema.enum.DELETED,
    );
    const drop = resolveMenuDrop(liveMenus, String(active.id), String(over.id));

    if (!drop.ok) {
      if (drop.reason === "invalidParent") {
        igrpToast({
          type: "warning",
          title: t("reorder.notAllowedTitle"),
          description: t("reorder.notAllowed"),
        });
      }
      return;
    }

    const changedMenus = drop.changes.flatMap((change) => {
      const menu = menus.find((m) => m.code === change.code);
      return menu ? [{ menu, change }] : [];
    });
    const movedByCode = new Map(
      changedMenus.map(({ menu, change }) => [
        menu.code,
        {
          ...menu,
          parentCode: change.parentCode ?? undefined,
          position: change.position,
        },
      ]),
    );

    setMenus((prev) => prev.map((m) => movedByCode.get(m.code) ?? m));

    try {
      const results = await Promise.all(
        changedMenus.map(({ menu, change }) =>
          updateMenuMutation.mutateAsync({
            appCode: app.code,
            menuCode: menu.code,
            data: {
              name: menu.name,
              icon: menu.icon,
              code: menu.code,
              type: menu.type as MenuType,
              status: menu.status as Status,
              url: menu.url,
              pageSlug: menu.pageSlug,
              parentCode: change.parentCode,
              target: menu.target,
              position: change.position,
            },
          }),
        ),
      );

      const failed = results.find((result) => !result.success);
      if (failed) {
        throw new Error(failed.error);
      }

      igrpToast({
        type: "success",
        title: t("reorder.updatedTitle"),
        description: t("reorder.updated"),
      });
    } catch (error) {
      console.error("[menus] reorder failed", error);

      igrpToast({
        type: "error",
        title: t("reorder.errorTitle"),
        description:
          error instanceof Error ? error.message : t("reorder.error"),
      });

      if (appMenus) {
        const sorted = [...appMenus].sort(
          (
            a: IGRPMenuItemArgs & { sortOrder?: number },
            b: IGRPMenuItemArgs & { sortOrder?: number },
          ) => {
            const aOrder = a.position ?? a.sortOrder ?? 0;
            const bOrder = b.position ?? b.sortOrder ?? 0;
            return aOrder - bOrder;
          },
        );
        setMenus(sorted);
      }
    }
  }

  const handleAddChild = (parentMenu: IGRPMenuItemArgs) => {
    setSelectedMenu({
      ...parentMenu,
      parentCode: parentMenu.code,
      code: "",
      name: "",
      icon: "",
      url: "",
      pageSlug: "",
      type: parentMenu.type === "GROUP" ? "FOLDER" : "MENU_PAGE",
    } as IGRPMenuItemArgs);
    setOpenFormDialog(true);
    setOpenTypeFormDialog(undefined);
  };

  const canEdit = !isSystemApp(app);

  function openCreate() {
    setSelectedMenu(undefined);
    setOpenFormDialog(true);
    setOpenTypeFormDialog(undefined);
  }

  const filteredMenus = menus.filter(
    (menu) => menu.status !== statusSchema.enum.DELETED,
  );

  const groupMenus = filteredMenus.filter(
    (menu) => !menu.parentCode && menu.type === "GROUP",
  );

  const folderMenus = filteredMenus.filter((menu) => menu.type === "FOLDER");

  const rootMenus = filteredMenus.filter((menu) => !menu.parentCode);
  const menuEmpty = filteredMenus.length === 0;

  const handleAddInternalPage = (parentMenu: IGRPMenuItemArgs) => {
    setSelectedMenu({
      parentCode: parentMenu.code,
      code: "",
      name: "",
      icon: "AppWindow",
      type: "MENU_PAGE",
      status: "ACTIVE",
      applicationCode: app.code,
    } as IGRPMenuItemArgs);
    setOpenFormDialog(true);
    setOpenTypeFormDialog(undefined);
  };

  const handleAddExternalPage = (parentMenu: IGRPMenuItemArgs) => {
    setSelectedMenu({
      parentCode: parentMenu.code,
      code: "",
      name: "",
      icon: "AppWindow",
      type: "EXTERNAL_PAGE",
      status: "ACTIVE",
      applicationCode: app.code,
    } as IGRPMenuItemArgs);
    setOpenFormDialog(true);
    setOpenTypeFormDialog(undefined);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-semibold tracking-tight">
            {t("list.title")}
          </h2>
          <p className="text-sm text-muted-foreground">
            {t("list.description")}
          </p>
        </div>
        {canEdit && !menuEmpty && (
          <IGRPButton
            showIcon
            iconName="ListPlus"
            size="sm"
            onClick={openCreate}
          >
            {t("list.new")}
          </IGRPButton>
        )}
      </div>

      <div className="overflow-hidden rounded-md border">
        {menuEmpty ? (
          <div className="flex flex-col items-center gap-2 px-4 py-12 text-center">
            <span className="mb-2 flex size-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
              <IGRPIcon
                iconName="ListTree"
                className="size-6"
                strokeWidth={1.75}
              />
            </span>
            <h3 className="font-semibold">{t("list.emptyTitle")}</h3>
            <p className="max-w-sm text-sm text-muted-foreground text-pretty">
              {canEdit
                ? t("list.emptyDescription")
                : t("list.systemEmptyDescription")}
            </p>
            {canEdit && (
              <IGRPButton
                showIcon
                iconName="Plus"
                className="mt-4"
                onClick={openCreate}
              >
                {t("list.createFirst")}
              </IGRPButton>
            )}
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={rootMenus.map((m) => m.code)}
              strategy={verticalListSortingStrategy}
            >
              <MenuTreeContext
                value={{
                  app,
                  allMenus: filteredMenus,
                  onView: handleView,
                  onEdit: handleEdit,
                  onAddChild: handleAddChild,
                  onDelete: handleDelete,
                  onAddInternalPage: handleAddInternalPage,
                  onAddExternalPage: handleAddExternalPage,
                }}
              >
                <div>
                  {rootMenus.map((menu, index) => (
                    <Fragment key={menu.code}>
                      {index > 0 && <Separator />}
                      <SortableMenuItem menu={menu} />
                    </Fragment>
                  ))}
                </div>
              </MenuTreeContext>
            </SortableContext>
          </DndContext>
        )}
      </div>

      <MenuFormDialog
        appCode={app.code}
        open={openFormDialog}
        onOpenChange={(open) => {
          setOpenFormDialog(open);
          if (!open) {
            setSelectedMenu(undefined);
            setOpenTypeFormDialog(undefined);
          }
        }}
        menu={selectedMenu}
        setMenus={setMenus}
        allMenus={menus}
        groupMenus={groupMenus}
        folderMenus={folderMenus}
        openType={openTypeFormDialog}
      />

      {menuToDelete && (
        <MenuDeleteDialog
          appCode={app.code}
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          menuToDelete={menuToDelete}
        />
      )}
    </div>
  );
}
