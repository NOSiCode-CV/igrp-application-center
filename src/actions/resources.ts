"use server";

import type { ResourceDTO, ResourceFilters } from "@igrp/platform-access-management-client-ts";
import { getClientAccess } from "./access-client";

export async function getResources(filters?: ResourceFilters): Promise<ResourceDTO[]> {
  const client = await getClientAccess();
  try {
    const result = await client.resources.getResources(filters);
    return result.data as ResourceDTO[];
  } catch (error) {
    console.error("[resources] Não foi possível obter os dados:", error);
    throw error;
  }
}