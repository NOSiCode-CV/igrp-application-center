import type { AddRolesToUserRequestDTO } from "@igrp/platform-access-management-client-ts";

export interface RoleDiffResult {
  toAdd: AddRolesToUserRequestDTO;
  toRemove: string[];
}

export function computeRoleDiff(
  current: string[],
  selected: string[],
  expiresAt?: string,
): RoleDiffResult {
  const currentSet = new Set(current);
  const selectedSet = new Set(selected);

  const rolesToAdd = selected.filter((r) => !currentSet.has(r));
  const toRemove = current.filter((r) => !selectedSet.has(r));

  return {
    toAdd: {
      roles: rolesToAdd,
      ...(expiresAt !== undefined ? { expiresAt } : {}),
    },
    toRemove,
  };
}
