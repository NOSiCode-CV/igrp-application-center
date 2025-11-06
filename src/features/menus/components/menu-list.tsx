"use client";

import type {
  IGRPApplicationArgs,
  IGRPMenuCRUDArgs,
} from "@igrp/framework-next-types";
import {
  IGRPButtonPrimitive,
  IGRPCardContentPrimitive,
  IGRPCardDescriptionPrimitive,
  IGRPCardHeaderPrimitive,
  IGRPCardPrimitive,
  IGRPCardTitlePrimitive,
  IGRPIcon,
  useIGRPToast,
} from "@igrp/igrp-framework-react-design-system";
import { useEffect, useState } from "react";
import { ButtonLink } from "@/components/button-link";
import { AppCenterLoading } from "@/components/loading";
import { menuTypeSchema } from "@/features/menus/menu-schemas";
import {
  useMenus,
  // useUpdateMenuPosition,
} from "@/features/menus/use-menus";
import { statusSchema } from "@/schemas/global";
import { MenuDeleteDialog } from "./menu-delete-dialog";
import { MenuFormDialog } from "./menu-form-dialog";
import { SortableItem } from "./menu-sortable-item";

export function MenuList({ app }: { app: IGRPApplicationArgs }) {
  const { code } = app;
  const {
    data: appMenus,
    isLoading,
    error: errorGetMenus,
  } = useMenus({ applicationCode: code });
  // const { mutate: changeOrder } = useUpdateMenuPosition()

  const [menus, setMenus] = useState<IGRPMenuCRUDArgs[]>([]);

  const [openFormDialog, setOpenFormDialog] = useState(false);
  const [openTypeFormDialog, setOpenTypeFormDialog] = useState<
    "edit" | "view" | undefined
  >();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedMenu, setSelectedMenu] = useState<
    IGRPMenuCRUDArgs | undefined
  >(undefined);
  const [menuToDelete, setMenuToDelete] = useState<{
    code: string;
    name: string;
  } | null>(null);

  useEffect(() => {
    if (appMenus) {
      setMenus(appMenus);
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

  function handleView(menu: IGRPMenuCRUDArgs) {
    setSelectedMenu(menu);
    setOpenFormDialog(true);
    setOpenTypeFormDialog("view");
  }

  const handleEdit = (menu: IGRPMenuCRUDArgs) => {
    setSelectedMenu(menu);
    setOpenFormDialog(true);
    setOpenTypeFormDialog("edit");
  };

  const handleDelete = (code: string, name: string) => {
    setMenuToDelete({ code, name });
    setDeleteDialogOpen(true);
  };

  const handlePermissions = (code: string) => {
    setOpenFormDialog(false);
  };

  const filteredMenus = menus.filter(
    (menu) => menu.status !== statusSchema.enum.DELETED,
  );
  const allMenuCode = filteredMenus.map((menu) => menu.code);
  const folderMenus = filteredMenus.filter(
    (menu) => !menu.parentCode && menu.type === menuTypeSchema.enum.FOLDER,
  );
  const menuEmpty = filteredMenus.length === 0;

  return (
    <>
      <IGRPCardPrimitive className="overflow-hidden card-hover gap-3 py-6">
        <IGRPCardHeaderPrimitive>
          <div className="flex items-center justify-between">
            <div>
              <IGRPCardTitlePrimitive>
                Menus da Aplicação
              </IGRPCardTitlePrimitive>
              <IGRPCardDescriptionPrimitive>
                Gerir e reorganizar os menus desta aplicação.
              </IGRPCardDescriptionPrimitive>
            </div>
            {!menuEmpty && (
              <div className="flex justify-end">
                <ButtonLink
                  onClick={() => {
                    setSelectedMenu(undefined);
                    setOpenFormDialog(true);
                  }}
                  icon="ListPlus"
                  href="#"
                  label="Novo Menu"
                />
              </div>
            )}
          </div>
        </IGRPCardHeaderPrimitive>

        <IGRPCardContentPrimitive>
          <div className="rounded-md border">
            {menuEmpty ? (
              <div className="text-center py-8 text-muted-foreground">
                <p className="mb-2">
                  Nenhum menu encontrado para esta aplicação.
                </p>
                <IGRPButtonPrimitive
                  onClick={() => {
                    setSelectedMenu(undefined);
                    setOpenFormDialog(true);
                  }}
                  variant="outline"
                >
                  <IGRPIcon iconName="Plus" className="mr-1 size-4" />
                  Criar Novo Menu
                </IGRPButtonPrimitive>
              </div>
            ) : (
              <div>
                {filteredMenus.map((menu) => {
                  if (menu.parentCode) return null;
                  const childMenus = filteredMenus.filter(
                    (m) => m.parentCode === menu.code,
                  );

                  return (
                    <SortableItem
                      //app={app}
                      key={menu.id}
                      menuCode={menu.code}
                      menu={menu}
                      code={code}
                      onView={handleView}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      onAddPermissions={handlePermissions}
                      subMenus={childMenus}
                    />
                  );
                })}
              </div>
            )}
          </div>
        </IGRPCardContentPrimitive>
      </IGRPCardPrimitive>

      <MenuFormDialog
        open={openFormDialog}
        onOpenChange={(open) => setOpenFormDialog(open)}
        menu={selectedMenu}
        setMenus={setMenus}
        parentMenus={folderMenus}
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
    </>
  );
}
