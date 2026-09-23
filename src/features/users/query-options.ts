import type { UserFilters } from "@igrp/platform-access-management-client-ts";
import { queryOptions } from "@tanstack/react-query";

import { unwrap } from "@/actions/types";
import { getCurrentUser, getUser, getUsers } from "@/actions/user";

import { currentUserKeys, userKeys } from "./query-keys";

export const userListOptions = (filters?: UserFilters) =>
  queryOptions({
    queryKey: userKeys.list(filters),
    queryFn: async () => unwrap(await getUsers(filters)),
  });

export const userByIdOptions = (id: string) =>
  queryOptions({
    queryKey: userKeys.detail(id),
    queryFn: async () => unwrap(await getUser(id)),
    enabled: !!id,
  });

export const currentUserOptions = () =>
  queryOptions({
    queryKey: currentUserKeys.detail(),
    queryFn: async () => unwrap(await getCurrentUser()),
  });
