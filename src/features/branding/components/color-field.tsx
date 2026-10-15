"use client";

import {
  Button,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  IGRPIcon,
  Input,
} from "@igrp/igrp-framework-react-design-system";
import { useTranslations } from "next-intl";
import { useFormContext } from "react-hook-form";

import type { BrandingFormValues } from "../lib/branding-mapper";
import { toHex } from "../lib/color-normalize";

type TokenPath = `tokens.${"light" | "dark"}.${string}`;

export function ColorField({
  name,
  label,
  defaultValue,
}: {
  name: TokenPath;
  label: string;
  defaultValue: string;
}) {
  const t = useTranslations("branding.actions");
  const { control, setFocus } = useFormContext<BrandingFormValues>();
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => {
        const value = typeof field.value === "string" ? field.value : "";
        const shown = value || defaultValue;
        return (
          <FormItem>
            <FormLabel>{label}</FormLabel>
            <div className="flex items-center gap-2">
              {/* The swatch is the one place a raw colour is rendered (spec §10.6). */}
              <label
                className="relative size-8 shrink-0 cursor-pointer rounded-md border has-[input:focus-visible]:ring-[3px] has-[input:focus-visible]:ring-ring/50"
                style={{ backgroundColor: shown }}
              >
                <input
                  type="color"
                  className="sr-only"
                  aria-label={t("pickColor", { token: label })}
                  value={toHex(shown)}
                  onChange={(e) => field.onChange(e.target.value)}
                />
              </label>
              <FormControl>
                <Input
                  {...field}
                  value={value}
                  placeholder={defaultValue}
                  spellCheck={false}
                  autoComplete="off"
                  className="font-mono text-xs"
                />
              </FormControl>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                disabled={!value}
                aria-label={t("clear", { token: label })}
                onClick={() => {
                  field.onChange("");
                  setFocus(name);
                }}
              >
                <IGRPIcon
                  iconName="RotateCcw"
                  className="size-4"
                  aria-hidden="true"
                />
              </Button>
            </div>
            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
}
