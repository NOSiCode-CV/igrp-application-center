import "server-only";

import { cache } from "react";

import { makeQueryClient } from "./query-client";

// Per-request server-side QueryClient. Memoized with React's cache() so all
// server components in the same request share one instance. Uses the same
// `makeQueryClient` defaults as the client provider so SSR-prefetched queries
// hydrate with matching staleTime/gcTime/retry behaviour.
export const getQueryClient = cache(() => makeQueryClient());
