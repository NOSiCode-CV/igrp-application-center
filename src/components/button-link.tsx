'use client';

import Link, { useLinkStatus } from 'next/link';
import {
  IGRPButtonPrimitive,
  IGRPIconProps,
  IGRPIcon,
} from '@igrp/igrp-framework-react-design-system';
import { cn } from '@/lib/utils';

type IGRPBtnProps = React.ComponentProps<typeof IGRPButtonPrimitive>;

export interface ButtonLinkProps extends React.ComponentProps<typeof Link> {
  label?: string;
  icon: IGRPIconProps['iconName'];
  iconClassName?: string;
  variant?: IGRPBtnProps['variant'];
  btnClassName?: string;
}

export function ButtonLink({
  label,
  icon,
  iconClassName,
  variant,
  btnClassName,
  ...props
}: ButtonLinkProps) {
  return (
    <IGRPButtonPrimitive
      asChild
      variant={variant || 'default'}
      className={btnClassName}
    >
      <Link {...props}>
        <LinkLoadingIndicator
          iconName={icon}
          iconClassName={iconClassName}
        />
        {label}
      </Link>
    </IGRPButtonPrimitive>
  );
}

interface LinkLoadingIndicatorProps {
  iconName: IGRPIconProps['iconName'];
  iconClassName?: string;
}

function LinkLoadingIndicator({ iconName, iconClassName }: LinkLoadingIndicatorProps) {
  const { pending } = useLinkStatus();

  const valid = iconName !== null && iconName !== undefined && iconName !== '';

  return (
    <>
      {valid ? (
        <IGRPIcon
          iconName={pending ? 'LoaderCircle' : iconName}
          strokeWidth={2}
          className={cn(iconClassName, pending && 'animate-spin')}
        />
      ) : (
        pending && (
          <IGRPIcon
            iconName='LoaderCircle'
            strokeWidth={2}
            className={cn(iconClassName, pending && 'animate-spin')}
          />
        )
      )}
    </>
  );
}
