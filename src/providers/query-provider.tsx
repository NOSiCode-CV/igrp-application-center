"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cache, useState } from "react";

export function QueryProvider({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

// Per-request server-side QueryClient. Memoized with React's cache() so all
// server components in the same request share one instance.
export const getQueryClient = cache(() => new QueryClient());
