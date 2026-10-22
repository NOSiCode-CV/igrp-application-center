"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import type { IGRPMenuItemArgs } from "@igrp/framework-next-types";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  cn,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  FieldLegend,
  FieldSeparator,
  FieldSet,
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  IGRPButton,
  IGRPIcon,
  Input,
  ScrollArea,
  Switch,
  useIGRPToast,
} from "@igrp/igrp-framework-react-design-system";
import type { CreateMenuRequest } from "@igrp/platform-access-management-client-ts";
import { useTranslations } from "next-intl";
import {
  type Control,
  type Resolver,
  useForm,
  useWatch,
} from "react-hook-form";

import {
  useCreateMenu,
  useUpdateMenu,
} from "@/features/applications/use-applications";
import { getNextMenuPosition } from "@/features/menus/menu-constants";
import {
  type CreateMenu,
  type MenuTypeArgs,
  makeMenuSchemas,
  menuCodeFromName,
  menuTargetSchema,
  menuTypeSchema,
  normalizeMenu,
  sanitizeMenuCode,
  type UpdateMenu,
} from "@/features/menus/menu-schemas";
import { statusSchema } from "@/schemas/global";

import { MenuIconPicker } from "./menu-icon-picker";
import { MenuPageConfigFields } from "./menu-page-config-fields";
import { MenuParentCombobox } from "./menu-parent-combobox";
import { MenuTypeSelector } from "./menu-type-selector";

interface MenuFormDialogProps {
  appCode: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  setMenus: React.Dispatch<React.SetStateAction<IGRPMenuItemArgs[]>>;
  allMenus: IGRPMenuItemArgs[];
  menu?: IGRPMenuItemArgs;
  groupMenus: IGRPMenuItemArgs[];
  folderMenus: IGRPMenuItemArgs[];
  openType?: "edit" | "view";
}

const TYPE_SUFFIX = {
  GROUP: "Group",
  FOLDER: "Folder",
  MENU_PAGE: "Page",
  EXTERNAL_PAGE: "Page",
} as const;

