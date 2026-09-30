import { Skeleton } from "@igrp/igrp-framework-react-design-system";

/**
 * Shaped like the loaded user detail (header + tab bar + panel) so the route
 * skeleton and the client loading state paint the same layout and the page
 * does not jump on hydration.
 */
export function UserDetailSkeleton() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true">
      <div className="flex items-center gap-4">
        <Skeleton className="size-16 rounded-full" />
        <div className="flex flex-col gap-2">
          <Skeleton className="h-6 w-56" />
          <Skeleton className="h-4 w-72" />
        </div>
      </div>

      <div className="flex gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton loader
          <Skeleton key={i} className="h-9 w-28" />
        ))}
      </div>

      <Skeleton className="h-80 w-full rounded-lg" />
    </div>
  );
}
