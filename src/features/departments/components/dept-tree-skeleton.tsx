import { Skeleton } from "@igrp/igrp-framework-react-design-system";

/**
 * Shaped like the loaded departments page (tree sidebar + detail panel) so the
 * route skeleton and the client loading state paint the same layout.
 */
export function DeptTreeSkeleton() {
  return (
    <div className="flex gap-4" aria-busy="true">
      <div className="flex flex-col gap-2 w-72">
        {Array.from({ length: 10 }).map((_, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton loader
          <Skeleton key={i} className="h-9 w-full" />
        ))}
      </div>
      <Skeleton className="h-96 flex-1" />
    </div>
  );
}
