import Link from 'next/link';
import {
  IGRPButtonPrimitive,
  IGRPTooltipPrimitive,
  IGRPTooltipContentPrimitive,
  IGRPTooltipProviderPrimitive,
  IGRPTooltipTriggerPrimitive,
  IGRPIcon,
} from '@igrp/igrp-framework-react-design-system';

import { cn } from '@/lib/utils';

interface ButtonTooltipProps {
  href: string;
  icon: React.ComponentProps<typeof IGRPIcon>['iconName'];
  label: string;
  className?: string;
}
// TODO: aria accessibility
// TODO: messages
export function ButtonTooltip({ href, icon, label, className }: ButtonTooltipProps) {
  return (
    <IGRPTooltipProviderPrimitive>
      <IGRPTooltipPrimitive>
        <IGRPTooltipTriggerPrimitive asChild>
          <IGRPButtonPrimitive
            variant='ghost'
            size='icon'
            className={cn(
              'hover:bg-primary/90 hover:text-primary-foreground/90 dark:hover:text-accent-foreground dark:hover:bg-accent/50',
              className,
            )}
            asChild
          >
            <Link href={href}>
              <IGRPIcon
                iconName={icon}
                strokeWidth={2}
              />
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
