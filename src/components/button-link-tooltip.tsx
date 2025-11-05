import {
  IGRPTooltipContentPrimitive,
  IGRPTooltipPrimitive,
  IGRPTooltipProviderPrimitive,
  IGRPTooltipTriggerPrimitive,
} from "@igrp/igrp-framework-react-design-system";

import { ButtonLink } from "./button-link";

interface ButtonLinkTooltipProps
  extends React.ComponentProps<typeof ButtonLink> {}

export function ButtonLinkTooltip({
  href,
  label,
  size,
  ...props
}: ButtonLinkTooltipProps) {
  return (
    <IGRPTooltipProviderPrimitive>
      <IGRPTooltipPrimitive>
        <IGRPTooltipTriggerPrimitive asChild>
          <ButtonLink
            href={href}
            label={
              size === "icon" || size === "icon-lg" || size === "icon-sm"
                ? ""
                : label
            }
            size={size}
            {...props}
          />
        </IGRPTooltipTriggerPrimitive>
        <IGRPTooltipContentPrimitive>
          <p>{label}</p>
        </IGRPTooltipContentPrimitive>
      </IGRPTooltipPrimitive>
    </IGRPTooltipProviderPrimitive>
  );
}
