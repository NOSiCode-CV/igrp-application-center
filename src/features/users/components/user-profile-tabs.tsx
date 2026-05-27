"use client";

import {
  type IGRPTabItem,
  IGRPTabs,
} from "@igrp/igrp-framework-react-design-system";
import type { IGRPUserDTO } from "@igrp/platform-access-management-client-ts";
import dynamic from "next/dynamic";
import { useMemo } from "react";
import { TabLoading } from "./tab-loading";

const DepartmentListSimple = dynamic(
  () =>
    import("@/features/departments/components/dept-list-simple-container").then(
      (m) => m.DepartmentListSimple,
    ),
  { ssr: false, loading: () => <TabLoading /> },
);

const UserApplications = dynamic(() => import("./user-applications"), {
  ssr: false,
  loading: () => <TabLoading />,
});

const ProfileRoleList = dynamic(
  () => import("@/features/profile/components/profile-role-list"),
  { ssr: false, loading: () => <TabLoading /> },
);

const UserSignature = dynamic(() => import("./user-signature"), {
  ssr: false,
  loading: () => <TabLoading />,
});

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
