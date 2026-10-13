"use client";

import { useRouter } from "next/navigation";
import { useMemo } from "react";

import {
  type IGRPCommandItem,
  IGRPTemplateCommandSearch,
} from "@igrp/framework-next-ui";
import {
  igrpIsExternalUrl,
  igrpNormalizeUrl,
} from "@igrp/igrp-framework-react-design-system";
import { useTranslations } from "next-intl";

import type { AppSearchCommand } from "@/lib/header-search";

interface AppSearchProps {
  commands: AppSearchCommand[];
}

/**
 * Navigation target for a command, resolved the same way the framework sidebar
 * resolves a menu item: `pageSlug` wins over `url`, and a bare slug is given a
 * leading slash.
 */
function resolveHref(command: AppSearchCommand): string {
  if (command.pageSlug) {
    return command.pageSlug.startsWith("/")
      ? command.pageSlug
      : `/${command.pageSlug}`;
  }
  return command.url ? igrpNormalizeUrl(command.url) : "#";
}

/**
 * Whether a command leaves the app. An absolute `url` is NOT external on its
 * own — the mock menus include `/reports`, an internal page addressed by URL
 * rather than by slug. Only a different origin (or an explicit `_blank` target)
 * counts, which is why this runs on click: it compares against the live origin.
 */
function isExternalTarget(command: AppSearchCommand): boolean {
  if (command.target === "_blank") return true;
  return !command.pageSlug && igrpIsExternalUrl(command.url ?? undefined);
}

/**
 * Header search slot: the application's own command palette.
 *
 * Injected via `headerSlots.search` on `IGRPLayoutFull`, which replaces the
 * framework's built-in palette. The server passes serializable command data;
 * the `onSelect` handlers are built here because functions cannot cross the
 * Server→Client boundary.
 */
export function AppSearch({ commands }: AppSearchProps) {
  const router = useRouter();
  const t = useTranslations("header.search");
  const labels = useMemo(
    () => ({
      trigger: t("trigger"),
      placeholder: t("placeholder"),
      empty: t("empty"),
      dialogTitle: t("dialogTitle"),
      dialogDescription: t("dialogDescription"),
    }),
    [t],
  );

  const items = useMemo<IGRPCommandItem[]>(
    () =>
      commands.map((command) => ({
        id: command.id,
        label: command.label,
        icon: command.icon,
        group: command.group,
        onSelect: () => {
          const href = resolveHref(command);
          if (href === "#") return;

          if (isExternalTarget(command)) {
            window.open(href, "_blank", "noopener,noreferrer");
            return;
          }

          router.push(href as Parameters<typeof router.push>[0]);
        },
      })),
    [commands, router],
  );

  return <IGRPTemplateCommandSearch commands={items} labels={labels} />;
}
