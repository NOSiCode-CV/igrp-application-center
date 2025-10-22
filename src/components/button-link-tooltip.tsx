import {
  IGRPButtonPrimitive,
  IGRPIcon,
  IGRPTooltipContentPrimitive,
  IGRPTooltipPrimitive,
  IGRPTooltipProviderPrimitive,
  IGRPTooltipTriggerPrimitive,
} from "@igrp/igrp-framework-react-design-system";
import Link from "next/link";

import { cn } from "@/lib/utils";

interface ButtonLinkTooltipProps {
  href: string;
  icon: React.ComponentProps<typeof IGRPIcon>["iconName"];
  label: string;
  className?: string;
}
// TODO: instead to use ButtonPrimitive to use ButtonLink
export function ButtonLinkTooltip({
  href,
  icon,
  label,
  className,
}: ButtonLinkTooltipProps) {
  return (
    <IGRPTooltipProviderPrimitive>
      <IGRPTooltipPrimitive>
        <IGRPTooltipTriggerPrimitive asChild>
          <IGRPButtonPrimitive
            variant="ghost"
            size="icon"
            className={cn(
              "hover:bg-primary/90 hover:text-primary-foreground/90 dark:hover:text-accent-foreground dark:hover:bg-accent/50",
              className,
            )}
            asChild
          >
            <Link href={href}>
              <IGRPIcon iconName={icon} strokeWidth={2} />
            </Link>
          </IGRPButtonPrimitive>
        </IGRPTooltipTriggerPrimitive>
        <IGRPTooltipContentPrimitive>
          <p>{label}</p>
        </IGRPTooltipContentPrimitive>
      </IGRPTooltipPrimitive>
    </IGRPTooltipProviderPrimitive>
  );
}
