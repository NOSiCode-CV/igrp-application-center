"use client";

import Image from "next/image";
import { useCallback, useMemo } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  FormField,
  IGRPButton,
} from "@igrp/igrp-framework-react-design-system";
import { useTranslations } from "next-intl";
import { useFormContext } from "react-hook-form";

import { FileUploadField } from "@/components/file-upload-field";
import type { FileWithPreview } from "@/features/files/use-file-upload";

import type { BrandingFormValues, LogoSlotKey } from "../lib/branding-mapper";
import { FAVICON_ACCEPT } from "../lib/branding-rules";
import { readImageSize } from "../lib/image-size";
import { useObjectUrl } from "./use-object-url";

type Variant = "light" | "dark";

export function LogoField({ slot }: { slot: LogoSlotKey }) {
  const t = useTranslations("branding.logos");
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t(`${slot}.title`)}</CardTitle>
        <CardDescription>{t(`${slot}.description`)}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2">
        <LogoVariant slot={slot} variant="light" />
        <LogoVariant slot={slot} variant="dark" />
      </CardContent>
    </Card>
  );
}

function LogoVariant({
  slot,
  variant,
}: {
  slot: LogoSlotKey;
  variant: Variant;
}) {
  const t = useTranslations("branding.logos");
  const { control, getValues, resetField, setValue, watch } =
    useFormContext<BrandingFormValues>();
  const name = `logos.${slot}.${variant}` as const;
  const value = watch(name);
  const url = useObjectUrl(value);

  const picked = useMemo<FileWithPreview | null>(
    () =>
      value instanceof File
        ? { id: `${slot}-${variant}`, file: value, preview: url }
        : null,
    [value, url, slot, variant],
  );

  // FileUploadField calls onChange on every render and with null on mount:
  // ignore repeats, and only a null after a pick goes back to the saved image.
  const onChange = useCallback(
    async (next: FileWithPreview | null) => {
      const current = getValues(name);
      const file = next?.file instanceof File ? next.file : null;
      if (!file) {
        if (current instanceof File) {
          resetField(name);
          if (slot === "wide" && variant === "light") {
            resetField("logos.wide.width");
            resetField("logos.wide.height");
          }
        }
        return;
      }
      if (file === current) return;
      setValue(name, file, { shouldDirty: true, shouldValidate: true });
      if (slot === "wide" && variant === "light") {
        const size = await readImageSize(file);
        setValue("logos.wide.width", size?.width, { shouldDirty: true });
        setValue("logos.wide.height", size?.height, { shouldDirty: true });
      }
    },
    [getValues, name, resetField, setValue, slot, variant],
  );

  return (
    <FormField
      control={control}
      name={name}
      render={() => (
        <div className="flex flex-col gap-2">
          {typeof value === "string" && value !== "" && (
            <div className="flex items-center gap-3 rounded-lg border p-2">
              <Image
                src={value}
                alt={t("current")}
                width={48}
                height={48}
                unoptimized
                className="size-12 rounded-md object-contain"
              />
              <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground">
                {value}
              </span>
              <IGRPButton
                type="button"
                variant="ghost"
                onClick={() =>
                  setValue(name, "", {
                    shouldDirty: true,
                    shouldValidate: true,
                  })
                }
              >
                {t("remove")}
              </IGRPButton>
            </div>
          )}
          {/* Remount when the value stops being a pick (Descartar, Repor, post-save
              reset): FileUploadField keeps its own file list and would re-emit it. */}
          <FileUploadField
            key={value instanceof File ? "picked" : "saved"}
            value={picked}
            onChange={onChange}
            label={t(variant)}
            placeholder={t("drop")}
            btnLabel={t("pick")}
            accept={slot === "favicon" ? FAVICON_ACCEPT : undefined}
            maxSizeMB={slot === "favicon" ? 0.25 : 1}
          />
        </div>
      )}
    />
  );
}
