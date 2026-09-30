"use client";

import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo } from "react";

import {
  type IGRPTabItem,
  IGRPTabs,
} from "@igrp/igrp-framework-react-design-system";
import type { IGRPUserDTO } from "@igrp/platform-access-management-client-ts";
import { useTranslations } from "next-intl";

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
}

export function UserProfileTabs({ user }: UserProfileTabsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations("users.profile.tabs");

  const tabs = useMemo<IGRPTabItem[]>(
    () => [
      {
        label: t("departments"),
        value: "departments",
        content: <DepartmentListSimple />,
      },
      {
        label: t("applications"),
        value: "applications",
        content: <UserApplications />,
      },
      { label: t("roles"), value: "roles", content: <ProfileRoleList /> },
      {
        label: t("signature"),
        value: "signature",
        content: <UserSignature user={user} />,
      },
    ],
    [user, t],
  );

  const requested = searchParams.get("tab");
  const value =
    requested && tabs.some((tab) => tab.value === requested)
      ? requested
      : tabs[0].value;

  const handleValueChange = (next: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", next);
    router.replace(`?${params.toString()}`, { scroll: false });
  };

  return (
    <IGRPTabs
      value={value}
      onValueChange={handleValueChange}
      items={tabs}
      className="min-w-0"
      tabContentClassName="px-0"
      orientation="horizontal"
    />
  );
}
