"use client";

import { useRoleDetails } from "../use-role-details";
import { useServiceAccount } from "../use-service-accounts";
import { EffectivePermissionsCard } from "./effective-permissions-card";
import { ServiceAccountPermissionsSection } from "./service-account-permissions-section";
import { ServiceAccountRolesSection } from "./service-account-roles-section";

const NO_IDS: number[] = [];

export function ServiceAccountAccess({ id }: { id: string }) {
  const { data: account } = useServiceAccount(id);
  const roleDetails = useRoleDetails(account?.roleIds ?? NO_IDS);
  if (!account) return null;
  return (
    <>
      <EffectivePermissionsCard
        roles={roleDetails.roles}
        directNames={account.permissionNames ?? []}
        isLoading={roleDetails.isLoading}
        isError={roleDetails.isError}
      />
      <ServiceAccountRolesSection
        account={account}
        roles={roleDetails.roles}
        isLoading={roleDetails.isLoading}
        isError={roleDetails.isError}
        onRetry={roleDetails.refetch}
      />
      <ServiceAccountPermissionsSection account={account} />
    </>
  );
}
