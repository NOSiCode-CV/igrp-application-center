"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { getBranding } from "@/actions/global-configuration";
import { unwrap } from "@/actions/types";

import type { BrandingFormValues } from "./lib/branding-mapper";
import { persistBranding } from "./lib/persist-branding";
import { brandingKeys } from "./query-keys";

/** The saved Brand (`null` when none). 404 is already mapped to `null` by the action. */
export function useBrandingConfig() {
  return useQuery({
    queryKey: brandingKeys.config(),
    queryFn: async () => unwrap(await getBranding()),
  });
}

export function useSaveBranding() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: BrandingFormValues) => persistBranding(values),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: brandingKeys.config() }),
  });
}
