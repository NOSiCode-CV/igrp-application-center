"use client";

import Link, { useLinkStatus } from "next/link";

import {
  Button,
  cn,
  IGRPIcon,
  type IGRPIconProps,
} from "@igrp/igrp-framework-react-design-system";

type IGRPBtnProps = React.ComponentProps<typeof Button>;

export interface ButtonLinkProps extends React.ComponentProps<typeof Link> {
  label?: string;
  icon: IGRPIconProps["iconName"];
  iconClassName?: string;
  customIcon?: React.ReactNode;
  variant?: IGRPBtnProps["variant"];
  btnClassName?: string;
  size?: IGRPBtnProps["size"];
  "aria-label"?: string;
}

export function ButtonLink({
  label,
  icon,
  iconClassName,
  variant,
  btnClassName,
  size,
  "aria-label": ariaLabel,
  ...props
}: ButtonLinkProps) {
 
  const linkAriaLabel = label ? ariaLabel : (ariaLabel ?? label);

  return (
    <Button
      asChild
      variant={variant || "default"}
      className={btnClassName}
      size={size}
    >
      <Link aria-label={linkAriaLabel} {...props}>
        <LinkLoadingIndicator iconName={icon} iconClassName={iconClassName} />
        {label}
      </Link>
    </Button>
  );
}

interface LinkLoadingIndicatorProps {
  iconName: IGRPIconProps["iconName"];
  iconClassName?: string;
}

function LinkLoadingIndicator({
  iconName,
  iconClassName,
}: LinkLoadingIndicatorProps) {
  const { pending } = useLinkStatus();

  const valid = iconName !== null && iconName !== undefined && iconName !== "";

  return (
    <>
      {valid ? (
        <IGRPIcon
          iconName={pending ? "LoaderCircle" : iconName}
          strokeWidth={2}
          className={cn(iconClassName, pending && "animate-spin")}
        />
      ) : (
        pending && (
          <IGRPIcon
            iconName="LoaderCircle"
            strokeWidth={2}
            className={cn(iconClassName, pending && "animate-spin")}
          />
        )
      )}
    </>
  );
}
