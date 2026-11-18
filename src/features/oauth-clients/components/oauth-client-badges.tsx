import { Badge, cn } from "@igrp/igrp-framework-react-design-system";
import { useTranslations } from "next-intl";

import { getClientKind } from "../lib/oauth-client-utils";

export function ClientKindBadge({
  grantTypes,
}: {
  grantTypes: readonly string[];
}) {
  const t = useTranslations("oauthClients");
  const kind = getClientKind(grantTypes);
  return (
    <Badge
      variant="secondary"
      className={cn(
        kind === "web"
          ? "bg-info-subtle text-info-subtle-foreground"
          : "bg-primary-subtle text-primary-subtle-foreground",
      )}
    >
      {t(`kind.${kind}`)}
    </Badge>
  );
}

export function ActiveBadge({
  active,
  feminine,
}: {
  active: boolean;
  feminine?: boolean;
}) {
  const t = useTranslations("oauthClients.badge");
  const label = active
    ? feminine
      ? t("activeFeminine")
      : t("active")
    : feminine
      ? t("inactiveFeminine")
      : t("inactive");
  return (
    <Badge
      variant="secondary"
      className={cn(
        "gap-1.5",
        active
          ? "bg-success-subtle text-success-subtle-foreground"
          : "bg-muted text-muted-foreground",
      )}
    >
      <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />
      {label}
    </Badge>
  );
}
