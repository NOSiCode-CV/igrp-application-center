"use client";

import {
  type IGRPTabItem,
  IGRPTabs,
} from "@igrp/igrp-framework-react-design-system";
import type { IGRPUserDTO } from "@igrp/platform-access-management-client-ts";
import { useMemo } from "react";
import { DepartmentListSimple } from "@/features/departments/components/dept-list-simple-container";
import ProfileRoleList from "@/features/profile/components/profile-role-list";
import UserApplications from "./user-applications";
import UserSignature from "./user-signature";

export interface UserProfileTabsProps {
  user: IGRPUserDTO;
  onUserChange: () => Promise<unknown> | undefined;
}

export function UserProfileTabs({ user, onUserChange }: UserProfileTabsProps) {
  const tabs = useMemo<IGRPTabItem[]>(
    () => [
      {
        label: "Departamentos",
        value: "departments",
        content: <DepartmentListSimple />,
      },
      {
        label: "Aplicações",
        value: "applications",
        content: <UserApplications />,
      },
      { label: "Roles", value: "roles", content: <ProfileRoleList /> },
      {
        label: "Assinatura",
        value: "signature",
        content: <UserSignature refetch={onUserChange} user={user} />,
      },
    ],
    [user, onUserChange],
  );

  return (
    <IGRPTabs
      defaultValue="departments"
      items={tabs}
      className="min-w-0"
      tabContentClassName="px-0"
      orientation="horizontal"
    />
  );
}
