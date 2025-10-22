import { statusSchema } from "@/schemas/global";
import { IGRPOptionsProps } from "@igrp/igrp-framework-react-design-system";

export const ROUTES = {
  APPLICATIONS: "/applications",
  NEW_APPS: "/applications/new",
  USERS: "/users",
  USER_PROFILE: "/users/profile",
  DEPARTMENTS: "/departments",
  DEPARTMENTS_ROLE: "roles",
  EDIT: "/edit",
} as const;

export const STATUS_OPTIONS: IGRPOptionsProps[] = [
  { value: statusSchema.enum.ACTIVE, label: "Ativo" },
  { value: statusSchema.enum.INACTIVE, label: "Inativo" },
];

export const OPEN_TYPE_VIEW = "view";
