import { Skeleton } from "@igrp/igrp-framework-react-design-system";

/**
 * Shaped like the loaded applications page (header + card grid) so the route
 * skeleton and the client loading state paint the same layout.
 */
export function AppListSkeleton() {
  return (
    <div className="flex flex-col gap-10" aria-busy="true">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-4 w-80" />
        </div>
        <Skeleton className="h-10 w-40" />
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton loader
          <Skeleton key={i} className="h-44 w-full rounded-lg" />
        ))}
      </div>
    </div>
  );
}
