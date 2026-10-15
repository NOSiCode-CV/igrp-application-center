import { IGRPBadge } from "@igrp/igrp-framework-react-design-system";

import { statusDisplay } from "../lib/audit-labels";

export function AuditStatusBadge({ status }: { status?: string | null }) {
  const display = statusDisplay(status);
  if (!display) return <span className="text-muted-foreground">—</span>;
  return (
    <IGRPBadge variant="soft" color={display.color}>
      {display.label}
    </IGRPBadge>
  );
}
