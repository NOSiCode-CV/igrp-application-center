"use client";

import {
  IGRPBadgePrimitive,
  IGRPCardContentPrimitive,
  IGRPCardDescriptionPrimitive,
  IGRPCardHeaderPrimitive,
  IGRPCardPrimitive,
  IGRPCardTitlePrimitive,
  IGRPSeparatorPrimitive,
  type IGRPTabItem,
  IGRPTabs,
} from "@igrp/igrp-framework-react-design-system";

import { ButtonLink } from "@/components/button-link";
import { CopyToClipboard } from "@/components/copy-to-clipboard";
import { AppCenterLoading } from "@/components/loading";
import { AppCenterNotFound } from "@/components/not-found";
import { PageHeader } from "@/components/page-header";
import { useApplicationByCode } from "@/features/applications/use-applications";
import { MenuList } from "@/features/menus/components/menu-list";
import { ROUTES } from "@/lib/constants";
import { formatDate, statusClass } from "@/lib/utils";

// TOD: implement upload app image

export function ApplicationDetails({ code }: { code: string }) {
  const { data: app, isLoading, error } = useApplicationByCode(code);

  if (isLoading) {
    return (
      <AppCenterLoading descrption="A carregar aplicação através do código..." />
    );
  }

  if (error) throw error;

  if (!app) {
    return (
      <AppCenterNotFound
        iconName="AppWindow"
        title="Nenhuma aplicação encontrada."
      />
    );
  }

  const { name, owner, type, slug, url, createdDate, description, status } =
    app;

  const slugLbl = type === "INTERNAL" ? "Slug" : "Url";
  const slugValue = type === "INTERNAL" ? slug : url;

  const tabItems: IGRPTabItem[] = [
    {
      label: "Menus",
      value: "menus",
      content: <MenuList app={app} />,
    },
  ];

  return (
    <section className="flex flex-col gap-10 animate-fade-in">
      <div className="flex flex-col gap-6">
        <PageHeader
          title={app.name}
          showBackButton
          linkBackButton={ROUTES.APPLICATIONS}
          showActions
        >
          <ButtonLink
            href={`${ROUTES.APPLICATIONS}/${code}/${ROUTES.EDIT}`}
            label="Editar Aplicação"
            icon="Pencil"
          />
        </PageHeader>

        <div className="flex flex-col gap-8 animate-fade-in motion-reduce:hidden">
          <IGRPCardPrimitive className="overflow-hidden card-hover gap-3 py-6">
            <IGRPCardHeaderPrimitive>
              <IGRPCardTitlePrimitive>
                Informação da Aplicação
              </IGRPCardTitlePrimitive>
              <IGRPCardDescriptionPrimitive>
                Informações detalhadas da aplicação.
              </IGRPCardDescriptionPrimitive>
              <IGRPSeparatorPrimitive className="my-2" />
            </IGRPCardHeaderPrimitive>
            <IGRPCardContentPrimitive className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center gap-4">
                <div>
                  <h3 className="font-normal text-muted-foreground">Nome</h3>
                  <p className="font-medium">{name}</p>
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
                <h3 className=" font-normal text-muted-foreground">
                  Proprietário
                </h3>
                <p>{owner}</p>
              </div>
              <div>
                <h3 className="font-normal text-muted-foreground">Estado</h3>
                <IGRPBadgePrimitive className={statusClass(status || "ACTIVE")}>
                  {status}
                </IGRPBadgePrimitive>
              </div>
              <div className="flex items-center gap-4">
                <div>
                  <h3 className="font-normal text-muted-foreground">
                    {slugLbl}
                  </h3>
                  <p className="font-mono">{slugValue}</p>
                </div>
                <CopyToClipboard value={slugValue || "#"} />
              </div>
              <div>
                <div>
                  <h3 className="font-normal text-muted-foreground">
                    Criado em
                  </h3>
                  <p>{formatDate(createdDate || new Date().toISOString())}</p>
                </div>
              </div>
              <div className="sm:col-span-2 lg:col-span-3">
                <h3 className="font-normal text-muted-foreground text-balance">
                  Descrição
                </h3>
                <p>{description || "Sem descrição."}</p>
              </div>
            </IGRPCardContentPrimitive>
          </IGRPCardPrimitive>
        </div>
      </div>

      <IGRPTabs
        defaultValue="menus"
        className="flex flex-col gap-4"
        items={tabItems}
      />
    </section>
  );
}
