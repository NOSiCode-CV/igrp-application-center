"use client";

import type { ReactNode } from "react";

import type { QueryClient } from "@tanstack/react-query";
import { environmentManager, QueryClientProvider } from "@tanstack/react-query";

import { makeQueryClient } from "./query-client";

let browserClient: QueryClient | undefined;

function getQueryClient(): QueryClient {
  if (environmentManager.isServer()) return makeQueryClient();
  browserClient ??= makeQueryClient();
  return browserClient;
}

export function IGRPQueryProvider({ children }: { children: ReactNode }) {
  const client = getQueryClient();
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
