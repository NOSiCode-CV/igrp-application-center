import type { IGRPOptionsProps } from "@igrp/igrp-framework-react-design-system";

import { statusSchema } from "@/schemas/global";

export const ROUTES = {
  APPLICATIONS: "/settings/applications",
  NEW_APPS: "/settings/applications/new",
  USERS: "/settings/users",
  USER_PROFILE: "/profile",
  DEPARTMENTS: "/settings/departments",
  DEPARTMENTS_ROLE: "roles",
  ACCOUNTS: "/settings/accounts",
  OAUTH_CLIENTS: "/settings/accounts/clients",
  SERVICE_ACCOUNTS: "/settings/accounts/services",
  SERVICE_ACCOUNT_NEW: "/settings/accounts/services/new",
  EDIT: "/edit",
} as const;

export const STATUS_OPTIONS: IGRPOptionsProps[] = [
  { value: statusSchema.enum.ACTIVE, label: "Ativo" },
  { value: statusSchema.enum.INACTIVE, label: "Inativo" },
] as const;

export const OPEN_TYPE_VIEW = "view";

export const config = {
  minioUrl: process.env.NEXT_PUBLIC_IGRP_MINIO_URL || "",
} as const;

/* Gates the whole audit surface (/settings/audit, its actions and routes).
   Contains dots, so the framework matches it verbatim against the token's
   permissions — it is never qualified with the active department. */
export const AUDIT_VIEW_PERMISSION = "igrp.audit.view";
