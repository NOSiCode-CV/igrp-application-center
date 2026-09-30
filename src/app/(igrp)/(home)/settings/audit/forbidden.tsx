import { IGRPForbidden } from "@igrp/framework-next-ui";

import { getCurrentUserRoles } from "@/actions/user";
import { auditForbiddenCopy } from "@/features/audit/lib/forbidden-copy";

/* Replaces the (igrp) 403 for this segment only. If the roles lookup fails,
   fall back to the generic screen rather than guessing. */
export default async function AuditForbidden() {
  const roles = await getCurrentUserRoles();
  const copy = auditForbiddenCopy(roles.success ? roles.data.length : null);
  return <IGRPForbidden {...copy} />;
}
