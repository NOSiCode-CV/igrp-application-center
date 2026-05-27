import "server-only";

import { QueryClient } from "@tanstack/react-query";
import { cache } from "react";

// Per-request server-side QueryClient. Memoized with React's cache() so all
// server components in the same request share one instance.
export const getQueryClient = cache(() => new QueryClient());
