"use client";

import { useState } from "react";

import type { IGRPBrandingMode } from "@igrp/framework-next-types";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  cn,
  IGRPIcon,
} from "@igrp/igrp-framework-react-design-system";
import { useTranslations } from "next-intl";
import { useFormContext } from "react-hook-form";

import type { CatalogGroup } from "../catalog";
import type { BrandingFormValues } from "../lib/branding-mapper";
import { BRANDING_DEFAULTS } from "../token-defaults";
import { ColorField } from "./color-field";

/** One collapsible group of colour fields. Forced open while it holds an error. */
export function TokenGroup({
  group,
  mode,
  defaultOpen = false,
}: {
  group: CatalogGroup;
  mode: IGRPBrandingMode;
  defaultOpen?: boolean;
}) {
  const t = useTranslations("branding");
  const { formState } = useFormContext<BrandingFormValues>();
  const [open, setOpen] = useState(defaultOpen);
  const hasError = group.tokens.some(
    (token) => formState.errors.tokens?.[mode]?.[token.name],
  );
  const isOpen = open || hasError;

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setOpen}
      className="rounded-lg border"
    >
      <CollapsibleTrigger className="flex w-full items-center justify-between gap-2 px-4 py-3 text-sm font-medium">
        {t(`groups.${group.key}`)}
        <IGRPIcon
          iconName="ChevronDown"
          className={cn("size-4 transition-transform", isOpen && "rotate-180")}
          aria-hidden="true"
        />
      </CollapsibleTrigger>
      <CollapsibleContent className="grid gap-4 px-4 pb-4 sm:grid-cols-2">
        {group.tokens.map((token) => (
          <ColorField
            key={`${mode}${token.name}`}
            name={`tokens.${mode}.${token.name}`}
            label={t(`tokens.${token.labelKey}`)}
            defaultValue={BRANDING_DEFAULTS[mode][token.name]}
          />
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
}