export function MenuFormDialog({
  appCode,
  open,
  onOpenChange,
  menu,
  groupMenus,
  folderMenus,
  allMenus,
  openType,
  setMenus,
}: MenuFormDialogProps) {
  const t = useTranslations("menus.dialog");
  const isEditMode = openType === "edit" && Boolean(menu?.code);
  const isPrefilledCreate = Boolean(menu) && !isEditMode && openType !== "view";
  const [step, setStep] = useState<"type" | "form">(menu ? "form" : "type");
  const [createType, setCreateType] = useState<MenuTypeArgs>(
    menuTypeSchema.enum.GROUP,
  );

  useEffect(() => {
    if (!open) {
      setStep(menu ? "form" : "type");
      setCreateType(menuTypeSchema.enum.GROUP);
    }
  }, [open, menu]);

  const parentName = isPrefilledCreate
    ? allMenus.find((m) => m.code === menu?.parentCode)?.name
    : undefined;

  const dialogTitle =
    openType === "view"
      ? t("viewTitle")
      : isEditMode
        ? t("editTitle")
        : isPrefilledCreate
          ? menu?.type === "FOLDER"
            ? t("addFolderTitle")
            : t("addPageTitle")
          : step === "type"
            ? t("newTitle")
            : t(`new${TYPE_SUFFIX[createType]}Title`);

  const dialogDescription =
    openType === "view"
      ? t("viewDescription")
      : isEditMode
        ? t("editDescription")
        : parentName
          ? t("addToParent", { parent: parentName })
          : step === "type"
            ? t("selectTypeDescription")
            : t("createDescription");

  const formKey = isEditMode
    ? `edit-${menu?.code}`
    : `create-${menu?.parentCode ?? "root"}-${step}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="gap-0 p-0 sm:max-w-2xl">
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle>{dialogTitle}</DialogTitle>
          <DialogDescription>{dialogDescription}</DialogDescription>
        </DialogHeader>

        {step === "type" && !menu ? (
          <MenuTypeStep
            value={createType}
            onCancel={() => onOpenChange(false)}
            onSelect={(type) => {
              setCreateType(type);
              setStep("form");
            }}
          />
        ) : (
          <MenuFormBody
            key={formKey}
            appCode={appCode}
            allMenus={allMenus}
            menu={menu}
            initialType={createType}
            groupMenus={groupMenus}
            folderMenus={folderMenus}
            openType={openType}
            isEditMode={isEditMode}
            setMenus={setMenus}
            onOpenChange={onOpenChange}
            onBack={!menu ? () => setStep("type") : undefined}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function MenuTypeStep({
  value,
  onCancel,
  onSelect,
}: {
  value: MenuTypeArgs;
  onCancel: () => void;
  onSelect: (type: MenuTypeArgs) => void;
}) {
  const tc = useTranslations("common.actions");
  return (
    <div className="flex flex-col gap-6 px-6 pb-6">
      <MenuTypeSelector
        value={value}
        onChange={(nextValue) => onSelect(nextValue as MenuTypeArgs)}
      />
      <div className="flex justify-end">
        <IGRPButton type="button" variant="outline" onClick={onCancel}>
          {tc("cancel")}
        </IGRPButton>
      </div>
    </div>
  );
}

interface MenuFormBodyProps {
  appCode: string;
  allMenus: IGRPMenuItemArgs[];
  menu?: IGRPMenuItemArgs;
  initialType: MenuTypeArgs;
  groupMenus: IGRPMenuItemArgs[];
  folderMenus: IGRPMenuItemArgs[];
  openType?: "edit" | "view";
  isEditMode: boolean;
  setMenus: React.Dispatch<React.SetStateAction<IGRPMenuItemArgs[]>>;
  onOpenChange: (open: boolean) => void;
  onBack?: () => void;
}

function MenuFormBody({
  appCode,
  allMenus,
  menu,
  initialType,
  groupMenus,
  folderMenus,
  openType,
  isEditMode,
  setMenus,
  onOpenChange,
  onBack,
}: MenuFormBodyProps) {
  const t = useTranslations("menus.form");
  const tv = useTranslations("menus.validation");
  const tc = useTranslations("common.actions");
  const { igrpToast } = useIGRPToast();
  const { mutateAsync: createMenuAsync } = useCreateMenu();
  const { mutateAsync: updateMenu } = useUpdateMenu();
  const isViewMode = openType === "view";
  const isCreate = !isEditMode && !isViewMode;
  const td = useTranslations("menus.dialog.discard");
  const codeEdited = useRef(false);
  const [confirmBack, setConfirmBack] = useState(false);

  const schemas = useMemo(() => makeMenuSchemas(tv), [tv]);

  const defaultParentCode = menu?.parentCode ?? undefined;
  const lockedParentCode = isCreate ? defaultParentCode : undefined;

  const form = useForm<CreateMenu>({
    resolver: zodResolver(
      isEditMode ? schemas.updateMenuSchema : schemas.createMenuSchema,
    ) as Resolver<CreateMenu>,
    defaultValues: {
      name: "",
      code: "",
      type: menuTypeSchema.enum.GROUP,
      position: 0,
      icon: "AppWindow",
      status: statusSchema.enum.ACTIVE,
      applicationCode: appCode,
      parentCode: defaultParentCode,
    } as CreateMenu,
  });

  const { reset } = form;
  const menuType = form.watch("type");
  const isLoading = form.formState.isSubmitting;
  const isDirty = form.formState.isDirty;

  const isPageType =
    menuType === menuTypeSchema.enum.MENU_PAGE ||
    menuType === menuTypeSchema.enum.EXTERNAL_PAGE;

  useEffect(() => {
    if (menu) {
      reset({
        name: menu.name ?? "",
        code: menu.code ?? "",
        type: (menu.type ?? menuTypeSchema.enum.GROUP) as MenuTypeArgs,
        position: menu.position ?? 0,
        icon: menu.icon ?? "AppWindow",
        status: menu.status ?? statusSchema.enum.ACTIVE,
        target: menu.target ?? menuTargetSchema.enum._self,
        url: menu.url ?? undefined,
        parentCode: menu.parentCode ?? undefined,
        applicationCode: menu.applicationCode ?? appCode,
        pageSlug: menu.pageSlug ?? undefined,
      } as CreateMenu);
      return;
    }

    reset({
      name: "",
      code: "",
      type: initialType,
      position: 0,
      icon: "AppWindow",
      status: statusSchema.enum.ACTIVE,
      applicationCode: appCode,
    } as CreateMenu);
  }, [menu, appCode, initialType, reset]);

  async function onSubmit(values: CreateMenu) {
    try {
      if (isEditMode && menu?.code) {
        const update = normalizeMenu(values as UpdateMenu);
        const result = await updateMenu({
          appCode,
          menuCode: menu.code,
          data: update,
        });

        if (!result.success) {
          throw new Error(result.error);
        }

        setMenus((prevMenus) =>
          prevMenus.map((m) =>
            m.code === menu.code
              ? ({ ...m, ...result.data } as IGRPMenuItemArgs)
              : m,
          ),
        );

        igrpToast({
          type: "success",
          title: t("toasts.updatedTitle"),
          description: t("toasts.updated"),
          duration: 6000,
        });
      } else {
        const parentCode = lockedParentCode ?? values.parentCode ?? undefined;
        const createValues = {
          ...values,
          parentCode,
          position: getNextMenuPosition(allMenus, parentCode),
        };
        const create = normalizeMenu(createValues);
        const result = await createMenuAsync({
          appCode,
          menu: create as CreateMenuRequest,
        });

        if (!result.success) {
          throw new Error(result.error);
        }

        setMenus((prev) => [...prev, result.data as IGRPMenuItemArgs]);

        igrpToast({
          type: "success",
          title: t("toasts.createdTitle"),
          description: t("toasts.created"),
          duration: 6000,
        });
      }

      reset();
      onOpenChange(false);
    } catch (err) {
      igrpToast({
        type: "error",
        title: t("toasts.errorTitle"),
        description: err instanceof Error ? err.message : t("toasts.error"),
        duration: 6000,
      });
    }
  }

  const showParentSelect =
    menuType === menuTypeSchema.enum.FOLDER
      ? groupMenus.length > 0
      : isPageType && (groupMenus.length > 0 || folderMenus.length > 0);

  function handleBack() {
    if (!onBack) return;
    if (isDirty) {
      setConfirmBack(true);
      return;
    }
    onBack();
  }

  const submitLabel = isEditMode
    ? t("update")
    : t(`create${TYPE_SUFFIX[menuType as keyof typeof TYPE_SUFFIX] ?? "Page"}`);

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex min-h-0 flex-col"
      >
        <ScrollArea className="max-h-[65vh] px-6">
          <div className="flex flex-col gap-6 pt-1 pb-6">
            <MenuRowPreview
              control={form.control}
              allMenus={allMenus}
              lockedParentCode={lockedParentCode}
            />
            <FieldSet>
              <FieldLegend variant="label">{t("sections.details")}</FieldLegend>
              <div className="grid grid-cols-1 items-start gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className='after:content-["*"] after:text-destructive'>
                        {t("name")}
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t("namePlaceholder")}
                          autoComplete="off"
                          {...field}
                          onChange={(e) => {
                            field.onChange(e);
                            if (isCreate && !codeEdited.current) {
                              form.setValue(
                                "code",
                                menuCodeFromName(e.target.value),
                                { shouldValidate: form.formState.isSubmitted },
                              );
                            }
                          }}
                          disabled={isViewMode}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className='after:content-["*"] after:text-destructive'>
                        {t("code")}
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t("codePlaceholder")}
                          autoComplete="off"
                          spellCheck={false}
                          {...field}
                          onChange={(e) => {
                            const code = sanitizeMenuCode(e.target.value);
                            // Clearing the field hands it back to the name.
                            codeEdited.current = code !== "";
                            field.onChange(code);
                          }}
                          disabled={isViewMode || isEditMode}
                        />
                      </FormControl>
                      {!isViewMode && (
                        <FormDescription>
                          {isEditMode ? t("codeLocked") : t("codeHint")}
                        </FormDescription>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </FieldSet>

            {isPageType && (
              <>
                <FieldSeparator />
                <MenuPageConfigFields
                  form={form}
                  menuType={menuType}
                  disabled={isViewMode}
                />
              </>
            )}

            {showParentSelect && (
              <>
                <FieldSeparator />
                <FieldSet>
                  <FieldLegend variant="label">
                    {t("sections.location")}
                  </FieldLegend>
                  <MenuParentCombobox
                    control={form.control}
                    menuType={menuType}
                    groupOptions={groupMenus}
                    folderOptions={folderMenus}
                    disabled={isViewMode}
                    locked={Boolean(lockedParentCode)}
                  />
                </FieldSet>
              </>
            )}

            <FieldSeparator />
            <FieldSet>
              <FieldLegend variant="label">
                {t("sections.appearance")}
              </FieldLegend>
              <div className="grid grid-cols-1 items-start gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="icon"
                  render={({ field }) => (
                    <MenuIconPicker
                      value={field.value}
                      onChange={field.onChange}
                      disabled={isViewMode}
                    />
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => {
                    const isActive = field.value === statusSchema.enum.ACTIVE;
                    return (
                      <FormItem>
                        <FormLabel htmlFor="menu-status-switch">
                          {t("status")}
                        </FormLabel>
                        <div className="flex h-9 items-center gap-3">
                          <FormControl>
                            <Switch
                              id="menu-status-switch"
                              checked={isActive}
                              onCheckedChange={(checked) =>
                                field.onChange(
                                  checked
                                    ? statusSchema.enum.ACTIVE
                                    : statusSchema.enum.INACTIVE,
                                )
                              }
                              disabled={isViewMode}
                            />
                          </FormControl>
                          <span className="text-sm text-muted-foreground">
                            {isActive ? t("statusActive") : t("statusInactive")}
                          </span>
                        </div>
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />
              </div>
            </FieldSet>
          </div>
        </ScrollArea>

        <DialogFooter className="gap-2 px-6 pt-2 pb-6">
          <div className="flex-1">
            {onBack && (
              <IGRPButton
                type="button"
                variant="secondary"
                onClick={handleBack}
                disabled={isLoading}
                iconName="ArrowLeft"
                showIcon
              >
                {tc("back")}
              </IGRPButton>
            )}
          </div>
          {isViewMode ? (
            <IGRPButton
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              iconName="X"
              showIcon
            >
              {t("close")}
            </IGRPButton>
          ) : (
            <>
              <IGRPButton
                type="button"
                variant="secondary"
                onClick={() => {
                  reset();
                  onOpenChange(false);
                }}
                disabled={isLoading}
                iconName="Undo2"
                showIcon
              >
                {tc("cancel")}
              </IGRPButton>
              <IGRPButton
                iconName={isLoading ? "LoaderCircle" : "Save"}
                showIcon
                type="submit"
                disabled={isLoading}
                iconPlacement="end"
              >
                {isLoading ? t("saving") : submitLabel}
              </IGRPButton>
            </>
          )}
        </DialogFooter>
      </form>

      <AlertDialog open={confirmBack} onOpenChange={setConfirmBack}>
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>{td("title")}</AlertDialogTitle>
            <AlertDialogDescription>{td("description")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{td("keep")}</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                setConfirmBack(false);
                onBack?.();
              }}
            >
              {td("confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Form>
  );
}

const PREVIEW_TYPE_ICON: Record<string, string> = {
  GROUP: "FolderTree",
  FOLDER: "Folder",
  MENU_PAGE: "FileText",
  EXTERNAL_PAGE: "ExternalLink",
};

/**
 * The menu as it will sit in the tree, updated while the form is filled:
 * chosen icon, name, page address and the path of parents above it.
 */
function MenuRowPreview({
  control,
  allMenus,
  lockedParentCode,
}: {
  control: Control<CreateMenu>;
  allMenus: IGRPMenuItemArgs[];
  lockedParentCode?: string;
}) {
  const t = useTranslations("menus.form.preview");
  const [name, icon, type, parentCode, pageSlug, url] = useWatch({
    control,
    name: ["name", "icon", "type", "parentCode", "pageSlug", "url"],
  });

  const path: string[] = [];
  let current = lockedParentCode ?? parentCode ?? null;
  while (current && path.length < 4) {
    const parent = allMenus.find((m) => m.code === current);
    if (!parent) break;
    path.unshift(parent.name);
    current = parent.parentCode ?? null;
  }
  const address = type === "EXTERNAL_PAGE" ? url : pageSlug;

  return (
    <section
      aria-label={t("label")}
      className="flex items-center gap-3 rounded-md border bg-muted/30 px-3 py-2.5"
    >
      <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-background text-muted-foreground shadow-xs">
        <IGRPIcon
          iconName={icon || PREVIEW_TYPE_ICON[type] || "FileText"}
          className="size-4"
        />
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="flex min-w-0 items-baseline gap-3">
          <span
            className={cn(
              "truncate text-sm",
              name ? "font-medium" : "italic text-muted-foreground",
            )}
          >
            {name || t("untitled")}
          </span>
          {address && (
            <span className="truncate text-xs text-muted-foreground">
              {address}
            </span>
          )}
        </span>
        <span className="truncate text-xs text-muted-foreground">
          {path.length > 0 ? path.join(" / ") : t("topLevel")}
        </span>
      </span>
    </section>
  );
}
