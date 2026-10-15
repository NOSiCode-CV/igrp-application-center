import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
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
  const isIconOnly =
    size === "icon" || size === "icon-lg" || size === "icon-sm";

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <ButtonLink
            href={href}
            label={isIconOnly ? "" : label}
            // When rendered icon-only, the visible label is blanked, so pass the
            // tooltip text down as the accessible name for the link.
            aria-label={isIconOnly ? label : undefined}
            size={size}
            {...props}
          />
        </TooltipTrigger>
        <TooltipContent>
          <p>{label}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
