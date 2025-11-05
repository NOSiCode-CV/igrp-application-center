"use client";

import {
  IGRPButtonPrimitive,
  IGRPIcon,
  type IGRPIconProps,
} from "@igrp/igrp-framework-react-design-system";
import Link, { useLinkStatus } from "next/link";
import { cn } from "@/lib/utils";

type IGRPBtnProps = React.ComponentProps<typeof IGRPButtonPrimitive>;

export interface ButtonLinkProps extends React.ComponentProps<typeof Link> {
  label?: string;
  icon: IGRPIconProps["iconName"];
  iconClassName?: string;
  customIcon?: React.ReactNode;
  variant?: IGRPBtnProps["variant"];
  btnClassName?: string;
  size?: IGRPBtnProps["size"];
}

export function ButtonLink({
  label,
  icon,
  iconClassName,
  variant,
  btnClassName,
  size,
  ...props
}: ButtonLinkProps) {
  return (
    <IGRPButtonPrimitive
      asChild
      variant={variant || "default"}
      className={btnClassName}
      size={size}
    >
      <Link {...props}>
        <LinkLoadingIndicator iconName={icon} iconClassName={iconClassName} />
        {label}
      </Link>
    </IGRPButtonPrimitive>
  );
}

interface LinkLoadingIndicatorProps {
  iconName: IGRPIconProps["iconName"];
  iconClassName?: string;
  //                      customIcon?: React.ReactNode;
}

function LinkLoadingIndicator({
  iconName,
  iconClassName,
  // customIcon = undefined,
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
