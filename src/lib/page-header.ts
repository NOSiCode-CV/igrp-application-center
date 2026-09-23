import type { IGRPPageHeaderProps } from "@igrp/igrp-framework-react-design-system";

/**
 * The house look for `IGRPPageHeader`, spread into every settings page header:
 * `<IGRPPageHeader {...PAGE_HEADER_PROPS} title="…" />`.
 *
 * `IGRPHeadline` hard-codes its heading size (`h1` → `text-4xl lg:text-5xl`)
 * and a `text-primary` colour, and exposes no class for the heading itself, so
 * the title and description are restyled from the headline wrapper through
 * descendant selectors — `.wrapper h1` outranks the heading's own classes at
 * every breakpoint.
 */
export const PAGE_HEADER_PROPS = {
  /* `h1`: this is the page title, and no layout above these routes renders
     one. Each page uses it exactly once. */
  variant: "h1",
  /* Stacks until `md`, like the rest of the settings toolbars; the design
     system's default breaks to a row at `sm`. */
  className:
    "items-stretch sm:flex-col sm:items-stretch md:flex-row md:items-center",
  pageHeaderContentClassName: "min-w-0",
  headlineClassName:
    "min-w-0 text-foreground [&_h1]:truncate [&_h1]:text-2xl [&_h1]:font-bold [&_p]:text-muted-foreground",
  headlineContentClassName: "min-w-0",
  backButtonVariant: "ghost",
  backButtonSize: "sm",
  backButtonClassName: "h-8 gap-1 px-2",
  backButtonAriaLabel: "Voltar",
} satisfies Partial<IGRPPageHeaderProps>;

/** Wrapper for the header's right-hand actions. */
export const PAGE_HEADER_ACTIONS_CLASS =
  "flex flex-col gap-2 sm:flex-row sm:items-center";
