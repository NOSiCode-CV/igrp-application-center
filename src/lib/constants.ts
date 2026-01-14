import type { IGRPOptionsProps } from "@igrp/igrp-framework-react-design-system";
import { statusSchema } from "@/schemas/global";

export const ROUTES = {
  APPLICATIONS: "/settings/applications",
  NEW_APPS: "/settings/applications/new",
  USERS: "/settings/users",
  USER_PROFILE: "/profile",
  DEPARTMENTS: "/settings/departments",
  DEPARTMENTS_ROLE: "roles",
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
