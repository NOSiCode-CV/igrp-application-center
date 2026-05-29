"use client";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  IGRPIcon,
} from "@igrp/igrp-framework-react-design-system";
import type { ApplicationDTO } from "@igrp/platform-access-management-client-ts";
import type { Route } from "next";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";
import { config } from "@/lib/constants";

function resolveHref(app: ApplicationDTO): string {
  if (app.code === "APP_IGRP_CENTER") return "/applications";
  return app.url ?? app.slug ?? "";
}

function resolveImage(picture?: string | null): string | null {
  if (!picture) return null;
  return picture.startsWith("http")
    ? picture
    : new URL(picture, config.minioUrl).toString();
}

function AppRow({ app }: { app: ApplicationDTO }) {
  const imageSrc = resolveImage(app.picture);
  const href = resolveHref(app);
  const isAbsolute = /^https?:\/\//i.test(href);
  const isExternal = app.type === "EXTERNAL" || isAbsolute;
  return (
    <>
      <span className="relative size-6 overflow-hidden rounded-sm flex items-center justify-center shrink-0 bg-muted/30">
        {imageSrc ? (
          <Image
            src={imageSrc}
            alt=""
            fill
            className="object-cover"
            sizes="24px"
          />
        ) : (
          <IGRPIcon iconName="AppWindow" className="size-3.5 text-primary" />
        )}
      </span>
      <span className="flex-1 truncate font-medium">{app.name}</span>
      {app.description && (
        <span className="hidden sm:inline truncate text-xs text-muted-foreground max-w-[40%]">
          {app.description}
        </span>
      )}
      {isExternal && (
        <IGRPIcon
          iconName="ArrowUpRight"
          className="size-3.5 text-muted-foreground shrink-0"
        />
      )}
    </>
  );
}

export function CommandPalette({
  open,
  onOpenChange,
  applications,
  favoriteIds,
  recentIds,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  applications: ApplicationDTO[];
  favoriteIds: Set<number>;
  recentIds: Set<number>;
}) {
  const router = useRouter();

  // ⌘K / Ctrl+K toggles the palette. Registered in the capture phase with
  // stopImmediatePropagation so it pre-empts the framework's built-in
  // command search (IGRPTemplateCommandSearch) that listens on `document`
  // in the bubble phase — otherwise both palettes would open at once.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        e.stopImmediatePropagation();
        onOpenChange(!open);
      }
    };
    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [open, onOpenChange]);

  const { favorites, recent, others } = useMemo(() => {
    const fav: ApplicationDTO[] = [];
    const rec: ApplicationDTO[] = [];
    const oth: ApplicationDTO[] = [];
    for (const app of applications) {
      if (favoriteIds.has(app.id)) fav.push(app);
      else if (recentIds.has(app.id)) rec.push(app);
      else oth.push(app);
    }
    return { favorites: fav, recent: rec, others: oth };
  }, [applications, favoriteIds, recentIds]);

  const launch = (app: ApplicationDTO) => {
    const href = resolveHref(app);
    if (!href) return;
    const isAbsolute = /^https?:\/\//i.test(href);
    const isExternal = app.type === "EXTERNAL" || isAbsolute;
    onOpenChange(false);
    if (isExternal) {
      window.open(href, "_blank", "noopener,noreferrer");
    } else {
      router.push(href as Route);
    }
  };

  // cmdk filters items by their `value` prop. We use code + name +
  // description so typing matches any of them.
  const valueFor = (app: ApplicationDTO) =>
    [app.code, app.name, app.description].filter(Boolean).join(" ");

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Procurar aplicação"
      description="Comece a escrever para filtrar a lista. Use as setas e Enter para abrir."
    >
      <CommandInput placeholder="Pesquisar aplicações…" />
      <CommandList className="max-h-[60vh]">
        <CommandEmpty>Nenhuma aplicação encontrada.</CommandEmpty>
        {favorites.length > 0 && (
          <CommandGroup heading="Favoritos">
            {favorites.map((app) => (
              <CommandItem
                key={app.id}
                value={valueFor(app)}
                onSelect={() => launch(app)}
                className="flex items-center gap-3"
              >
                <AppRow app={app} />
              </CommandItem>
            ))}
          </CommandGroup>
        )}
        {recent.length > 0 && (
          <CommandGroup heading="Recentes">
            {recent.map((app) => (
              <CommandItem
                key={app.id}
                value={valueFor(app)}
                onSelect={() => launch(app)}
                className="flex items-center gap-3"
              >
                <AppRow app={app} />
              </CommandItem>
            ))}
          </CommandGroup>
        )}
        {others.length > 0 && (
          <CommandGroup heading="Todas as Aplicações">
            {others.map((app) => (
              <CommandItem
                key={app.id}
                value={valueFor(app)}
                onSelect={() => launch(app)}
                className="flex items-center gap-3"
              >
                <AppRow app={app} />
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}
