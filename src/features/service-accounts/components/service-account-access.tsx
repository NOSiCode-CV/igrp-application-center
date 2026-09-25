"use client";

import { useMemo } from "react";

import { permissionNamesOf, roleIdsOf } from "../lib/service-account-utils";
import { useRoleDetails } from "../use-role-details";
import { useServiceAccount } from "../use-service-accounts";
import { EffectivePermissionsCard } from "./effective-permissions-card";
import { ServiceAccountPermissionsSection } from "./service-account-permissions-section";
import { ServiceAccountRolesSection } from "./service-account-roles-section";

export function ServiceAccountAccess({ id }: { id: string }) {
  const { data: account } = useServiceAccount(id);
  const roleIds = useMemo(() => (account ? roleIdsOf(account) : []), [account]);
  const directNames = useMemo(
    () => (account ? permissionNamesOf(account) : []),
    [account],
  );
  const roleDetails = useRoleDetails(roleIds);
  if (!account) return null;
  return (
    <>
      <EffectivePermissionsCard
        roles={roleDetails.roles}
        directNames={directNames}
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
