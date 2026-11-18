import { Skeleton } from "@igrp/igrp-framework-react-design-system";

/** Shaped like the editor: header, tabs with the mode switch, groups, preview. */
export default function Loading() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-7 w-56" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,28rem)]">
        <div className="flex flex-col gap-3">
          <Skeleton className="h-9 w-48" />
          {Array.from({ length: 6 }).map((_, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton loader
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    </div>
  );
}
