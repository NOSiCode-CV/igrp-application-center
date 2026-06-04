import "server-only";

import { cache } from "react";

import { QueryClient } from "@tanstack/react-query";

// Per-request server-side QueryClient. Memoized with React's cache() so all
// server components in the same request share one instance.
export const getQueryClient = cache(() => new QueryClient());
