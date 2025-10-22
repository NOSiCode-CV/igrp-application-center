"use client";

import {
  IGRPBadge,
  IGRPCardContentPrimitive,
  IGRPCardDescriptionPrimitive,
  IGRPCardHeaderPrimitive,
  IGRPCardPrimitive,
  IGRPCardTitlePrimitive,
  IGRPSeparatorPrimitive,
  type IGRPTabItem,
  IGRPTabs,
} from "@igrp/igrp-framework-react-design-system";
import { CopyToClipboard } from "@/components/copy-to-clipboard";
import { AppCenterLoading } from "@/components/loading";
import { AppCenterNotFound } from "@/components/not-found";
import { PageHeader } from "@/components/page-header";
import { PermissionList } from "@/features/permission/components/permission-list";
import { ROUTES } from "@/lib/constants";
import { RolesList } from "../../roles/components/role-list";
import { useDepartmentByCode } from "../use-departments";

// TODO: See user to create a conetext for get the user all time the user is login
export function DepartmentDetails({ code }: { code: string }) {
  const { data: department, isLoading, error } = useDepartmentByCode(code);
  const {
    data: parentDept,
    isLoading: loadingParentDept,
    error: parentDeptError,
  } = useDepartmentByCode(department?.parent_code);

  if (isLoading)
    return <AppCenterLoading descrption="A carregar departamento..." />;

  if (error) throw error;

  if (!department) {
    return (
      <AppCenterNotFound
        iconName="AppWindow"
        title="Nenhum departamento encontrada."
      />
    );
  }

  const { name, description, status } = department;

  let parentName: string | undefined;

  if (loadingParentDept) parentName = "A carregar...";
  if (parentDeptError) parentName = "Erro ao carregar Departamento Pai.";
  parentName = parentDept?.name;

  const tabs: IGRPTabItem[] = [
    {
      label: "Perfis (Roles)",
      value: "roles",
      content: <RolesList departmentCode={code} />,
    },
    {
      label: "Permissões",
      value: "permissions",
      content: <PermissionList departmentCode={code} />,
    },
  ];

  return (
    <div className="flex flex-col gap-10 animate-fade-in">
      <div className="flex flex-col gap-6">
        <PageHeader
          title={name}
          showBackButton
          linkBackButton={ROUTES.DEPARTMENTS}
        />
      </div>

      <div className="flex flex-col gap-8 animate-fade-in motion-reduce:hidden">
        <IGRPCardPrimitive className="overflow-hidden card-hover gap-3 py-6">
          <IGRPCardHeaderPrimitive>
            <IGRPCardTitlePrimitive>
              Informação de Departamento
            </IGRPCardTitlePrimitive>
            <IGRPCardDescriptionPrimitive>
              Informações detalhadas do departamento.
            </IGRPCardDescriptionPrimitive>
            <IGRPSeparatorPrimitive className="my-2" />
          </IGRPCardHeaderPrimitive>
          <IGRPCardContentPrimitive>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center gap-4">
                <div>
                  <h3 className="font-normal text-muted-foreground">Nome</h3>
                  <p className="font-medium text-base">{name}</p>
                </div>
                <CopyToClipboard value={name} />
              </div>

              <div className="flex items-center gap-4">
                <div>
                  <h3 className="font-normal text-muted-foreground">Código</h3>
                  <p className="font-medium">{code}</p>
                </div>
                <CopyToClipboard value={code} />
              </div>

              <div>
                <h3 className="font-normal text-muted-foreground">Estado</h3>
                <IGRPBadge
                  variant="solid"
                  color={status === "ACTIVE" ? "success" : "destructive"}
                >
                  {status}
                </IGRPBadge>
              </div>

              <div>
                <h3 className="font-normal text-muted-foreground">
                  Departamento Pai
                </h3>
                <p className="font-medium">{parentName || "N/A"}</p>
              </div>

              <div className="sm:col-span-2 lg:col-span-2">
                <h3 className="font-normal text-muted-foreground text-balance">
                  Descrição
                </h3>
                <p>{description || "Sem descrição."}</p>
              </div>
            </div>
          </IGRPCardContentPrimitive>
        </IGRPCardPrimitive>
      </div>

      <IGRPTabs
        defaultValue="roles"
        items={tabs}
        className="min-w-0"
        tabContentClassName="px-0"
      />
    </div>
  );
}
