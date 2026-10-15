"use client";

import Image from "next/image";
import type { CSSProperties } from "react";

import type { IGRPBrandingMode } from "@igrp/framework-next-types";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  cn,
  Input,
  Label,
} from "@igrp/igrp-framework-react-design-system";
import { useTranslations } from "next-intl";

import type { BrandingFormValues, LogoSlotForm } from "../lib/branding-mapper";
import { previewStyle } from "../lib/live-preview";
import { useObjectUrl } from "./use-object-url";

const TILES = [1, 2, 3, 4, 5] as const;
const TILE_CLASSES: Record<(typeof TILES)[number], string> = {
  1: "bg-app-tile-1 text-app-tile-1-foreground",
  2: "bg-app-tile-2 text-app-tile-2-foreground",
  3: "bg-app-tile-3 text-app-tile-3-foreground",
  4: "bg-app-tile-4 text-app-tile-4-foreground",
  5: "bg-app-tile-5 text-app-tile-5-foreground",
};

function useSlotSrc(slot: LogoSlotForm, mode: IGRPBrandingMode): string {
  return useObjectUrl(mode === "dark" && slot.dark ? slot.dark : slot.light);
}

/**
 * The draft Brand on a panel of real components. Scoped by inline custom
 * properties and its own `dark` class; the page and the rest of the editor keep
 * the saved Brand. Limit: Tailwind `dark:` variants inside follow the page's
 * Mode, not the panel's, when the two differ.
 */
export function LivePreview({
  mode,
  tokens,
  logos,
}: {
  mode: IGRPBrandingMode;
  tokens: Record<string, string>;
  logos: BrandingFormValues["logos"];
}) {
  const t = useTranslations("branding.preview");
  const header = useSlotSrc(logos.header, mode);
  const wide = useSlotSrc(logos.wide, mode);

  return (
    <section
      aria-label={t("title")}
      className={cn(
        "self-start rounded-xl border bg-background p-4 text-foreground lg:sticky lg:top-4",
        mode === "dark" && "dark",
      )}
      style={previewStyle(tokens, mode) as CSSProperties}
    >
      <div aria-hidden="true" inert className="flex flex-col gap-4">
        <div className="flex items-center gap-2 rounded-lg border bg-card p-2">
          {header ? (
            <Image
              src={header}
              alt=""
              width={32}
              height={32}
              unoptimized
              className="size-8 object-contain"
            />
          ) : (
            <span className="size-8 rounded-md bg-primary" aria-hidden="true" />
          )}
          <span className="text-sm font-medium">{t("appName")}</span>
        </div>

        <div className="flex gap-4">
          <div className="flex w-36 shrink-0 flex-col gap-1 rounded-lg bg-sidebar p-2 text-sm text-sidebar-foreground">
            <span className="rounded-md bg-sidebar-active px-2 py-1 text-sidebar-active-foreground">
              {t("menuActive")}
            </span>
            <span className="rounded-md px-2 py-1">{t("menuItem")}</span>
          </div>

          <Card className="min-w-0 flex-1">
            <CardHeader>
              <CardTitle>{t("cardTitle")}</CardTitle>
              <p className="text-sm text-muted-foreground">{t("cardBody")}</p>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex flex-wrap gap-2">
                <Button type="button">{t("primary")}</Button>
                <Button type="button" variant="secondary">
                  {t("secondary")}
                </Button>
                <Button type="button" variant="destructive">
                  {t("destructive")}
                </Button>
              </div>
              <div className="flex flex-col gap-2">
                <Label>{t("fieldLabel")}</Label>
                {/* Static focus look: a real focus would steal it from the editor. */}
                <Input
                  readOnly
                  value={t("fieldValue")}
                  className="border-ring ring-[3px] ring-ring/50"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge className="bg-success text-success-foreground">
                  {t("success")}
                </Badge>
                <Badge className="bg-warning text-warning-foreground">
                  {t("warning")}
                </Badge>
                <Badge className="bg-info text-info-foreground">
                  {t("info")}
                </Badge>
                <Badge className="bg-destructive text-destructive-foreground">
                  {t("danger")}
                </Badge>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge className="bg-success-subtle text-success-subtle-foreground">
                  {t("success")}
                </Badge>
                <Badge className="bg-warning-subtle text-warning-subtle-foreground">
                  {t("warning")}
                </Badge>
                <Badge className="bg-info-subtle text-info-subtle-foreground">
                  {t("info")}
                </Badge>
                <Badge className="bg-destructive-subtle text-destructive-subtle-foreground">
                  {t("danger")}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex gap-2">
          {TILES.map((n) => (
            <span
              key={n}
              className={cn(
                "flex size-10 items-center justify-center rounded-lg text-sm font-semibold",
                TILE_CLASSES[n],
              )}
            >
              {n}
            </span>
          ))}
        </div>

        <div className="flex flex-col items-center gap-3 rounded-lg border bg-card p-6">
          {wide && (
            <Image
              src={wide}
              alt=""
              width={logos.wide.width ?? 160}
              height={logos.wide.height ?? 48}
              unoptimized
              className="h-auto max-h-20 w-auto"
            />
          )}
          <Button type="button" className="w-full">
            {t("login")}
          </Button>
        </div>
      </div>
    </section>
  );
}
