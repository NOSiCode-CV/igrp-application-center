import { Skeleton } from "@igrp/igrp-framework-react-design-system";

/**
 * Shaped like the loaded applications page (header + card grid) so the route
 * skeleton and the client loading state paint the same layout.
 */
export function AppListSkeleton() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-4 w-80" />
        </div>
        <Skeleton className="h-10 w-40" />
      </div>

      {/* Toolbar: search + status filter. It was missing, so the skeleton
          showed a layout the loaded page does not have and the grid jumped
          down by a row's height on hydration. */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row items-start gap-4 w-full">
          <Skeleton className="h-9 w-full max-w-sm" />
          <Skeleton className="h-9 w-28" />
        </div>

        <div className="flex flex-col gap-3">
          <Skeleton className="h-5 w-32" />
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton loader
              <Skeleton key={i} className="h-44 w-full rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
