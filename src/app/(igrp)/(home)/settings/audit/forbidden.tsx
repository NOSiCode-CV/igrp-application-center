import { IGRPForbidden } from "@igrp/framework-next-ui";
import { getTranslations } from "next-intl/server";

import { getCurrentUserRoles } from "@/actions/user";
import { auditForbiddenCopy } from "@/features/audit/lib/forbidden-copy";

/* Replaces the (igrp) 403 for this segment only. If the roles lookup fails,
   fall back to the generic screen rather than guessing. */
export default async function AuditForbidden() {
  const t = await getTranslations("audit");
  const roles = await getCurrentUserRoles();
  const copy = auditForbiddenCopy(t, roles.success ? roles.data.length : null);
  return <IGRPForbidden {...copy} />;
}
