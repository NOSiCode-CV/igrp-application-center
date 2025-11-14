"use client";

import type { IGRPApplicationArgs, IGRPMenuItemArgs } from "@igrp/framework-next-types";
import {
  IGRPButtonPrimitive,
  IGRPCardDescriptionPrimitive,
  IGRPCardTitlePrimitive,
  IGRPIcon,
  useIGRPToast,
} from "@igrp/igrp-framework-react-design-system";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useEffect, useState } from "react";
import { ButtonLink } from "@/components/button-link";
import { AppCenterLoading } from "@/components/loading";
import { useMenus, useUpdateMenu } from "@/features/menus/use-menus";
import { statusSchema } from "@/schemas/global";
import { MenuDeleteDialog } from "./menu-delete-dialog";
import { MenuFormDialog } from "./menu-form-dialog";
import { SortableMenuItem } from "./menu-sortable-item";
import { MenuType, Status } from "@igrp/platform-access-management-client-ts";

export function MenuList({ app }: { app: IGRPApplicationArgs }) {
  const { code } = app;
  const {
    data: appMenus,
    isLoading,
    error: errorGetMenus,
  } = useMenus({ applicationCode: code });

  const [menus, setMenus] = useState<IGRPMenuItemArgs[]>([]);
  const [openFormDialog, setOpenFormDialog] = useState(false);
  const [openTypeFormDialog, setOpenTypeFormDialog] = useState<"edit" | "view" | undefined>();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedMenu, setSelectedMenu] = useState<IGRPMenuItemArgs | undefined>();
  const [menuToDelete, setMenuToDelete] = useState<{
    code: string;
    name: string;
  } | null>(null);

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
      const sorted = [...appMenus].sort((a: any, b: any) => {
        const aOrder = a.position ?? a.sortOrder ?? 0;
        const bOrder = b.position ?? b.sortOrder ?? 0;
        return aOrder - bOrder;
      });
      setMenus(sorted);
    }
  }, [appMenus]);

  if (isLoading) return <AppCenterLoading descrption="A carregar menus..." />;

  if (errorGetMenus) {
    return (
      <div className="rounded-md border py-6">
        <p className="text-center">Ocorreu um erro ao carregar menus.</p>
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
    setMenuToDelete({ code, name });
    setDeleteDialogOpen(true);
  };

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const activeMenu = active.data.current?.menu as IGRPMenuItemArgs;
    const overMenu = over.data.current?.menu as IGRPMenuItemArgs;

    const activeParentCode = activeMenu.parentCode ?? null;
    const overParentCode = overMenu.parentCode ?? null;

    if (activeParentCode !== overParentCode) {
      igrpToast({
        type: "warning",
        title: "Movimento não permitido",
        description: "Só é possível reordenar menus no mesmo nível hierárquico.",
      });
      return;
    }

    const parentCode = activeParentCode;
    const siblings = menus.filter(
      (m) => (m.parentCode ?? null) === parentCode
    );
    const otherMenus = menus.filter(
      (m) => (m.parentCode ?? null) !== parentCode
    );

    const oldIndex = siblings.findIndex((item) => item.code === active.id);
    const newIndex = siblings.findIndex((item) => item.code === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(siblings, oldIndex, newIndex);

    const updatedSiblings = reordered.map((item, index) => ({
      ...item,
      position: index,
      sortOrder: index,
    }));

    setMenus([...otherMenus, ...updatedSiblings]);

    try {
      await Promise.all(
        updatedSiblings.map((menu, index) =>
          updateMenuMutation.mutateAsync({
            code: menu.code,
            data: {
              name: menu.name,
              icon: menu.icon,
              code: menu.code,
              type: menu.type as MenuType,
              status: menu.status as Status,
              url: menu.url,
              pageSlug: menu.pageSlug,
              parentCode: menu.parentCode,
              applicationCode: menu.applicationCode,
              position: index,
            },
          })
        )
      );

      igrpToast({
        type: "success",
        title: "Ordem atualizada",
        description: "A ordem dos menus foi reorganizada.",
      });
    } catch (error) {
      console.error("Erro ao atualizar ordem:", error);

      igrpToast({
        type: "error",
        title: "Erro ao salvar",
        description: "Não foi possível salvar a ordem dos menus.",
      });

      if (appMenus) {
        const sorted = [...appMenus].sort((a: any, b: any) => {
          const aOrder = a.position ?? a.sortOrder ?? 0;
          const bOrder = b.position ?? b.sortOrder ?? 0;
          return aOrder - bOrder;
        });
        setMenus(sorted);
      }
    }
  }

  const handleAddChild = (parentMenu: IGRPMenuItemArgs) => {
    setSelectedMenu({
      ...parentMenu,
      parentCode: parentMenu.code,
      code: '',
      name: '',
      icon: '',
      url: '',
      pageSlug: '',
      type: parentMenu.type === 'GROUP' ? 'FOLDER' : 'MENU_PAGE',
    } as IGRPMenuItemArgs);
    setOpenFormDialog(true);
    setOpenTypeFormDialog(undefined);
  };

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
      code: '',
      name: '',
      icon: 'AppWindow',
      type: 'MENU_PAGE',
      status: 'ACTIVE',
      applicationCode: app.code,
    } as IGRPMenuItemArgs);
    setOpenFormDialog(true);
    setOpenTypeFormDialog(undefined);
  };

  const handleAddExternalPage = (parentMenu: IGRPMenuItemArgs) => {
    setSelectedMenu({
      parentCode: parentMenu.code,
      code: '',
      name: '',
      icon: 'AppWindow',
      type: 'EXTERNAL_PAGE',
      status: 'ACTIVE',
      applicationCode: app.code,
    } as IGRPMenuItemArgs);
    setOpenFormDialog(true);
    setOpenTypeFormDialog(undefined);
  };

  return (
    <div className="pt-6">
      <div className="flex items-center justify-between">
        <div className="mb-3">
          <IGRPCardTitlePrimitive>
            Menus da Aplicação
          </IGRPCardTitlePrimitive>
          <IGRPCardDescriptionPrimitive>
            Gerir e reorganizar os menus desta aplicação.
          </IGRPCardDescriptionPrimitive>
        </div>
        {!menuEmpty && (
          <div className="mb-3 flex justify-end">
            <ButtonLink
              onClick={() => {
                setSelectedMenu(undefined);
                setOpenFormDialog(true);
                setOpenTypeFormDialog(undefined);
              }}
              icon="ListPlus"
              href="#"
              label="Novo Menu"
            />
          </div>
        )}
      </div>

      <div className=" border">
        {menuEmpty ? (
          <div className="text-center py-12 px-4">
            <div className="flex justify-center mb-4">
              <div className="p-4 rounded-full bg-muted">
                <IGRPIcon
                  iconName="ListTree"
                  className="size-10 text-muted-foreground"
                  strokeWidth={1.5}
                />
              </div>
            </div>
            <h3 className="text-lg font-semibold mb-2">
              Nenhum menu encontrado
            </h3>
            <p className="text-muted-foreground mb-6">
              Comece criando o primeiro menu para esta aplicação.
            </p>
            <IGRPButtonPrimitive
              onClick={() => {
                setSelectedMenu(undefined);
                setOpenFormDialog(true);
                setOpenTypeFormDialog(undefined);
              }}
              variant="default"
            >
              <IGRPIcon iconName="Plus" className="mr-2 size-4" />
              Criar Primeiro Menu
            </IGRPButtonPrimitive>
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
              <div>
                {rootMenus.map((menu) => {
                  const childMenus = filteredMenus.filter(
                    (m) => m.parentCode === menu.code,
                  );

                  return (
                    <SortableMenuItem
                      key={menu.code}
                      menu={menu}
                      onView={handleView}
                      onEdit={handleEdit}
                      onAddChild={handleAddChild}
                      onDelete={handleDelete}
                      subMenus={childMenus}
                      allMenus={filteredMenus}
                      onAddInternalPage={handleAddInternalPage}
                      onAddExternalPage={handleAddExternalPage}
                    />
                  );
                })}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>

      <MenuFormDialog
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
        groupMenus={groupMenus}
        folderMenus={folderMenus}
        appCode={app.code}
        openType={openTypeFormDialog}
      />

      {menuToDelete && (
        <MenuDeleteDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          menuToDelete={menuToDelete}
        />
      )}
    </div>
  );
}