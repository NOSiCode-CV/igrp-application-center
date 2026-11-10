export const ROUTES = {
  APPLICATIONS: "/settings/applications",
  NEW_APPS: "/settings/applications/new",
  USERS: "/settings/users",
  USER_PROFILE: "/profile",
  DEPARTMENTS: "/settings/departments",
  DEPARTMENTS_ROLE: "roles",
  ACCOUNTS: "/settings/accounts",
  OAUTH_CLIENTS: "/settings/accounts/clients",
  OAUTH_CLIENT_NEW: "/settings/accounts/clients/new",
  SERVICE_ACCOUNTS: "/settings/accounts/services",
  SERVICE_ACCOUNT_NEW: "/settings/accounts/services/new",
  EDIT: "/edit",
} as const;

export const OPEN_TYPE_VIEW = "view";

export const config = {
  minioUrl: process.env.NEXT_PUBLIC_IGRP_MINIO_URL || "",
} as const;

export const AUDIT_VIEW_PERMISSION = "igrp.audit.view";

export const CUSTOMIZE_PERMISSION = "igrp.applications.customize";

export const APPLICATIONS_LIST_PERMISSION = "igrp.applications.list";
export const APPLICATIONS_VIEW_PERMISSION = "igrp.applications.view";
export const USERS_LIST_PERMISSION = "igrp.users.list";
export const USERS_VIEW_PERMISSION = "igrp.users.view";
export const DEPARTMENTS_LIST_PERMISSION = "igrp.departments.list";
export const CLIENT_LIST_PERMISSION = "igrp.client.list";
export const CLIENT_VIEW_PERMISSION = "igrp.client.view";
export const CLIENT_CREATE_PERMISSION = "igrp.client.create";
