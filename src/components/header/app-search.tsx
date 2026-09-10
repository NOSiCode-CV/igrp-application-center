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

          // Internal navigation goes through the router, which applies
          // `basePath` — window.open() would not. `typedRoutes: true` types
          // push() against statically known routes, but these hrefs come from
          // the access-management menus at runtime, so this is the boundary
          // where runtime navigation data enters the typed router.
          router.push(href as Parameters<typeof router.push>[0]);
        },
      })),
    [commands, router],
  );

  return <IGRPTemplateCommandSearch commands={items} />;
}
