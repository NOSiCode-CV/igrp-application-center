"use client";

import { useId, useState } from "react";

import {
  Button,
  Checkbox,
  IGRPIcon,
  Input,
  Label,
  useIGRPToast,
} from "@igrp/igrp-framework-react-design-system";
import { useTranslations } from "next-intl";

interface SensitiveValueDisclosureProps {
  label: string;
  value: string;
  confirmationLabel?: string;
  onConfirmedChange: (confirmed: boolean) => void;
}

/**
 * Shows a value that will never be retrievable again (spec §6.3). Holds it only
 * in props/state — callers must not put it in the query cache. Masked by
 * default so screen-sharing does not leak it; Copy always copies the raw value.
 */
export function SensitiveValueDisclosure({
  label,
  value,
  confirmationLabel,
  onConfirmedChange,
}: SensitiveValueDisclosureProps) {
  const t = useTranslations("common.sensitiveValue");
  const id = useId();
  const [revealed, setRevealed] = useState(false);
  const { igrpToast } = useIGRPToast();

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      igrpToast({
        type: "success",
        title: t("copied"),
        description: t("copiedDescription", { label }),
      });
    } catch {
      igrpToast({
        type: "error",
        title: t("copyFailed"),
        description: t("copyFailedDescription"),
      });
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${id}-value`}>{label}</Label>
        <div className="flex items-center gap-2">
          <Input
            id={`${id}-value`}
            type={revealed ? "text" : "password"}
            value={value}
            readOnly
            className="font-mono"
            aria-describedby={`${id}-help`}
          />
          <Button
            type="button"
            variant="ghost"
            aria-pressed={revealed}
            onClick={() => setRevealed((r) => !r)}
          >
            <IGRPIcon
              iconName={revealed ? "EyeOff" : "Eye"}
              aria-hidden="true"
            />
            {revealed ? t("hide") : t("show")}
          </Button>
          <Button type="button" variant="outline" onClick={copy}>
            <IGRPIcon iconName="Copy" aria-hidden="true" />
            {t("copy")}
          </Button>
        </div>
        <p id={`${id}-help`} className="text-sm text-muted-foreground">
          {t("hint")}
        </p>
      </div>
      <Label
        htmlFor={`${id}-confirm`}
        className="flex cursor-pointer items-center gap-3 rounded-lg border border-border p-3 font-normal"
      >
        <Checkbox
          id={`${id}-confirm`}
          onCheckedChange={(checked) => onConfirmedChange(checked === true)}
        />
        {confirmationLabel ?? t("confirmation")}
      </Label>
    </div>
  );
}
