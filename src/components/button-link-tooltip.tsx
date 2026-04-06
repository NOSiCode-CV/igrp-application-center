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
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
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
        </TooltipTrigger>
        <TooltipContent>
          <p>{label}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
