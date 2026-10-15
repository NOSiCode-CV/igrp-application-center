"use client";

import type { Route } from "next";
import Link from "next/link";

import {
  Button,
  cn,
  IGRPIcon,
  type IGRPIconName,
} from "@igrp/igrp-framework-react-design-system";

/**
 * Table cells shared by the two Accounts tabs. An OAuth client and the
 * service account that wraps it are two halves of one machine identity, so
 * each tab renders the other half with the same `LinkedIdentity` cell — the
 * pairing reads the same whichever side the admin starts from.
 */

/** A client ID with its copy button — the thing admins reach for most. */
export function ClientIdText({
  clientId,
  onCopy,
}: {
  clientId: string;
  onCopy: (clientId: string) => void;
}) {
  return (
    <span className="flex min-w-0 items-center gap-1">
      <span className="truncate font-mono text-xs text-muted-foreground">
        {clientId}
      </span>
      <CopyClientIdButton clientId={clientId} onCopy={onCopy} />
    </span>
  );
}

export function CopyClientIdButton({
  clientId,
  onCopy,
}: {
  clientId: string;
  onCopy: (clientId: string) => void;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-xs"
      className="shrink-0 text-muted-foreground"
      aria-label={`Copiar client ID ${clientId}`}
      onClick={() => onCopy(clientId)}
    >
      <IGRPIcon iconName="Copy" aria-hidden="true" />
    </Button>
  );
}

/** The row's own name, linking to its detail page. */
export function IdentityName<T extends string>({
  href,
  children,
}: {
  href: Route<T>;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="truncate rounded-sm font-medium underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {children}
    </Link>
  );
}

/** The other half of the pair: an icon tile plus the name, as one link. */
export function LinkedIdentity<T extends string>({
  href,
  iconName,
  label,
  mono = false,
}: {
  href: Route<T>;
  iconName: IGRPIconName;
  label: string;
  /** Set when the label is an identifier (a client ID) rather than a name. */
  mono?: boolean;
}) {
  return (
    <Link
      href={href}
      className="group inline-flex max-w-full items-center gap-2 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-primary-subtle text-primary-subtle-foreground">
        <IGRPIcon iconName={iconName} aria-hidden="true" size={14} />
      </span>
      <span
        className={cn(
          "truncate underline-offset-4 group-hover:underline",
          mono ? "font-mono text-xs" : "text-sm",
        )}
      >
        {label}
      </span>
    </Link>
  );
}

/** Application name over its code; the code alone when the name is unknown. */
export function ApplicationCell({
  code,
  name,
}: {
  code?: string;
  name?: string;
}) {
  if (!code) {
    return <span className="text-muted-foreground">Sem aplicação</span>;
  }
  if (!name || name === code) {
    return <span className="font-mono text-xs">{code}</span>;
  }
  return (
    <span className="flex min-w-0 flex-col gap-0.5">
      <span className="truncate">{name}</span>
      <span className="truncate font-mono text-xs text-muted-foreground">
        {code}
      </span>
    </span>
  );
}
