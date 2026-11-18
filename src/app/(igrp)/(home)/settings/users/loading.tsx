import { Skeleton } from "@igrp/igrp-framework-react-design-system";

/**
 * Shaped like the loaded page — header with its action button, the three tabs,
 * the table's filter row, then rows. The previous version showed a bare title,
 * one full-width bar and eight rows: a layout this route does not have, so the
 * content jumped on hydration and the skeleton described the wrong screen.
 */
export default function Loading() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className="h-10 w-48" />
      </div>

      <div className="flex gap-2">
        <Skeleton className="h-9 w-36" />
        <Skeleton className="h-9 w-44" />
        <Skeleton className="h-9 w-44" />
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row items-start gap-4 w-full">
          <Skeleton className="h-9 w-full max-w-sm" />
          <Skeleton className="h-9 w-28" />
        </div>
        <div className="flex flex-col gap-2">
          {Array.from({ length: 8 }).map((_, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton loader
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}
